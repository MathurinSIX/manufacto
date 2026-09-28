"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { parseCookieConsent } from "@/lib/cookies/consent";
import {
  COOKIE_CONSENT_EVENT,
  writeConsentCookie,
} from "@/components/posthog-provider";
import { COOKIE_CONSENT } from "@/lib/cookies/consent";

function readConsent() {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${COOKIE_CONSENT}=`)) {
      const fromCookie = parseCookieConsent(
        decodeURIComponent(trimmed.slice(COOKIE_CONSENT.length + 1)),
      );
      if (fromCookie) return fromCookie;
    }
  }
  try {
    return parseCookieConsent(localStorage.getItem(COOKIE_CONSENT));
  } catch {
    return null;
  }
}

export function CookieBanner() {
  const [consent, setConsent] = useState<ReturnType<typeof readConsent> | "unknown">(
    "unknown",
  );

  useEffect(() => {
    setConsent(readConsent());
  }, []);

  if (consent !== null) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-black/10 bg-white/95 px-4 py-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-sm md:px-6">
      <div className="mx-auto flex max-w-[1274px] flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <p className="max-w-3xl text-sm leading-relaxed text-black/75">
          Ce site utilise des cookies pour mesurer la fréquentation.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="rounded-[12px] border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-black/80 hover:bg-black/5"
            onClick={() => {
              writeConsentCookie("refused");
              setConsent("refused");
            }}
          >
            Refuser
          </button>
          <button
            type="button"
            className="rounded-[12px] bg-[#4a56dd] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3844c8]"
            onClick={() => {
              writeConsentCookie("accepted");
              setConsent("accepted");
            }}
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConsentAnalytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = () => setAllowed(readConsent() === "accepted");
    sync();
    window.addEventListener(COOKIE_CONSENT_EVENT, sync);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, sync);
  }, []);

  if (!allowed) return null;
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
