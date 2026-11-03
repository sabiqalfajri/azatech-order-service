import type { Metadata } from "next";
import { ProductsView } from "@/src/features/products/components/products-view";

export const metadata: Metadata = { title: "Produk" };

export default function ProductsPage() {
  return <ProductsView />;
}