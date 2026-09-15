export type ProposalId = "visite" | "chemin" | "sessions" | "mix";

/** Production site or a mockup proposal namespace */
export type SiteScope = ProposalId | "site";

export const PROPOSAL_BASE: Record<ProposalId, string> = {
  visite: "/mockups/visite",
  chemin: "/mockups/chemin",
  sessions: "/mockups/sessions",
  mix: "/mockups/mix",
};

export function mockupHref(proposal: ProposalId, path = "") {
  return scopeHref(proposal, path);
}

export function scopeHref(scope: SiteScope, path = ""): string {
  if (scope === "site") {
    if (!path || path === "/") return "/";
    return path.startsWith("/") ? path : `/${path}`;
  }
  const base = PROPOSAL_BASE[scope];
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
