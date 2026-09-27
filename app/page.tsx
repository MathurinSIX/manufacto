import { HomePage } from "@/components/home-page";
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
  const headline = await getExperimentVariant(EXPERIMENTS.heroHeadline, params, {
    fallback: "control",
  });

  return <HomePage scope="site" headline={headline} />;
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
