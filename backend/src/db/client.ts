import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema/index.js";
import { env } from "../config/env.js";

const databaseUrl = env.DATABASE_URL;

export const sql = postgres(databaseUrl, {
  max: Number(process.env.DB_POOL_MAX ?? 20),
  idle_timeout: Number(process.env.DB_IDLE_TIMEOUT ?? 30),
  connect_timeout: Number(process.env.DB_CONNECT_TIMEOUT ?? 10),
  prepare: process.env.NODE_ENV === "production",
});

export const db = drizzle(sql, {
  schema,
  logger: env.NODE_ENV === "development",
});

export async function checkDbConnection() {
  await sql`select 1`;
}