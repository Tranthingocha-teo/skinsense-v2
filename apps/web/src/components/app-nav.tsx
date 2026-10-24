"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";

// Icons from the canvas NAV/TABS snippets (design-2/build.mjs ICONS).
const ITEMS = [
  { key: "today", path: "", icon: <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" /> },
  {
    key: "capture",
    path: "/capture",
    icon: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2.5" />
        <path d="M8 7l1.6-2.5h4.8L16 7" />
        <circle cx="12" cy="13.2" r="3.4" />
      </>
    ),
  },
  { key: "trends", path: "/trends", icon: <path d="M4 16l5-5 4 3 7-7M15 7h5v5" /> },
  {
    key: "settings",
    path: "/settings",
    icon: (
      <>
        <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="8" cy="17" r="2" />
      </>
    ),
  },
] as const;

// The demo mirrors /app under /demo; a screen the demo doesn't have needs an
// account, so it sends the visitor to sign-in instead of the /app gate.
const DEMO_PATHS = ["", "/trends", "/routine", "/history"];
export function useAppHref() {
  const demo = usePathname()?.startsWith("/demo");
  return (path: string) =>
    !demo ? `/app${path}` : DEMO_PATHS.includes(path) || path.startsWith("/spots/") || path.startsWith("/photos/") ? `/demo${path}` : "/#cta";
}

function useNavItems() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const appHref = useAppHref();
  return ITEMS.map(({ key, path, icon }) => {
    const href = appHref(path);
    const active = path === "" ? pathname === href || pathname.startsWith(`${href}/routine`) : pathname.startsWith(href);
    return { key, href, active, icon, label: t(key) };
  });
}

function NavIcon({ size, children }: { size: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

// Canvas NAV snippet: 240px sidebar from md up, sticky beside the scrolling page.
function DesktopNav() {
  const t = useTranslations("Nav");
  return (
    <Sidebar collapsible="none" className="sticky top-0 hidden h-svh gap-7 border-r px-4 py-6 md:flex">
      <SidebarHeader className="p-0 px-3 font-display text-[26px] font-light leading-tight">SkinSense</SidebarHeader>
      <SidebarContent>
        <nav aria-label={t("label")}>
          <SidebarMenu className="gap-1">
            {useNavItems().map(({ key, href, active, icon, label }) => (
              <SidebarMenuItem key={key}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  className="min-h-11 gap-3 rounded-lg px-3 text-[14.5px] text-muted-foreground data-active:bg-foreground/8 data-active:font-medium data-active:text-foreground [&_svg]:size-[23px]"
                >
                  <Link href={href} aria-current={active ? "page" : undefined}>
                    <NavIcon size={23}>{icon}</NavIcon>
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </nav>
      </SidebarContent>
    </Sidebar>
  );
}

// Canvas TABS snippet: 72px glass bar below md; AppShell pads the page by the same height.
function PhoneTabs() {
  const t = useTranslations("Nav");
  return (
    <nav aria-label={t("label")} className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/82 pb-1.5 backdrop-blur-[18px] md:hidden">
      <ul className="grid h-[66px] grid-cols-4">
        {useNavItems().map(({ key, href, active, icon, label }) => (
          <li key={key}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex h-full flex-col items-center justify-center gap-1 text-[11px] tracking-[0.04em] text-muted-foreground aria-[current=page]:font-semibold aria-[current=page]:text-foreground"
            >
              <NavIcon size={23}>{icon}</NavIcon>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// One shell for /app and /demo (Xem thử).
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider className="flex-1 flex-col md:flex-row" style={{ "--sidebar-width": "240px" } as CSSProperties}>
      <DesktopNav />
      <div className="flex min-w-0 flex-1 flex-col pb-[72px] md:pb-0">{children}</div>
      <PhoneTabs />
    </SidebarProvider>
  );
}
