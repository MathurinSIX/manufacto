import { Suspense } from "react";

import PratiqueLibrePageControl from "@/components/experiments/control/pratique-libre-page";
import { DiscoveryPackPremiereVisiteButton } from "@/components/atelier-tarifs-purchases";
import { MockupPratiquePage } from "@/components/mockups/site-pages";
import { EXPERIMENTS } from "@/lib/posthog/experiments";
import { getExperimentVariant } from "@/lib/posthog/variant";

function PremiereVisiteFallback() {
  return (
    <span className="inline-flex h-[52px] min-w-[160px] animate-pulse items-center justify-center rounded-[12px] border-2 border-[#4a56dd]/30 bg-white/80 px-6 text-lg font-semibold text-[#4a56dd]/40">
      Pack découvertes
    </span>
  );
}

function PratiqueLibreTest() {
  return (
    <MockupPratiquePage
      scope="site"
      heroSecondary={
        <Suspense fallback={<PremiereVisiteFallback />}>
          <DiscoveryPackPremiereVisiteButton />
        </Suspense>
      }
    />
  );
}

async function PratiqueExperiment({
  searchParams,
}: {
  searchParams: Promise<{ ph_exp?: string }>;
}) {
  const params = await searchParams;
  const variant = await getExperimentVariant(EXPERIMENTS.pratiqueLibre, params);
  return variant === "control" ? (
    <PratiqueLibrePageControl />
  ) : (
    <PratiqueLibreTest />
  );
}

export default function PratiqueLibrePage({
  searchParams,
}: {
  searchParams: Promise<{ ph_exp?: string }>;
}) {
  return (
    <Suspense fallback={<MockupPratiquePage scope="site" />}>
      <PratiqueExperiment searchParams={searchParams} />
    </Suspense>
  );
}
