/** Choice stored before PostHog, Vercel Analytics, or the experiment id. */
export const COOKIE_CONSENT = "mf_cookie_consent";

export const COOKIE_CONSENT_MAX_AGE = 60 * 60 * 24 * 180;

export type CookieConsent = "accepted" | "refused";

export function parseCookieConsent(
  value: string | undefined | null,
): CookieConsent | null {
  if (value === "accepted" || value === "refused") return value;
  return null;
}
