import Link from "next/link";
import { Suspense } from "react";

import { createNewsletterSubscription } from "@/app/newsletter/actions";
import {
  MarketingPageContainer,
  MarketingPageHeader,
} from "@/components/marketing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Search = {
  error?: string;
  success?: string;
};

function errorMessage(code?: string) {
  switch (code) {
    case "required":
      return "Merci d'indiquer votre nom et votre adresse email.";
    case "email":
      return "Merci d'indiquer une adresse email valide.";
    case "server":
      return "Votre inscription n'a pas pu être enregistrée. Réessayez dans un instant.";
    default:
      return null;
  }
}

export async function NewsletterPanel({
  searchParams,
  isModal = false,
}: {
  searchParams: Promise<Search>;
  isModal?: boolean;
}) {
  const sp = await searchParams;
  const message = errorMessage(sp.error);

  return (
    <MarketingPageContainer className={isModal ? "px-0 pb-0 pt-0 md:pb-0 md:pt-0" : "pb-24"}>
      {!isModal ? (
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-semibold text-[#4a56dd] underline underline-offset-2"
          >
            ← retour à l&apos;accueil
          </Link>
        </div>
      ) : null}

      <MarketingPageHeader title="s'inscrire à la newsletter">
        <p>
          Laissez-nous votre nom et votre adresse email pour recevoir les
          nouvelles de Manufacto une fois par trimestre.
        </p>
        <p>
          Vous pouvez aussi demander le calendrier mensuel des cours proposés.
        </p>
      </MarketingPageHeader>

      <div className="mt-10 max-w-xl rounded-[19px] border border-black/10 bg-white p-6 shadow-sm ring-1 ring-black/5">
        {sp.success ? (
          <p className="rounded-[14px] bg-green-50 p-4 text-sm font-medium text-green-700">
            Votre inscription est enregistrée. Merci !
          </p>
        ) : null}
        {!sp.success && message ? (
          <p className="rounded-[14px] bg-red-50 p-4 text-sm font-medium text-red-700">
            {message}
          </p>
        ) : null}

        {!sp.success ? (
          <form action={createNewsletterSubscription} className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input id="name" name="name" autoComplete="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Confirmer l&apos;inscription
            </Button>
          </form>
        ) : null}
      </div>
    </MarketingPageContainer>
  );
}

export default function NewsletterPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  return (
    <main className="min-h-screen bg-white text-black">
      <Suspense
        fallback={
          <div className="mx-auto max-w-[1274px] px-5 py-16 text-center text-black/70">
            Chargement…
          </div>
        }
      >
        <NewsletterPanel searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
