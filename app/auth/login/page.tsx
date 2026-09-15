import { Suspense } from "react";

import { AuthPageShell } from "@/components/auth-page-shell";
import { LoginForm } from "@/components/login-form";

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
  const rawNext =
    typeof resolvedSearchParams?.next === "string"
      ? resolvedSearchParams.next
      : "";
  // Only allow same-origin relative paths (avoid open redirects).
  const redirectTo =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : undefined;

  return <LoginForm redirectTo={redirectTo} />;
}

export default function Page({ searchParams }: LoginPageProps) {
  return (
    <AuthPageShell
      accent="blue"
      title={
        <>
          Connectez-vous à{" "}
          <span className="text-[#4a56dd]">votre compte</span>
        </>
      }
      lead="Retrouvez vos inscriptions, crédits et réservations — cours ou pratique libre à l'atelier."
    >
      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-[14px] bg-black/5" aria-hidden />
        }
      >
        <LoginPanel searchParams={searchParams} />
      </Suspense>
    </AuthPageShell>
  );
}
