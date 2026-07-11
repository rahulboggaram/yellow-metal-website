"use client";

import { usePathname } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <main className="ym-admin-root">{children}</main>;
  }

  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
