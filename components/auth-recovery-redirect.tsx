"use client";

import { useEffect } from "react";

/**
 * Supabase recovery/invite emails may land on the site root with tokens in the
 * URL hash when the configured redirect URL is missing from the project allowlist.
 */
export function AuthRecoveryRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#")) return;

    const params = new URLSearchParams(hash.slice(1));
    const type = params.get("type");
    if (type !== "recovery" && type !== "invite") return;

    if (window.location.pathname !== "/auth/update-password") {
      window.location.replace(`/auth/update-password${hash}`);
    }
  }, []);

  return null;
}
