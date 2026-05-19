"use client";

import { useEffect } from "react";

const PENDING_HASH_KEY = "manufacto:pending-hash";

type PendingHash = {
  pathname: string;
  search: string;
  hash: string;
  createdAt: number;
};

export function DetailsHashOpener() {
  useEffect(() => {
    let retryTimeout: number | null = null;
    let animationFrame: number | null = null;

    const clearPending = () => {
      if (retryTimeout) {
        window.clearTimeout(retryTimeout);
        retryTimeout = null;
      }

      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    };

    const restorePendingHash = () => {
      if (window.location.hash) return;

      const pendingValue = window.sessionStorage.getItem(PENDING_HASH_KEY);
      if (!pendingValue) return;

      try {
        const pendingHash = JSON.parse(pendingValue) as PendingHash;
        window.sessionStorage.removeItem(PENDING_HASH_KEY);

        if (
          pendingHash.pathname !== window.location.pathname ||
          pendingHash.search !== window.location.search ||
          !pendingHash.hash ||
          Date.now() - pendingHash.createdAt > 10_000
        ) {
          return;
        }

        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${pendingHash.hash}`);
      } catch {
        window.sessionStorage.removeItem(PENDING_HASH_KEY);
      }
    };

    const openFromHash = () => {
      clearPending();

      const rawHash = window.location.hash;
      if (!rawHash || rawHash.length < 2) return;

      const id = decodeURIComponent(rawHash.slice(1));
      if (!id) return;

      let attempts = 0;

      const openWhenReady = () => {
        const target = document.getElementById(id);

        if (!target) {
          attempts += 1;
          if (attempts < 20) {
            retryTimeout = window.setTimeout(openWhenReady, 100);
          }
          return;
        }

        if (target instanceof HTMLDetailsElement && !target.open) {
          target.open = true;
        }

        animationFrame = window.requestAnimationFrame(() => {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      };

      openWhenReady();
    };

    restorePendingHash();
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => {
      clearPending();
      window.removeEventListener("hashchange", openFromHash);
    };
  }, []);

  return null;
}
