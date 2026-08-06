export function buildSignUpUrl(returnPath: string) {
  return `/auth/sign-up?${new URLSearchParams({ next: returnPath }).toString()}`;
}

export function buildLoginUrl(returnPath: string) {
  return `/auth/login?${new URLSearchParams({ next: returnPath }).toString()}`;
}

/** Public site origin used in auth emails (invite / recovery / magic link). */
export function getAuthSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

/**
 * Supabase PKCE emails append `?code=` to redirectTo. Route that code through
 * /auth/confirm so the session is established before the password form.
 */
export function getPasswordSetupRedirectUrl(siteUrl = getAuthSiteUrl()) {
  const next = encodeURIComponent("/auth/update-password");
  return `${siteUrl.replace(/\/$/, "")}/auth/confirm?next=${next}`;
}
