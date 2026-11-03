import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  check,
  index,
  unique
} from "drizzle-orm/pg-core";
import { orders } from "./orders.js";
import { products } from "./products.js";
import { sql } from "drizzle-orm";

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  productName: text("product_name").notNull(),
  productCode: text("product_code").notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  subtotal: integer("subtotal").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("order_items_quantity_check", sql`${table.quantity} > 0`),
  check("order_items_unit_price_check", sql`${table.unitPrice} > 0`),
  check("order_items_subtotal_check", sql`${table.subtotal} = ${table.unitPrice} * ${table.quantity}`),
  index("order_items_order_id_idx").on(table.orderId),
  index("order_items_product_id_idx").on(table.productId),
  unique("order_items_order_product_uq").on(
    table.orderId,
    table.productId,
  ),
])

export type OrderItemRow = typeof orderItems.$inferSelect;