"use client";

import { ChevronsUpDown, LogOut, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/src/components/ui/sidebar";
import { NAV_GROUPS, getActiveItem } from "./nav-items";

const CURRENT_USER = { name: "Admin", email: "admin@example.com" };

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile } = useSidebar();
  const activeHref = getActiveItem(pathname)?.href;

  function handleLogout() {
    // Menyusul: panggil logout() untuk menghapus token sebelum redirect
    router.replace("/login");
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShoppingBag className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Order Service</span>
                <span className="truncate text-xs text-muted-foreground">Toko Online</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={item.href === activeHref}
                      tooltip={item.title}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent" />
                }
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
                  {CURRENT_USER.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{CURRENT_USER.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {CURRENT_USER.email}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side={isMobile ? "bottom" : "top"}
                align="end"
                sideOffset={4}
                className="w-56"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <p className="truncate text-sm font-medium">
                      {CURRENT_USER.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {CURRENT_USER.email}
                    </p>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout}>
                  <LogOut />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}