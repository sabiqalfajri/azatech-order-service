import { apiRequest } from "@/src/lib/api-client";
import type { Product, ProductInput, ProductListParams } from "./types";

export function getProducts({ page, per_page, search }: ProductListParams) {
  const qs = new URLSearchParams({ page: String(page), per_page: String(per_page) });
  if (search) qs.set("search", search);
  return apiRequest<Product[]>(`/api/products?${qs}`); 
}

export function createProduct(input: ProductInput) {
  return apiRequest<Product>("/api/products", { method: "POST", body: input });
}

export function updateProduct(id: string, input: ProductInput) {
  return apiRequest<Product>(`/api/products/${id}`, { method: "PUT", body: input });
}