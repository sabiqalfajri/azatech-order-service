import type { Metadata } from "next";
import { OrdersView } from "@/src/features/orders/components/orders-view";

export const metadata: Metadata = { title: "Daftar Order" };

export default function OrdersPage() {
  return <OrdersView />;
}