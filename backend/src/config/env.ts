import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // COOKIE_SECRET: z.string().min(32),
  FRONTEND_URL: z.url().transform((v) => new URL(v).origin),
  DATABASE_URL: z.url(),
})

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error("Invalid environment variables:", z.treeifyError(parseResult.error));
  process.exit(1); 
}

export const env = parseResult.data;