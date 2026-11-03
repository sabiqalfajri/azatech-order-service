import type { FastifyPluginAsync } from "fastify";
import { createProductService } from "./services.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { getProductsQuerySchema, productBodySchema, productIdParamSchema, productSchema } from "./schema.js";
import { withDefaultResponses, withPaginatedResponse } from "../../common/schemas/response.js";
import { createProductController } from "./controller.js";

export const productRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", app.authenticate);

  const route = app.withTypeProvider<ZodTypeProvider>();

  const productService = createProductService({
    db: app.db,
  });
  const controller = createProductController({ productService });

  route.get(
    "/",
    {
      schema: {
        tags: ["Products"],
        summary: "Get products",
        querystring: getProductsQuerySchema,
        response: withPaginatedResponse(productSchema),
      },
    },
    controller.getProducts,
  );

  route.post(
    "/",
    {
      schema: {
        tags: ["Products"],
        summary: "Create product",
        body: productBodySchema,
        response: withDefaultResponses({
          201: productSchema,
        }),
      },
    },
    controller.createProduct,
  );

  route.put(
    "/:id",
    {
      schema: {
        tags: ["Products"],
        summary: "Update product",
        params: productIdParamSchema,
        body: productBodySchema,
        response: withDefaultResponses({
          200: productSchema,
        }),
      },
    },
    controller.updateProduct,
  );
}