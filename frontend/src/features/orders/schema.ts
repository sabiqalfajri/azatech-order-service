import { z } from "zod";

export const createOrderFormSchema = z.object({
  customer_id: z.string().min(1, "Pilih pelanggan"),
  items: z
    .array(
      z.object({
        product_id: z.string().min(1, "Pilih produk"),
        quantity: z
          .number({ error: "Jumlah wajib diisi" })
          .int("Jumlah harus bilangan bulat")
          .min(1, "Jumlah minimal 1"),
      })
    )
    .min(1, "Tambahkan minimal satu produk")
    .superRefine((items, ctx) => {
      const seen = new Set<string>();
      items.forEach((item, i) => {
        if (!item.product_id) return;
        if (seen.has(item.product_id)) {
          ctx.addIssue({
            code: "custom",
            path: [i, "product_id"],
            message: "Produk sudah dipilih di baris lain",
          });
        }
        seen.add(item.product_id);
      });
    }),
});

export type CreateOrderFormValues = z.infer<typeof createOrderFormSchema>;