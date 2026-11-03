import { z } from "zod";

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;