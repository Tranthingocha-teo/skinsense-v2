"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  TrendingUp,
  Store,
  Wallet,
  ArrowLeft,
  Settings,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const SELLER_NAV_ITEMS = [
  { key: "dashboard", href: "/seller/dashboard", icon: LayoutDashboard, label: "Bảng điều khiển" },
  { key: "products", href: "/seller/products", icon: Package, label: "Quản lý sản phẩm" },
  { key: "orders", href: "/seller/orders", icon: ShoppingBag, label: "Quản lý đơn hàng" },
  { key: "analytics", href: "/seller/analytics", icon: TrendingUp, label: "Phân tích doanh thu" },
  { key: "shop", href: "/seller/shop", icon: Store, label: "Hồ sơ cửa hàng" },
  { key: "wallet", href: "/seller/wallet", icon: Wallet, label: "Ví người bán" },
] as const;

function DesktopSellerNav() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="none" className="sticky top-0 hidden h-svh gap-6 border-r px-4 py-6 md:flex bg-card">
      <SidebarHeader className="p-0 px-3 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="font-display text-[22px] font-medium leading-tight text-foreground flex items-center gap-2">
            <Sparkles className="size-5 text-emerald-600" />
            SkinSense
          </span>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] uppercase font-bold">
            SELLER
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">Trung tâm quản lý bán hàng</p>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        <nav aria-label="Seller Navigation">
          <SidebarMenu className="gap-1.5">
            {SELLER_NAV_ITEMS.map(({ key, href, icon: Icon, label }) => {
              const active = pathname === href || (href !== "/seller/dashboard" && pathname.startsWith(href));
              return (
                <SidebarMenuItem key={key}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    className="min-h-11 gap-3 rounded-xl px-3.5 text-[14px] text-muted-foreground transition-colors hover:text-foreground data-active:bg-emerald-500/10 data-active:font-semibold data-active:text-emerald-700 dark:data-active:text-emerald-400 [&_svg]:size-5"
                  >
                    <Link href={href} aria-current={active ? "page" : undefined}>
                      <Icon className="size-5 shrink-0" />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </nav>
      </SidebarContent>

      <SidebarFooter className="p-0 pt-4 border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="min-h-10 gap-2.5 rounded-xl px-3 text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Link href="/app">
                <ArrowLeft className="size-4 shrink-0 text-muted-foreground" />
                <span>Về ứng dụng SkinSense</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function PhoneSellerTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Seller Mobile Tabs" className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 pb-2 backdrop-blur-md md:hidden">
      <ul className="grid h-[64px] grid-cols-5 items-center">
        {SELLER_NAV_ITEMS.slice(0, 5).map(({ key, href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/seller/dashboard" && pathname.startsWith(href));
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-[10px] tracking-tight ${
                  active ? "font-bold text-emerald-600" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-5" />
                <span className="truncate max-w-[64px] text-center">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SellerShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider className="flex-1 flex-col md:flex-row min-h-screen bg-background" style={{ "--sidebar-width": "250px" } as CSSProperties}>
      <DesktopSellerNav />
      <div className="flex min-w-0 flex-1 flex-col pb-[72px] md:pb-6 px-4 md:px-8 pt-6 max-w-7xl mx-auto w-full">
        {children}
      </div>
      <PhoneSellerTabs />
    </SidebarProvider>
  );
}
