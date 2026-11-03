import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProduct, getProducts, updateProduct } from "./api";
import type { ProductInput, ProductListParams } from "./types";

export const productKeys = {
  all: ["products"] as const,
  list: (params: ProductListParams) => [...productKeys.all, "list", params] as const,
};

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => getProducts(params),
    placeholderData: keepPreviousData, 
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) => createProduct(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProductInput }) => updateProduct(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}