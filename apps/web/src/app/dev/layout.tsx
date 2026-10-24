import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-nav";

// Development only: screen states rendered with fake data for screenshots. 404 in production.
export default function DevLayout({ children }: LayoutProps<"/dev">) {
  if (process.env.NODE_ENV === "production") notFound();
  return <AppShell>{children}</AppShell>;
}
