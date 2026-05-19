import { Suspense } from "react";

import { SignUpForm } from "@/components/sign-up-form";
import {
  MarketingPageContainer,
  MarketingPageHeader,
} from "@/components/marketing";

interface SignUpPageProps {
  searchParams?: Promise<{ next?: string }>;
}

async function SignUpPanel({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const redirectTo =
    typeof resolvedSearchParams?.next === "string" &&
    resolvedSearchParams.next.length > 0
      ? resolvedSearchParams.next
      : undefined;

  return <SignUpForm redirectTo={redirectTo} />;
}

export default function Page({ searchParams }: SignUpPageProps) {
  return (
    <main className="min-h-screen bg-white text-black">
      <MarketingPageContainer className="pb-24 md:pb-[140px]">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_440px] md:items-start md:gap-16">
          <MarketingPageHeader title="Créer un compte" className="max-w-[720px]">
            <p>
              Inscrivez-vous pour réserver vos cours, gérer vos informations et
              suivre vos activités à l&apos;atelier.
            </p>
          </MarketingPageHeader>

          <section className="rounded-[19px] bg-[#fff8f0] p-6 ring-1 ring-black/10 md:p-8">
            <Suspense fallback={null}>
              <SignUpPanel searchParams={searchParams} />
            </Suspense>
          </section>
        </div>
      </MarketingPageContainer>
    </main>
  );
}
