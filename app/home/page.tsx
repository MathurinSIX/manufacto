import { LandingPage } from "@/components/landing-page";
import { redirect } from "next/navigation";
import { Suspense } from "react";

interface HomeProps {
  searchParams: Promise<{ code?: string }>;
}

async function HandleSearchParams({ searchParams }: HomeProps) {
  const params = await searchParams;
  if (params?.code) {
    redirect(`/auth/confirm?code=${encodeURIComponent(params.code)}`);
  }
  return null;
}

export default async function Home({ searchParams }: HomeProps) {
  return (
    <>
      <Suspense fallback={null}>
        <HandleSearchParams searchParams={searchParams} />
      </Suspense>
      <LandingPage />
    </>
  );
}
