import { Suspense } from "react";
import { DiscoveryPackPremiereVisiteButton } from "@/components/atelier-tarifs-purchases";
import { MockupPratiquePage } from "@/components/experiments/control/site-pages";

function PremiereVisiteFallback() {
  return (
    <span className="inline-flex h-[52px] min-w-[160px] animate-pulse items-center justify-center rounded-[12px] border-2 border-[#4a56dd]/30 bg-white/80 px-6 text-lg font-semibold text-[#4a56dd]/40">
      Première visite
    </span>
  );
}

export default function PratiqueLibrePageControl() {
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
