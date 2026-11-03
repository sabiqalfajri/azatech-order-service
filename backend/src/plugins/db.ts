import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { checkDbConnection, db, sql } from "../db/client.js";

export const dbPlugin: FastifyPluginAsync = fp(async (app) => {
  app.decorate("db", db);
  app.decorate("sql", sql);

  app.addHook("onReady", async () => {
    await checkDbConnection();
    app.log.info("Database connected");
  });

  app.addHook("onClose", async () => {
    await sql.end();
    app.log.info("Database connection closed");
  });
})