import { LandingPage } from "@/components/landing-page";
import { redirect } from "next/navigation";
import { Suspense } from "react";

interface RootPageProps {
  searchParams: Promise<{ code?: string; token_hash?: string; type?: string; next?: string }>;
}

async function HandleSearchParams({ searchParams }: RootPageProps) {
  const params = await searchParams;

  if (params?.code) {
    const confirmParams = new URLSearchParams({ code: params.code });

    if (params.next) {
      confirmParams.set("next", params.next);
    }

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

export default function RootPage({ searchParams }: RootPageProps) {
  return (
    <>
      <Suspense fallback={null}>
        <HandleSearchParams searchParams={searchParams} />
      </Suspense>
      <LandingPage />
    </>
  );
}
