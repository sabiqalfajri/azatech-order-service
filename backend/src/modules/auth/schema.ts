import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password wajib diisi"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const loginResponseSchema = z.object({
  access_token: z.string(),
  user: z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
  }),
});