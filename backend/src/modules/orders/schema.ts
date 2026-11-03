import { z } from "zod";

export const orderIdParamSchema = z.object({ id: z.uuid() });
export const orderStatusSchema = z.enum(["PENDING", "PAID", "CANCELLED"]);

export const createOrderSchema = z.object({
  customer_id: z.uuid(),
  items: z
    .array(
      z.object({
        product_id: z.uuid(),
        quantity: z.number().int("Quantity harus bilangan bulat").min(1, "Quantity minimal 1"),
      })
    )
    .min(1, "Order minimal berisi satu produk")
    .superRefine((items, ctx) => {
      const seen = new Set<string>();
      items.forEach((item, i) => {
        if (seen.has(item.product_id)) {
          ctx.addIssue({
            code: "custom",
            path: [i, "product_id"],
            message: "Produk duplikat dalam satu order",
          });
        }
        seen.add(item.product_id);
      });
    }),
});

export const getOrdersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    per_page: z.coerce.number().int().min(1).max(100).default(10),
    status: orderStatusSchema.optional(),
    date_from: z.iso.date().optional(), 
    date_to: z.iso.date().optional(),
  })
  .refine((q) => !q.date_from || !q.date_to || q.date_from <= q.date_to, {
    message: "date_from tidak boleh setelah date_to",
    path: ["date_from"],
  });

export const orderItemResponseSchema = z.object({
  id: z.uuid(),
  product_id: z.uuid(),
  product_name: z.string(),
  product_code: z.string(),
  unit_price: z.number().int(),
  quantity: z.number().int(),
  subtotal: z.number().int(),
});

export const orderSchema = z.object({
  id: z.uuid(),
  order_number: z.string(),
  status: orderStatusSchema,
  customer_id: z.uuid(),
  subtotal: z.number().int(),
  discount_amount: z.number().int(),
  grand_total: z.number().int(),
  created_at: z.date(),
  updated_at: z.date(),
  customer: z.object({ id: z.uuid(), name: z.string() }).optional(),
  items: z.array(orderItemResponseSchema).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type GetOrdersQuery = z.infer<typeof getOrdersQuerySchema>;