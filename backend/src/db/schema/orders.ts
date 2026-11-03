import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  pgSequence,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { customers } from "./customers.js";
import { users } from "./users.js";
import { sql } from "drizzle-orm";

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "PAID",
  "CANCELLED",
]);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  status: orderStatusEnum("status")
    .notNull()
    .default("PENDING"),
  subtotal: integer("subtotal").notNull(),
  discountAmount: integer("discount_amount").notNull().default(0),
  grandTotal: integer("grand_total").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  check("orders_subtotal_check", sql`${table.subtotal} >= 0`),
  check("orders_discount_check", sql`${table.discountAmount} >= 0 AND ${table.discountAmount} <= ${table.subtotal}`),
  check("orders_grand_total_check", sql`${table.grandTotal} = ${table.subtotal} - ${table.discountAmount}`),
  index("orders_customer_id_idx").on(table.customerId),
  index("orders_status_idx").on(table.status),
  index("orders_created_at_idx").on(table.createdAt),
])

export const orderNumberSeq = pgSequence("order_number_seq");
export type OrderRow = typeof orders.$inferSelect