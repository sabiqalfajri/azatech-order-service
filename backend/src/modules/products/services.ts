import type { ProductRow } from "../../db/schema/products.js";
import type { DB } from "../../db/types.js";
import type { CreateProductInput, GetProductsQuery, UpdateProductInput } from "./schema.js";

type ProductServiceDeps = {
  db: DB;
};

export function toProductResponse(p: ProductRow) {
  return {
    id: p.id,
    product_code: p.productCode,
    name: p.name,
    price: p.price,
    stock: p.stock,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

export function createProductService(deps: ProductServiceDeps) {
  return {
    async getProducts(query: GetProductsQuery) {

    },

    async createProduct(input: CreateProductInput) {

    },

    async updateProduct(id: string, input: UpdateProductInput) {

    }
  }
}

export type ProductService = ReturnType<typeof createProductService>