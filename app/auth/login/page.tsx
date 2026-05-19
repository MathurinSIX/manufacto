import { Suspense } from "react";

import { LoginForm } from "@/components/login-form";
import {
  MarketingPageContainer,
  MarketingPageHeader,
} from "@/components/marketing";

interface LoginPageProps {
  searchParams?: Promise<LoginSearchParams>;
}

interface LoginSearchParams {
  next?: string;
}

async function LoginPanel({
  searchParams,
}: {
  searchParams?: Promise<LoginSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const redirectTo =
    typeof resolvedSearchParams?.next === "string" &&
    resolvedSearchParams.next.length > 0
      ? resolvedSearchParams.next
      : undefined;

  return <LoginForm redirectTo={redirectTo} />;
}

export default function Page({ searchParams }: LoginPageProps) {
  return (
    <main className="min-h-screen bg-white text-black">
      <MarketingPageContainer className="pb-24 md:pb-[140px]">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_440px] md:items-start md:gap-16">
          <MarketingPageHeader
            title="Connectez-vous à votre compte"
            className="max-w-[720px]"
          >
            <p>
              Retrouvez vos inscriptions et les informations liées à vos cours ou
              à la pratique libre à l&apos;atelier.
            </p>
          </MarketingPageHeader>

          <section className="rounded-[19px] bg-[#fff8f0] p-6 ring-1 ring-black/10 md:p-8">
            <Suspense fallback={null}>
              <LoginPanel searchParams={searchParams} />
            </Suspense>
          </section>
        </div>
      </MarketingPageContainer>
    </main>
  );
}
