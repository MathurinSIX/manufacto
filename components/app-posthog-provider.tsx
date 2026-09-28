import { Suspense } from "react";

import { PostHogProvider } from "@/components/posthog-provider";
import { getDistinctIdForClient } from "@/lib/posthog/variant";

async function PostHogProviderWithId({
  children,
}: {
  children: React.ReactNode;
}) {
  const distinctId = await getDistinctIdForClient();
  return (
    <PostHogProvider bootstrapDistinctId={distinctId}>{children}</PostHogProvider>
  );
}

/** Server-friendly PostHog wrapper for the root layout. */
export function AppPostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <PostHogProviderWithId>{children}</PostHogProviderWithId>
    </Suspense>
  );
}
