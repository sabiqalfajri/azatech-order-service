import type { FastifyReply, FastifyRequest } from "fastify";

import type { ProductService } from "./services.js";
import type {
  CreateProductInput,
  GetProductsQuery,
  ProductIdParams,
  UpdateProductInput,
} from "./schema.js";

type ProductControllerDeps = {
  productService: ProductService;
};

export function createProductController(deps: ProductControllerDeps) {
  return {
    getProducts: async (
      request: FastifyRequest<{ Querystring: GetProductsQuery }>,
      reply: FastifyReply,
    ) => {
      const result = await deps.productService.getProducts(request.query);

      return reply.code(200).send({
        success: true,
        message: "Berhasil mengambil data produk",
        data: result.items,
        meta: result.meta,
      });
    },

    createProduct: async (
      request: FastifyRequest<{ Body: CreateProductInput }>,
      reply: FastifyReply,
    ) => {
      const result = await deps.productService.createProduct(request.body);

      return reply.code(201).send({
        success: true,
        message: "Produk berhasil dibuat",
        data: result,
      });
    },

    updateProduct: async (
      request: FastifyRequest<{
        Params: ProductIdParams;
        Body: UpdateProductInput;
      }>,
      reply: FastifyReply,
    ) => {
      const result = await deps.productService.updateProduct(
        request.params.id,
        request.body,
      );

      return reply.code(200).send({
        success: true,
        message: "Produk berhasil diperbarui",
        data: result,
      });
    },
  }
}