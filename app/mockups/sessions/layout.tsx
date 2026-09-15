import { ProposalLayout } from "@/components/mockups/proposal-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ProposalLayout proposal="sessions">{children}</ProposalLayout>;
}
