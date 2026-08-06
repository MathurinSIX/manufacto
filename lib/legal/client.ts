"use client";

import { LEGAL_DOCS_PATH, LEGAL_REQUIRED_ERROR } from "@/lib/legal/types";

export function redirectToLegalDocsIfRequired(
  error: string | null | undefined,
  returnPath?: string,
) {
  if (error !== LEGAL_REQUIRED_ERROR) {
    return false;
  }

  const next = returnPath && returnPath.startsWith("/") ? returnPath : "/account";
  window.location.href = `${LEGAL_DOCS_PATH}?next=${encodeURIComponent(next)}`;
  return true;
}

export function legalDocsUserMessage(error: string | null | undefined) {
  if (error !== LEGAL_REQUIRED_ERROR) {
    return error ?? null;
  }
  return "Avant de réserver, merci de signer le règlement intérieur et la décharge.";
}
