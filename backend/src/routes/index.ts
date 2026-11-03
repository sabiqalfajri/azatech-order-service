import type { FastifyInstance } from "fastify";
import { authRoutes } from "../modules/auth/route.js";
import { productRoutes } from "../modules/products/route.js";
import { orderRoutes } from "../modules/orders/routes.js";
import { customerRoutes } from "../modules/customers/routes.js";

export async function registerRoutes(app: FastifyInstance) {
  await app.register(authRoutes, {
    prefix: "/api/auth",
  });

  await app.register(productRoutes, {
    prefix: "/api/products",
  });

  app.register(orderRoutes, {
    prefix: "/api/orders",
  });

  app.register(customerRoutes, {
    prefix: "/api/customers",
  });
}