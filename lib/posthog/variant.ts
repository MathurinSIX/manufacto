import { cookies } from "next/headers";

import {
  DISTINCT_ID_COOKIE,
  EXPERIMENT_OVERRIDE_COOKIE,
  type ExperimentKey,
  type ExperimentVariant,
} from "@/lib/posthog/experiments";
import { getPostHogServerClient } from "@/lib/posthog/server";

function parseOverrideRaw(
  raw: string | null | undefined,
  flagKey: ExperimentKey,
): ExperimentVariant | null {
  const value = raw?.trim();
  if (!value || value === "clear") return null;
  if (value === "control" || value === "test") return value;
  const [key, variant] = value.split(":");
  if (key === flagKey && (variant === "control" || variant === "test")) {
    return variant;
  }
  return null;
}

function parseOverrideFromSearchParams(
  searchParams: Record<string, string | string[] | undefined> | URLSearchParams | null | undefined,
  flagKey: ExperimentKey,
): ExperimentVariant | null {
  if (!searchParams) return null;

  const get = (key: string) => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key);
    }
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  // ?ph_exp=exp-homepage-retours:test  or  ?ph_exp=test (applies to all)
  return parseOverrideRaw(get("ph_exp"), flagKey);
}

async function resolveDistinctId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(DISTINCT_ID_COOKIE)?.value?.trim();
  if (existing) return existing;
  return crypto.randomUUID();
}

async function resolveCookieOverride(
  flagKey: ExperimentKey,
): Promise<ExperimentVariant | null> {
  const cookieStore = await cookies();
  return parseOverrideRaw(
    cookieStore.get(EXPERIMENT_OVERRIDE_COOKIE)?.value,
    flagKey,
  );
}

type SearchParamsInput =
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | null
  | undefined;

/**
 * Server-side experiment variant.
 * - `control` = yesterday’s UI-v2 (pre-retours)
 * - `test` = today’s retours 2.0
 *
 * When PostHog is not configured, defaults to `test` so the new UI stays visible.
 * Override with `?ph_exp=control` (stored in a cookie so it survives navigation).
 * Clear with `?ph_exp=clear`.
 */
export async function getExperimentVariant(
  flagKey: ExperimentKey,
  searchParams?: SearchParamsInput,
  options?: { fallback?: ExperimentVariant },
): Promise<ExperimentVariant> {
  const fallback: ExperimentVariant =
    options?.fallback ??
    (process.env.POSTHOG_EXPERIMENT_DEFAULT === "control" ? "control" : "test");
  const fromQuery = parseOverrideFromSearchParams(searchParams, flagKey);
  if (fromQuery) return fromQuery;

  // Cookie set by proxy when ?ph_exp= was present (survives Link navigations).
  // ?ph_exp=clear deletes the cookie in proxy; skip cookie for that request.
  const clearRequested = (() => {
    if (!searchParams) return false;
    const raw =
      searchParams instanceof URLSearchParams
        ? searchParams.get("ph_exp")
        : Array.isArray(searchParams.ph_exp)
          ? searchParams.ph_exp[0]
          : searchParams.ph_exp;
    return raw?.trim() === "clear";
  })();

  if (!clearRequested) {
    const fromCookie = await resolveCookieOverride(flagKey);
    if (fromCookie) return fromCookie;
  }

  const client = getPostHogServerClient();

  if (!client) {
    return fallback;
  }

  const distinctId = await resolveDistinctId();

  try {
    const value = await client.getFeatureFlag(flagKey, distinctId, {
      personProperties: {
        experiment_surface: "marketing",
      },
    });

    if (value === "control" || value === "test") {
      return value;
    }
    if (value === true || value === "true") return "test";
    if (value === false || value === "false") return "control";
  } catch (error) {
    console.error(`[posthog] getFeatureFlag(${flagKey}) failed`, error);
  }

  return fallback;
}

export async function getDistinctIdForClient(): Promise<string> {
  return resolveDistinctId();
}
