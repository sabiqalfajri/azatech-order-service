import type { Metadata } from "next";
import { CreateOrderForm } from "@/src/features/orders/components/create-order-form";

export const metadata: Metadata = { title: "Buat Order" };

export default function NewOrderPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Buat Order</h1>
        <p className="text-sm text-muted-foreground">
          Pilih pelanggan dan produk. Harga, diskon, dan total final dihitung oleh server.
        </p>
      </div>
      <CreateOrderForm />
    </div>
  );
}