import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Package, PlusCircle, ShoppingCart } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };

const SHORTCUTS = [
  {
    title: "Buat Order",
    description: "Pilih pelanggan, tambah produk, dan total dihitung otomatis.",
    href: "/orders/new",
    icon: PlusCircle,
  },
  {
    title: "Daftar Order",
    description: "Lihat riwayat, filter status, lalu bayar atau batalkan order.",
    href: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Produk",
    description: "Kelola katalog produk, harga, dan stok.",
    href: "/products",
    icon: Package,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Selamat datang di Order Service. Pilih menu untuk mulai.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SHORTCUTS.map(({ title, description, href, icon: Icon }) => (
          <Link key={href} href={href} className="group">
            <Card className="h-full transition-colors group-hover:bg-accent">
              <CardHeader>
                <div className="mb-2 flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <CardTitle className="flex items-center justify-between">
                  {title}
                  <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}