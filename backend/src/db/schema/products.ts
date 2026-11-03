import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  integer, 
  timestamp,
  check
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  productCode: varchar("product_code", { length: 50 })
    .notNull()
    .unique(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  stock: integer("stock").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  check("products_price_check", sql`${table.price} > 0`),
  check("products_stock_check", sql`${table.stock} >= 0`),
])

export type ProductRow = typeof products.$inferSelect;