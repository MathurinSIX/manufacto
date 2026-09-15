import { MockupSiteShell } from "@/components/mockups/site-chrome";
import type { ProposalId } from "@/components/mockups/paths";

export function ProposalLayout({
  proposal,
  children,
}: {
  proposal: ProposalId;
  children: React.ReactNode;
}) {
  return <MockupSiteShell proposal={proposal}>{children}</MockupSiteShell>;
}
