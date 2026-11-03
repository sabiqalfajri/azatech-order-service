import type { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { errorHandlerPlugin } from "./error-handler.js";
import { dbPlugin } from "./db.js";
import { jwtPlugin } from "./jwt.js";
import { authenticatePlugin } from "./authenticate.js";

export const registerPlugins = fastifyPlugin(async function (app: FastifyInstance) {
  await app.register(errorHandlerPlugin);
  await app.register(dbPlugin);
  await app.register(jwtPlugin);
  await app.register(authenticatePlugin);
})