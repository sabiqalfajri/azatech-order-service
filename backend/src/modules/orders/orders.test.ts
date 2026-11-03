import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../app.js";
import { customers } from "../../db/schema/customers.js";
import { orders } from "../../db/schema/orders.js";
import { products } from "../../db/schema/products.js";
import { loginAsAdmin, bearer } from "../../test/helpers/auth.js";
import { createTestData } from "../../test/helpers/test-data.js";

const testData = createTestData("ORDER");

type Item = { product_id: string, quantity: number };

describe("Orders API", () => {
  let app: FastifyInstance;
  let accessToken: string;
  let customerId: string;

  const productIds: string[] = [];

  const headers = () => bearer(accessToken);

  const makeProduct = async (stock: number, price = 100_000) => {
    const [product] = await app.db
      .insert(products)
      .values({
        productCode: testData.code(),
        name: testData.name("Produk"),
        price,
        stock,
      })
      .returning();

    productIds.push(product!.id);

    return product!;
  };

  const getStock = async (id: string) => {
    const [product] = await app.db
      .select({ stock: products.stock })
      .from(products)
      .where(eq(products.id, id));

    return product!.stock;
  };

  const placeOrder = async (items: Item[]) => {
    return app.inject({
      method: "POST",
      url: "/api/orders",
      headers: headers(),
      payload: {
        customer_id: customerId,
        items,
      },
    });
  };

  const patch = (id: string, action: "pay" | "cancel") =>
    app.inject({
      method: "PATCH",
      url: `/api/orders/${id}/${action}`,
      headers: headers(),
    });

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    accessToken = await loginAsAdmin(app);

    const [customer] = await app.db
      .insert(customers)
      .values({
        name: testData.name("Pelanggan"),
      })
      .returning();

    customerId = customer!.id;
  });

  afterAll(async () => {
    await app.db.delete(orders).where(eq(orders.customerId, customerId));

    if (productIds.length) {
      await app.db
        .delete(products)
        .where(inArray(products.id, productIds));
    }

    await app.db.delete(customers).where(eq(customers.id, customerId));

    await app.close();
  });

  it("membuat order sukses: total dihitung server dan stok berkurang", async () => {
    const product = await makeProduct(10, 100_000);

    const res = await app.inject({
      method: "POST",
      url: "/api/orders",
      headers: headers(),
      payload: {
        customer_id: customerId,
        total: 1,
        items: [
          {
            product_id: product.id,
            quantity: 2,
            unit_price: 1,
          },
        ],
      },
    });

    expect(res.statusCode).toBe(201);

    const data = res.json().data;

    expect(data.status).toBe("PENDING");
    expect(data.order_number).toMatch(/^INV-\d{8}-\d{4,}$/);
    expect(data.subtotal).toBe(200_000);
    expect(data.discount_amount).toBe(0);
    expect(data.grand_total).toBe(200_000);

    expect(data.items[0]).toMatchObject({
      unit_price: 100_000,
      quantity: 2,
      subtotal: 200_000,
    });

    expect(await getStock(product.id)).toBe(8);
  });

  it("stok tidak cukup: 409, error di item yang bermasalah, stok semua item tidak berubah", async () => {
    const a = await makeProduct(10);
    const b = await makeProduct(1);

    const res = await placeOrder([
      { product_id: a.id, quantity: 2 },
      { product_id: b.id, quantity: 5 },
    ]);

    expect(res.statusCode).toBe(409);
    expect(res.json().success).toBe(false);
    expect(res.json().errors["items.1.quantity"]).toBeDefined();
    expect(res.json().errors["items.0.quantity"]).toBeUndefined();

    expect(await getStock(a.id)).toBe(10);
    expect(await getStock(b.id)).toBe(1);
  });

  it("pembatalan mengembalikan stok", async () => {
    const product = await makeProduct(10);
    const order = (await placeOrder([
      { product_id: product.id, quantity: 4 },
    ])).json().data;

    expect(await getStock(product.id)).toBe(6);

    const res = await patch(order.id, "cancel");

    expect(res.statusCode).toBe(200);
    expect(res.json().data.status).toBe("CANCELLED");
    expect(await getStock(product.id)).toBe(10);
  });

  it("order PAID yang dibatalkan juga mengembalikan stok", async () => {
    const product = await makeProduct(10);
    const order = (await placeOrder([
      { product_id: product.id, quantity: 3 },
    ])).json().data;

    expect((await patch(order.id, "pay")).statusCode).toBe(200);

    const res = await patch(order.id, "cancel");

    expect(res.statusCode).toBe(200);
    expect(await getStock(product.id)).toBe(10);
  });

  it("transisi status yang tidak valid ditolak dengan 409", async () => {
    const product = await makeProduct(10);
    const order = (await placeOrder([
      { product_id: product.id, quantity: 1 },
    ])).json().data;

    expect((await patch(order.id, "pay")).statusCode).toBe(200);
    expect((await patch(order.id, "pay")).statusCode).toBe(409);

    expect((await patch(order.id, "cancel")).statusCode).toBe(200);
    expect((await patch(order.id, "pay")).statusCode).toBe(409);
    expect((await patch(order.id, "cancel")).statusCode).toBe(409);

    expect(await getStock(product.id)).toBe(10);
  });

  it("order yang tidak ada mengembalikan 404", async () => {
    expect((await patch(randomUUID(), "pay")).statusCode).toBe(404);

    const res = await app.inject({
      method: "GET",
      url: `/api/orders/${randomUUID()}`,
      headers: headers(),
    });

    expect(res.statusCode).toBe(404);
  });

  it.each([
    [4, 400_000, 0],
    [5, 500_000, 25_000],
    [10, 1_000_000, 100_000],
    [20, 2_000_000, 150_000],
  ])(
    "Varian A: quantity %i (subtotal %i) mendapat diskon %i",
    async (qty, subtotal, discount) => {
      const product = await makeProduct(50, 100_000);

      const res = await placeOrder([
        { product_id: product.id, quantity: qty },
      ]);

      expect(res.statusCode).toBe(201);
      expect(res.json().data).toMatchObject({
        subtotal,
        discount_amount: discount,
        grand_total: subtotal - discount,
      });
    }
  );

  it("angka order tidak berubah walaupun harga produk diubah kemudian", async () => {
    const product = await makeProduct(10, 100_000);
    const order = (await placeOrder([
      { product_id: product.id, quantity: 5 },
    ])).json().data;

    await app.db
      .update(products)
      .set({ price: 1 })
      .where(eq(products.id, product.id));

    const res = await app.inject({
      method: "GET",
      url: `/api/orders/${order.id}`,
      headers: headers(),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data).toMatchObject({
      subtotal: 500_000,
      discount_amount: 25_000,
      grand_total: 475_000,
    });

    expect(res.json().data.items[0].unit_price).toBe(100_000);
  });

  it("menolak produk duplikat dalam satu order (422)", async () => {
    const product = await makeProduct(10);

    const res = await placeOrder([
      { product_id: product.id, quantity: 1 },
      { product_id: product.id, quantity: 1 },
    ]);

    expect(res.statusCode).toBe(422);
    expect(res.json().errors["items.1.product_id"]).toBeDefined();
    expect(await getStock(product.id)).toBe(10);
  });

  it("stok tidak minus saat banyak order masuk bersamaan", async () => {
    const product = await makeProduct(3);

    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        placeOrder([{ product_id: product.id, quantity: 1 }])
      )
    );

    const statuses = results.map((res) => res.statusCode);

    expect(statuses.filter((status) => status === 201)).toHaveLength(3);
    expect(statuses.filter((status) => status === 409)).toHaveLength(5);
    expect(await getStock(product.id)).toBe(0);
  });

  it("filter status dan rentang tanggal pada riwayat order", async () => {
    const product = await makeProduct(10);
    const order = (await placeOrder([
      { product_id: product.id, quantity: 1 },
    ])).json().data;

    await patch(order.id, "pay");

    const today = new Date(
      Date.now() + 7 * 3_600_000
    ).toISOString().slice(0, 10);

    const res = await app.inject({
      method: "GET",
      url: `/api/orders?status=PAID&date_from=${today}&date_to=${today}&per_page=100`,
      headers: headers(),
    });

    expect(res.statusCode).toBe(200);

    const list = res.json().data as {
      id: string;
      status: string;
    }[];

    expect(list.every((order) => order.status === "PAID")).toBe(true);
    expect(list.some((order) => order.id === order.id)).toBe(true);
    expect(res.json().meta.total).toBeGreaterThanOrEqual(1);
  });

  it("menolak akses tanpa token (401)", async () => {
    const post = await app.inject({
      method: "POST",
      url: "/api/orders",
      payload: {},
    });

    const get = await app.inject({
      method: "GET",
      url: "/api/orders",
    });

    expect(post.statusCode).toBe(401);
    expect(get.statusCode).toBe(401);
  });
});