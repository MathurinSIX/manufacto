"use client";

import { useEffect } from "react";

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

    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => {
      clearPending();
      window.removeEventListener("hashchange", openFromHash);
    };
  }, []);

  return null;
}
