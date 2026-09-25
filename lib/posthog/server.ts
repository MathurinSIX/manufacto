import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

export function getPostHogServerClient(): PostHog | null {
  const key =
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ??
    process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

  if (!key) {
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(key, {
      host,
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return posthogClient;
}

export async function shutdownPostHogServer() {
  if (posthogClient) {
    await posthogClient.shutdown();
  }
}
