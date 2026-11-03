import { and, asc, count, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { AppError, type FieldErrors } from "../../common/errors/app-error.js";
import { customers } from "../../db/schema/customers.js";
import { orderItems } from "../../db/schema/order-items.js";
import { orders } from "../../db/schema/orders.js";
import { products } from "../../db/schema/products.js";
import type { DB, TX } from "../../db/types.js";
import { calculateOrder } from "./helpers/calculate-order.js";
import { formatOrderNumber } from "./helpers/generate-invoice.js";
import type { CreateOrderInput, GetOrdersQuery } from "./schema.js";

type OrderRow = typeof orders.$inferSelect;
type ItemRow = typeof orderItems.$inferSelect;
type CustomerRef = { id: string; name: string };

const DAY_MS = 86_400_000;
const startOfDay = (d: string) => new Date(`${d}T00:00:00+07:00`);
const startOfNextDay = (d: string) => new Date(startOfDay(d).getTime() + DAY_MS);

const notFound = () => new AppError("Order tidak ditemukan", 404);

export function toOrderResponse(
  o: OrderRow,
  extra: { items?: ItemRow[]; customer?: CustomerRef } = {}
) {
  return {
    id: o.id,
    order_number: o.orderNumber,
    status: o.status,
    customer_id: o.customerId,
    subtotal: o.subtotal,
    discount_amount: o.discountAmount,
    grand_total: o.grandTotal,
    created_at: o.createdAt,
    updated_at: o.updatedAt,
    customer: extra.customer,
    items: extra.items?.map((i) => ({
      id: i.id,
      product_id: i.productId,
      product_name: i.productName,
      product_code: i.productCode,
      unit_price: i.unitPrice,
      quantity: i.quantity,
      subtotal: i.subtotal,
    })),
  };
}

type OrderServiceDeps = { db: DB };
type QueryExecutor = DB | TX;

export function createOrderService({ db }: OrderServiceDeps) {
  async function getOrderById(id: string) {
    const [row] = await db
      .select({ order: orders, customer: { id: customers.id, name: customers.name } })
      .from(orders)
      .innerJoin(customers, eq(customers.id, orders.customerId))
      .where(eq(orders.id, id))
      .limit(1);
    if (!row) throw notFound();

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id))
      .orderBy(asc(orderItems.createdAt), asc(orderItems.id));

    return toOrderResponse(row.order, { items, customer: row.customer });
  }

  async function transitionError(
    executor: QueryExecutor, 
    id: string, 
    target: string
  ) {
    const [existing] = await executor
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!existing) return notFound();
    
    return new AppError(
      `Order berstatus ${existing.status} tidak dapat diubah menjadi ${target}`,
      409
    );
  }

  return {
    getOrderById,

    async getOrders(query: GetOrdersQuery) {
      const { page, per_page, status, date_from, date_to } = query;
      const where = and(
        status ? eq(orders.status, status) : undefined,
        date_from ? gte(orders.createdAt, startOfDay(date_from)) : undefined,
        date_to ? lt(orders.createdAt, startOfNextDay(date_to)) : undefined
      );

      const [rows, countRows] = await Promise.all([
        db
          .select({ order: orders, customer: { id: customers.id, name: customers.name } })
          .from(orders)
          .innerJoin(customers, eq(customers.id, orders.customerId))
          .where(where)
          .orderBy(desc(orders.createdAt), desc(orders.id))
          .limit(per_page)
          .offset((page - 1) * per_page),
        db.select({ total: count() }).from(orders).where(where),
      ]);

      return {
        items: rows.map((r) => toOrderResponse(r.order, { customer: r.customer })),
        meta: { page, per_page, total: countRows[0]?.total ?? 0 },
      };
    },

    async createOrder(input: CreateOrderInput, userId: string) {
      const orderId = await db.transaction(async (tx) => {
        const [customer] = await tx
          .select({ id: customers.id })
          .from(customers)
          .where(eq(customers.id, input.customer_id))
          .limit(1);
        if (!customer) {
          throw new AppError("Validasi gagal", 422, {
            customer_id: ["Pelanggan tidak ditemukan"],
          });
        }

        const productIds = input.items.map((i) => i.product_id);
        const locked = await tx
          .select()
          .from(products)
          .where(inArray(products.id, productIds))
          .orderBy(asc(products.id))
          .for("update");
        const byId = new Map(locked.map((p) => [p.id, p]));

        const errors: FieldErrors = {};
        let hasStockError = false;
        input.items.forEach((item, i) => {
          const p = byId.get(item.product_id);
          if (!p) {
            errors[`items.${i}.product_id`] = ["Produk tidak ditemukan"];
          } else if (p.stock < item.quantity) {
            hasStockError = true;
            errors[`items.${i}.quantity`] = [
              `Stok ${p.name} tersisa ${p.stock}, diminta ${item.quantity}`,
            ];
          }
        });
        if (Object.keys(errors).length > 0) {
          throw new AppError(
            hasStockError ? "Stok tidak mencukupi" : "Validasi gagal",
            hasStockError ? 409 : 422,
            errors
          );
        }

        const calc = calculateOrder(
          input.items.map((item) => {
            const p = byId.get(item.product_id)!;
            return {
              productId: p.id,
              productName: p.name,
              productCode: p.productCode,
              unitPrice: p.price,
              quantity: item.quantity,
            };
          })
        );

        const seqRows = await tx.execute<{ n: string }>(sql`select nextval('order_number_seq') as n`);
        const orderNumber = formatOrderNumber(Number(seqRows[0]!.n));

        const [order] = await tx
          .insert(orders)
          .values({
            orderNumber,
            customerId: input.customer_id,
            createdBy: userId,
            subtotal: calc.subtotal,
            discountAmount: calc.discountAmount,
            grandTotal: calc.grandTotal,
          })
          .returning({ id: orders.id });

        await tx.insert(orderItems).values(
          calc.items.map((i) => ({
            orderId: order!.id,
            productId: i.productId,
            productName: i.productName,
            productCode: i.productCode,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
            subtotal: i.subtotal,
          }))
        );

        for (const i of calc.items) {
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} - ${i.quantity}` })
            .where(eq(products.id, i.productId));
        }

        return order!.id;
      });

      return getOrderById(orderId);
    },

    async payOrder(id: string) {
      const [updated] = await db
        .update(orders)
        .set({ status: "PAID" })
        .where(and(eq(orders.id, id), eq(orders.status, "PENDING")))
        .returning({ id: orders.id });

      if (!updated) throw await transitionError(db, id, "PAID");
      return getOrderById(id);
    },

    async cancelOrder(id: string) {
      await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(orders)
          .set({ status: "CANCELLED" })
          .where(and(eq(orders.id, id), inArray(orders.status, ["PENDING", "PAID"])))
          .returning({ id: orders.id });

        if (!updated) throw await transitionError(tx, id, "CANCELLED");

        const items = await tx
          .select({ productId: orderItems.productId, quantity: orderItems.quantity })
          .from(orderItems)
          .where(eq(orderItems.orderId, id))
          .orderBy(asc(orderItems.productId));

        for (const item of items) {
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} + ${item.quantity}` })
            .where(eq(products.id, item.productId));
        }
      });
      return getOrderById(id);
    },
  };
}

export type OrderService = ReturnType<typeof createOrderService>;