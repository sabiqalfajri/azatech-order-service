"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/src/components/ui/separator";
import { SidebarTrigger } from "@/src/components/ui/sidebar";
import { getActiveItem } from "./nav-items";

export function AppHeader() {
  const title = getActiveItem(usePathname())?.title ?? "Order Service";

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      <span className="text-sm font-medium">{title}</span>
    </header>
  );
}