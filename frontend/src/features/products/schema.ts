import { z } from "zod";

export const productFormSchema = z.object({
  product_code: z.string().trim().min(1, "Kode produk wajib diisi").max(50, "Maksimal 50 karakter"),
  name: z.string().trim().min(1, "Nama produk wajib diisi"),
  price: z
    .number({ error: "Harga wajib diisi" })
    .int("Harga harus bilangan bulat")
    .positive("Harga harus lebih dari 0"),
  stock: z
    .number({ error: "Stok wajib diisi" })
    .int("Stok harus bilangan bulat")
    .min(0, "Stok tidak boleh minus"),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;