import { AppHeader } from "@/src/components/layout/app-header";
import { AppSidebar } from "@/src/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}