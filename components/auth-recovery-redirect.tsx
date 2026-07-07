"use client";

import { useEffect } from "react";

/**
 * Supabase recovery emails redirect with tokens in the URL hash.
 * If the allowed redirect URL is missing from the Supabase project config,
 * users land on the site root instead of /auth/update-password.
 */
export function AuthRecoveryRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#")) return;

    const params = new URLSearchParams(hash.slice(1));
    if (params.get("type") !== "recovery") return;

    if (window.location.pathname !== "/auth/update-password") {
      window.location.replace(`/auth/update-password${hash}`);
    }
  }, []);

  return null;
}
