import type { ReactNode } from "react";
import { SellerShell } from "@/components/seller/seller-nav";

export default function SellerLayout({ children }: { children: ReactNode }) {
  return <SellerShell>{children}</SellerShell>;
}
