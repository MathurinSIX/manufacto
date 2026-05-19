"use client";

import { useEffect } from "react";

/**
 * Opens the <details> element whose id matches the current URL hash,
 * then scrolls it into view. Re-runs on hashchange so in-page navigation
 * to a different sublink still expands the target section.
 */
export function DetailsHashOpener() {
  useEffect(() => {
    const openFromHash = () => {
      const rawHash = window.location.hash;
      if (!rawHash || rawHash.length < 2) return;

      const id = decodeURIComponent(rawHash.slice(1));
      if (!id) return;

      const target = document.getElementById(id);
      if (!target) return;

      if (target instanceof HTMLDetailsElement && !target.open) {
        target.open = true;
      }

      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };

    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  return null;
}
