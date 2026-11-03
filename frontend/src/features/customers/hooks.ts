import { useQuery } from "@tanstack/react-query";
import { getCustomers } from "./api";
import type { CustomerListParams } from "./types";

export const customerKeys = {
  all: ["customers"] as const,
  list: (params: CustomerListParams) => [...customerKeys.all, "list", params] as const,
};

export function useCustomers(params: CustomerListParams) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => getCustomers(params),
  });
}