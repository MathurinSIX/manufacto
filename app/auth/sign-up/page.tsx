import { Suspense } from "react";

import { AuthPageShell } from "@/components/auth-page-shell";
import { SignUpForm } from "@/components/sign-up-form";

interface SignUpPageProps {
  searchParams?: Promise<{ next?: string; email?: string; invite?: string }>;
}

async function SignUpPanel({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string; email?: string; invite?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const redirectTo =
    typeof resolvedSearchParams?.next === "string" &&
    resolvedSearchParams.next.length > 0
      ? resolvedSearchParams.next
      : undefined;
  const initialEmail =
    typeof resolvedSearchParams?.email === "string"
      ? resolvedSearchParams.email
      : "";
  const lockEmail = resolvedSearchParams?.invite === "1" && initialEmail.length > 0;

  return (
    <SignUpForm
      redirectTo={redirectTo}
      initialEmail={initialEmail}
      lockEmail={lockEmail}
    />
  );
}

export default function Page({ searchParams }: SignUpPageProps) {
  return (
    <AuthPageShell
      accent="orange"
      title={
        <>
          Créer un <span className="text-[#f56800]">compte</span>
        </>
      }
      lead="Inscrivez-vous pour réserver des cours, charger des crédits et suivre vos activités à l'atelier."
    >
      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-[14px] bg-black/5" aria-hidden />
        }
      >
        <SignUpPanel searchParams={searchParams} />
      </Suspense>
    </AuthPageShell>
  );
}
