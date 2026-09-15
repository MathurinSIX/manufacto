"use client";

import { usePathname } from "next/navigation";
import { SiteFooter, SiteTopbar } from "@/components/mockups/site-chrome";

function hideMarketingChrome(pathname: string) {
  return (
    pathname.startsWith("/mockups") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/account")
  );
}

/** Client pathname so chrome updates on soft navigations (e.g. site ↔ mon compte). */
export function ConditionalSiteChrome() {
  const pathname = usePathname() ?? "";
  if (hideMarketingChrome(pathname)) return null;
  return <SiteTopbar />;
}

export function ConditionalSiteFooter() {
  const pathname = usePathname() ?? "";
  if (hideMarketingChrome(pathname)) return null;
  return <SiteFooter />;
}
