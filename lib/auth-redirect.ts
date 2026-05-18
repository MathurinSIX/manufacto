export function buildSignUpUrl(returnPath: string) {
  return `/auth/sign-up?${new URLSearchParams({ next: returnPath }).toString()}`;
}

export function buildLoginUrl(returnPath: string) {
  return `/auth/login?${new URLSearchParams({ next: returnPath }).toString()}`;
}
