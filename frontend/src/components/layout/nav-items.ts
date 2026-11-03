import { LayoutDashboard, Package, PlusCircle, ShoppingCart, type LucideIcon } from "lucide-react";

export type NavItem = { title: string; href: string; icon: LucideIcon };
export type NavGroup = { label: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  { label: "Menu", items: [{ title: "Dashboard", href: "/", icon: LayoutDashboard }] },
  {
    label: "Penjualan",
    items: [
      { title: "Buat Order", href: "/orders/new", icon: PlusCircle },
      { title: "Daftar Order", href: "/orders", icon: ShoppingCart },
    ],
  },
  { label: "Katalog", items: [{ title: "Produk", href: "/products", icon: Package }] },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export function getActiveItem(pathname: string): NavItem | undefined {
  return ALL_ITEMS.filter((i) =>
    i.href === "/" ? pathname === "/" : pathname === i.href || pathname.startsWith(`${i.href}/`)
  ).sort((a, b) => b.href.length - a.href.length)[0];
}