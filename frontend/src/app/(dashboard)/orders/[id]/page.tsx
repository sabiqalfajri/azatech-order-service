import type { Metadata } from "next";
import { OrderDetail } from "@/src/features/orders/components/order-detail";

export const metadata: Metadata = { title: "Detail Order" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetail id={id} />;
}