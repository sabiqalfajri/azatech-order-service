import type { FastifyReply, FastifyRequest } from "fastify";
import type { Sql } from "postgres";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { JwtPayload } from "../modules/auth/token.types.js";

declare module "fastify" {
  interface FastifyInstance {
    db: PostgresJsDatabase<typeof schema>
    sql: Sql

    authenticate(
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<void>;
  }

  interface FastifyRequest {
    access?: JwtPayload;
  }
}