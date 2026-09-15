"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Registers the account or admin service worker depending on the route.
 * Marketing site is never a PWA.
 */
export function PwaRegistration() {
  const pathname = usePathname() ?? "";

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    let script: string | null = null;
    let scope: string | null = null;

    if (pathname.startsWith("/account")) {
      script = "/sw.js";
      scope = "/account";
    } else if (pathname.startsWith("/admin")) {
      script = "/sw-admin.js";
      scope = "/admin";
    } else {
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register(script!, { scope: scope! })
        .catch((error) => {
          console.error("Service worker registration failed:", error);
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, [pathname]);

  return null;
}
