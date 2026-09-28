"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "@posthog/react";

import { DISTINCT_ID_COOKIE } from "@/lib/posthog/experiments";
import {
  COOKIE_CONSENT,
  COOKIE_CONSENT_MAX_AGE,
  parseCookieConsent,
} from "@/lib/cookies/consent";

function readCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  const parts = document.cookie.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${name}=`)) {
      return decodeURIComponent(trimmed.slice(name.length + 1));
    }
  }
  return undefined;
}

function readStoredConsent() {
  const fromCookie = parseCookieConsent(readCookie(COOKIE_CONSENT));
  if (fromCookie) return fromCookie;
  try {
    return parseCookieConsent(localStorage.getItem(COOKIE_CONSENT));
  } catch {
    return null;
  }
}

export const COOKIE_CONSENT_EVENT = "mf-cookie-consent";

function clearAnalyticsStorage() {
  document.cookie.split(";").forEach((part) => {
    const name = part.split("=")[0]?.trim();
    if (!name || (!name.startsWith("ph_") && name !== DISTINCT_ID_COOKIE)) return;
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
  });
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith("ph_"))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Private mode can block storage.
  }
  if (posthog.__loaded) {
    posthog.opt_out_capturing();
    posthog.reset();
  }
}

export function writeConsentCookie(value: "accepted" | "refused") {
  const encoded = encodeURIComponent(value);
  document.cookie = `${COOKIE_CONSENT}=${encoded}; Path=/; Max-Age=${COOKIE_CONSENT_MAX_AGE}; SameSite=Lax`;
  try {
    localStorage.setItem(COOKIE_CONSENT, value);
  } catch {
    // The cookie is the source the server reads.
  }

  if (value === "accepted" && !readCookie(DISTINCT_ID_COOKIE)) {
    document.cookie = `${DISTINCT_ID_COOKIE}=${crypto.randomUUID()}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  }
  if (value === "refused") {
    clearAnalyticsStorage();
  }
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
}

function hasAnalyticsConsent() {
  return readStoredConsent() === "accepted";
}

export function initPostHog(bootstrapDistinctId?: string) {
  const key =
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ??
    process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

  if (!key || !hasAnalyticsConsent()) return;

  const distinctId = bootstrapDistinctId || readCookie(DISTINCT_ID_COOKIE);

  if (!posthog.__loaded) {
    posthog.init(key, {
      api_host: host,
      defaults: "2026-05-30",
      capture_pageview: false,
      capture_pageleave: true,
      persistence: "localStorage+cookie",
      bootstrap: distinctId ? { distinctID: distinctId } : undefined,
      loaded: (client) => {
        if (distinctId) client.identify(distinctId);
      },
    });
    return;
  }

  if (distinctId) posthog.identify(distinctId);
}

function PostHogPageViewInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || !hasAnalyticsConsent()) return;
    const capture = () => {
      if (!posthog.__loaded) return;
      const search = searchParams?.toString();
      const url = search ? `${pathname}?${search}` : pathname;
      posthog.capture("$pageview", { $current_url: url });
    };

    if (posthog.__loaded) {
      capture();
      return;
    }

    const timer = window.setInterval(() => {
      if (posthog.__loaded) {
        window.clearInterval(timer);
        capture();
      }
    }, 50);

    return () => window.clearInterval(timer);
  }, [pathname, searchParams]);

  return null;
}

function PostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageViewInner />
    </Suspense>
  );
}

export function PostHogProvider({
  children,
  bootstrapDistinctId,
}: {
  children: React.ReactNode;
  bootstrapDistinctId?: string;
}) {
  useEffect(() => {
    initPostHog(bootstrapDistinctId);
    const onConsent = () => initPostHog(bootstrapDistinctId);
    window.addEventListener(COOKIE_CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsent);
  }, [bootstrapDistinctId]);

  return (
    <PHProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PHProvider>
  );
}
