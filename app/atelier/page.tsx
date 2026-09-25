import { Suspense } from "react";

import AtelierPageControl from "@/components/experiments/control/atelier-page";
import { AtelierPageTest } from "@/components/atelier-page-test";
import { EXPERIMENTS } from "@/lib/posthog/experiments";
import { getExperimentVariant } from "@/lib/posthog/variant";

async function AtelierExperiment({
  searchParams,
}: {
  searchParams: Promise<{ ph_exp?: string }>;
}) {
  const params = await searchParams;
  const [variant, heroLead] = await Promise.all([
    getExperimentVariant(EXPERIMENTS.atelier, params),
    getExperimentVariant(EXPERIMENTS.atelierHero, params, { fallback: "test" }),
  ]);
  // control = yesterday UI-v2 atelier, test = today's retours
  return variant === "control" ? (
    <AtelierPageControl heroLead={heroLead} />
  ) : (
    <AtelierPageTest heroLead={heroLead} />
  );
}

export default function AtelierPage({
  searchParams,
}: {
  searchParams: Promise<{ ph_exp?: string }>;
}) {
  return (
    <Suspense fallback={<AtelierPageTest />}>
      <AtelierExperiment searchParams={searchParams} />
    </Suspense>
  );
}
