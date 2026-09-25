import { HomePage } from "@/components/home-page";
import { HomePageControl } from "@/components/experiments/control/home-page";
import { EXPERIMENTS } from "@/lib/posthog/experiments";
import { getExperimentVariant } from "@/lib/posthog/variant";
import { redirect } from "next/navigation";
import { Suspense } from "react";

interface RootPageProps {
  searchParams: Promise<{
    code?: string;
    token_hash?: string;
    type?: string;
    next?: string;
    ph_exp?: string;
  }>;
}

async function HandleSearchParams({ searchParams }: RootPageProps) {
  const params = await searchParams;

  if (params?.code) {
    const confirmParams = new URLSearchParams({ code: params.code });
    confirmParams.set("next", params.next ?? "/auth/update-password");
    redirect(`/auth/confirm?${confirmParams.toString()}`);
  }

  if (params?.token_hash && params?.type) {
    const confirmParams = new URLSearchParams({
      token_hash: params.token_hash,
      type: params.type,
    });
    if (params.next) {
      confirmParams.set("next", params.next);
    }
    redirect(`/auth/confirm?${confirmParams.toString()}`);
  }

  return null;
}

async function HomeExperiment({
  searchParams,
}: {
  searchParams: RootPageProps["searchParams"];
}) {
  const params = await searchParams;
  const variant = await getExperimentVariant(EXPERIMENTS.homepage, params);

  // control = yesterday (pre-retours UI-v2), test = today's retours
  if (variant === "control") {
    return <HomePageControl scope="site" />;
  }

  // Missing flags keep the current headline, short Marseille subtext, and “Je veux pratiquer”.
  const [headline, subtext, pratiqueTile] = await Promise.all([
    getExperimentVariant(EXPERIMENTS.heroHeadline, params, {
      fallback: "control",
    }),
    getExperimentVariant(EXPERIMENTS.heroSubtext, params, {
      fallback: "control",
    }),
    getExperimentVariant(EXPERIMENTS.tilePratique, params, {
      fallback: "control",
    }),
  ]);

  return (
    <HomePage
      scope="site"
      headline={headline}
      subtext={subtext}
      pratiqueTile={pratiqueTile}
    />
  );
}

export default function RootPage({ searchParams }: RootPageProps) {
  return (
    <>
      <Suspense fallback={null}>
        <HandleSearchParams searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<HomePage scope="site" />}>
        <HomeExperiment searchParams={searchParams} />
      </Suspense>
    </>
  );
}
