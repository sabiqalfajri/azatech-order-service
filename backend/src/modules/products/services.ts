import { and, count, desc, eq, ilike, ne, or } from "drizzle-orm";
import { escapeLike } from "../../common/utils/string.js";
import { products, type ProductRow } from "../../db/schema/products.js";
import type { DB } from "../../db/types.js";
import type { CreateProductInput, GetProductsQuery, UpdateProductInput } from "./schema.js";
import { ConflictError, NotFoundError } from "../../common/errors/sub-error.js";

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
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
  };
}

export function createProductService(deps: ProductServiceDeps) {
  return {
    async getProducts(query: GetProductsQuery) {
      const { page, per_page, search } = query;

      const pattern = search ? `%${escapeLike(search)}%` : undefined;
      const where = pattern
        ? or(ilike(products.name, pattern), ilike(products.productCode, pattern))
        : undefined;

      const [rows, countRows] = await Promise.all([
        deps.db
          .select()
          .from(products)
          .where(where)
          .orderBy(desc(products.createdAt), desc(products.id)) 
          .limit(per_page)
          .offset((page - 1) * per_page),
        deps.db.select({ total: count() }).from(products).where(where),
      ]);

      return {
        items: rows.map(toProductResponse),
        meta: { page, per_page, total: countRows[0]?.total ?? 0 },
      };
    },

    async createProduct(input: CreateProductInput) {
      const [row] = await deps.db
        .insert(products)
        .values({
          productCode: input.product_code,
          name: input.name,
          price: input.price,
          stock: input.stock,
        })
        .onConflictDoNothing({ target: products.productCode })
        .returning();

      if (!row) {
        throw new ConflictError("Kode produk sudah digunakan", {
          product_code: ["Kode produk sudah digunakan"],
        });
      }
      return toProductResponse(row);
    },

    async updateProduct(id: string, input: UpdateProductInput) {
      const [existing] = await deps.db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.id, id))
        .limit(1);

      if (!existing) throw new NotFoundError("Produk tidak ditemukan");

      const [duplicate] = await deps.db
        .select({ id: products.id })
        .from(products)
        .where(and(eq(products.productCode, input.product_code), ne(products.id, id)))
        .limit(1);

      if (duplicate) {
        throw new ConflictError("Kode produk sudah digunakan", {
          product_code: ["Kode produk sudah digunakan"],
        });
      }

      const [row] = await deps.db
        .update(products)
        .set({
          productCode: input.product_code,
          name: input.name,
          price: input.price,
          stock: input.stock,
        })
        .where(eq(products.id, id))
        .returning();

      if (!row) throw new NotFoundError("Produk tidak ditemukan");
      return toProductResponse(row);
    },
  }
}

export type ProductService = ReturnType<typeof createProductService>