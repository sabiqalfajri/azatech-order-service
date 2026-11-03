import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productKeys } from "@/src/features/products/hooks";
import { cancelOrder, createOrder, getOrder, getOrders, payOrder } from "./api";
import type { CreateOrderInput, OrderListParams } from "./types";

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (params: OrderListParams) => [...orderKeys.lists(), params] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
};

export function useOrders(params: OrderListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => getOrders(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => getOrder(id),
    select: (res) => res.data,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => createOrder(input),
    onSuccess: (res) => qc.setQueryData(orderKeys.detail(res.data.id), res),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: productKeys.all });
      qc.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

export function usePayOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payOrder(id),
    onSuccess: (res, id) => {
      qc.setQueryData(orderKeys.detail(id), res);
      qc.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: (_err, id) => qc.invalidateQueries({ queryKey: orderKeys.detail(id) }),
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelOrder(id),
    onSuccess: (res, id) => {
      qc.setQueryData(orderKeys.detail(id), res);
      qc.invalidateQueries({ queryKey: orderKeys.lists() });
      qc.invalidateQueries({ queryKey: productKeys.all }); 
    },
    onError: (_err, id) => qc.invalidateQueries({ queryKey: orderKeys.detail(id) }),
  });
}