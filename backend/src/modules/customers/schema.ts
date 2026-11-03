import { z } from "zod";

export const getCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).optional(),
});

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1, "Nama pelanggan wajib diisi").max(100),
  email: z.email("Format email tidak valid").optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{6,20}$/, "Format nomor telepon tidak valid")
    .optional(),
});

export const customerSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

export type GetCustomersQuery = z.infer<typeof getCustomersQuerySchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;