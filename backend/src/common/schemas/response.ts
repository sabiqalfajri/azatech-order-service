import { z } from "zod";
import { ErrorResponseSchema } from "./error.js";

export const MetaSchema = z.object({
  page: z.number().int(),
  per_page: z.number().int(),
  total: z.number().int(),
});

export const successNullResponseSchema = z.null();

function successEnvelope<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    message: z.string(),
    data: dataSchema,
    meta: MetaSchema.optional(),
  });
}

function paginatedEnvelope<T extends z.ZodType>(dataSchema: T) {
  return successEnvelope(dataSchema).extend({ 
    meta: MetaSchema 
  });
}

type SuccessEnvelope<T extends z.ZodType> =
  ReturnType<typeof successEnvelope<T>>;

type WrappedResponses<T extends Record<number, z.ZodType>> = {
  [K in keyof T]: T[K] extends z.ZodType ? SuccessEnvelope<T[K]> : never;
};

export const errorResponses = {
  400: ErrorResponseSchema,
  401: ErrorResponseSchema,
  404: ErrorResponseSchema,
  409: ErrorResponseSchema,
  422: ErrorResponseSchema,
  500: ErrorResponseSchema,
} as const;

export function withDefaultResponses<T extends Record<number, z.ZodType>>(
  successResponses: T
) {
  const wrapped = Object.fromEntries(
    Object.entries(successResponses).map(([code, schema]) => [
      Number(code),
      successEnvelope(schema),
    ])
  ) as WrappedResponses<T>;

  return { ...wrapped, ...errorResponses };
}

export function withPaginatedResponse<T extends z.ZodType>(itemSchema: T) {
  return {
    200: paginatedEnvelope(z.array(itemSchema)),
    ...errorResponses,
  };
}