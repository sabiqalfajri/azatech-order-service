import { z } from "zod";

export const productIdParamSchema = z.object({
  id: z.uuid(),
})

export const getProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).optional(),
})

export const productBodySchema = z.object({
  product_code: z.string().trim().min(1, "Kode produk wajib diisi").max(50),
  name: z.string().trim().min(1, "Nama produk wajib diisi"),
  price: z.number().int("Harga harus bilangan bulat").positive("Harga harus lebih dari 0"),
  stock: z.number().int("Stok harus bilangan bulat").min(0, "Stok tidak boleh minus"),
})

export const productSchema = z.object({
  id: z.uuid(),
  product_code: z.string(),
  name: z.string(),
  price: z.number().int(),
  stock: z.number().int(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export type GetProductsQuery = z.infer<typeof getProductsQuerySchema>
export type CreateProductInput = z.infer<typeof productBodySchema>
export type UpdateProductInput = z.infer<typeof productBodySchema>
export type ProductIdParams = z.infer<typeof productIdParamSchema>;