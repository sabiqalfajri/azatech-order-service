import { apiRequest } from "@/src/lib/api-client";
import type { Customer, CustomerListParams } from "./types";

export function getCustomers({ page, per_page, search }: CustomerListParams) {
  const qs = new URLSearchParams({ page: String(page), per_page: String(per_page) });
  if (search) qs.set("search", search);
  return apiRequest<Customer[]>(`/api/customers?${qs}`);
}