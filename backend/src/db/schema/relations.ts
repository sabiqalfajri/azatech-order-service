import { relations } from "drizzle-orm";
import { users } from "./users.js";
import { orders } from "./orders.js";
import { customers } from "./customers.js";
import { products } from "./products.js";
import { orderItems } from "./order-items.js";

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders)
}))

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders)
}))

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems)
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id]
  }),
  creator: one(users, {
    fields: [orders.createdBy],
    references: [users.id]
  }),
  items: many(orderItems)
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id]
  })
}))