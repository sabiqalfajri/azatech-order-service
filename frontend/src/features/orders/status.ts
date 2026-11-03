import type { OrderStatus } from "./types";

export const ORDER_STATUSES: OrderStatus[] = ["PENDING", "PAID", "CANCELLED"];

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; badge: string; dot: string }
> = {
  PENDING: {
    label: "Menunggu",
    badge:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200",
    dot: "bg-amber-500",
  },
  PAID: {
    label: "Dibayar",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
  CANCELLED: {
    label: "Dibatalkan",
    badge: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
};