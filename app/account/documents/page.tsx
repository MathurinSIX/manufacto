import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DocumentSigningForm } from "@/components/legal/document-signing-form";
import {
  MarketingPageContainer,
  MarketingPageHeader,
} from "@/components/marketing";
import { createClient } from "@/lib/supabase/server";
import { getUserLegalCompliance } from "@/lib/legal/status";

type Search = {
  next?: string;
};

async function DocumentsContent({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent("/account/documents")}`);
  }

  const status = await getUserLegalCompliance(supabase, user.id);
  const returnTo =
    typeof sp.next === "string" && sp.next.startsWith("/") ? sp.next : "/account";

  if (status.complete) {
    return (
      <MarketingPageContainer className="pb-24">
        <MarketingPageHeader title="Documents signés">
          <p>
            Votre règlement intérieur et votre décharge sont à jour. Vous pouvez
            réserver.
          </p>
        </MarketingPageHeader>
        <Link
          href={returnTo}
          className="mt-6 inline-flex text-[#4a56dd] underline underline-offset-2"
        >
          Continuer
        </Link>
      </MarketingPageContainer>
    );
  }

  const defaultTypedName = [
    user.user_metadata?.first_name,
    user.user_metadata?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <MarketingPageContainer className="pb-24">
      <div className="mb-6">
        <Link
          href="/account"
          className="text-sm font-semibold text-[#4a56dd] underline underline-offset-2"
        >
          ← retour au compte
        </Link>
      </div>
      <MarketingPageHeader title="Documents à signer">
        <p>
          Avant votre première réservation, merci de signer le règlement
          intérieur et la décharge de responsabilité, et d’indiquer votre choix
          pour le droit à l’image.
        </p>
      </MarketingPageHeader>
      <div className="mt-8 rounded-[19px] border border-black/10 bg-[#fff8f0] p-6">
        <DocumentSigningForm
          documents={status.documents}
          profile={status.profile}
          defaultTypedName={defaultTypedName}
          channel="online"
          returnTo={returnTo}
        />
      </div>
    </MarketingPageContainer>
  );
}

export default function AccountDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  return (
    <main className="min-h-screen bg-white text-black">
      <Suspense fallback={<div className="p-8 text-center">Chargement…</div>}>
        <DocumentsContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
