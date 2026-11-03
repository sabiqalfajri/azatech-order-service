import { apiRequest } from "@/src/lib/api-client";
import type { CreateOrderInput, Order, OrderListParams } from "./types";

export function getOrders({ page, per_page, status, date_from, date_to }: OrderListParams) {
  const qs = new URLSearchParams({ page: String(page), per_page: String(per_page) });

  if (status) qs.set("status", status);
  if (date_from) qs.set("date_from", date_from);
  if (date_to) qs.set("date_to", date_to);

  return apiRequest<Order[]>(`/api/orders?${qs}`); 
}

export function getOrder(id: string) {
  return apiRequest<Order>(`/api/orders/${id}`); 
}

export function createOrder(input: CreateOrderInput) {
  return apiRequest<Order>("/api/orders", { method: "POST", body: input });
}

export function payOrder(id: string) {
  return apiRequest<Order>(`/api/orders/${id}/pay`, { method: "PATCH" });
}

export function cancelOrder(id: string) {
  return apiRequest<Order>(`/api/orders/${id}/cancel`, { method: "PATCH" });
}