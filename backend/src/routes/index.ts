import type { FastifyInstance } from "fastify";
import { authRoutes } from "../modules/auth/route.js";

export async function registerRoutes(app: FastifyInstance) {
  await app.register(authRoutes, {
    prefix: "/api/auth",
  });
}