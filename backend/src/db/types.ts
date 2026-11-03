import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "./schema/index.js";

export type DB = PostgresJsDatabase<typeof schema>;

export type TX = Parameters<Parameters<DB["transaction"]>[0]>[0];