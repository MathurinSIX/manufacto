import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DocumentSigningForm } from "@/components/legal/document-signing-form";
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
      <div>
        <h1 className="text-[28px] font-bold tracking-[-0.02em] md:text-[34px]">
          Documents signés
        </h1>
        <p className="mt-3 text-base text-black/70 md:text-lg">
          Votre règlement intérieur et votre décharge sont à jour. Vous pouvez
          réserver.
        </p>
        <Link
          href={returnTo}
          className="mt-6 inline-flex rounded-[12px] bg-[#4a56dd] px-5 py-3 text-base font-semibold text-white"
        >
          Continuer
        </Link>
      </div>
    );
  }

  const defaultTypedName = [
    user.user_metadata?.first_name,
    user.user_metadata?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <Link
        href="/account"
        className="text-sm font-semibold text-[#4a56dd] underline underline-offset-2"
      >
        ← retour au compte
      </Link>
      <h1 className="mt-4 text-[28px] font-bold tracking-[-0.02em] md:text-[34px]">
        Documents à signer
      </h1>
      <p className="mt-3 text-base text-black/70 md:text-lg">
        Avant votre première réservation, merci de signer le règlement
        intérieur et la décharge de responsabilité, et d’indiquer votre choix
        pour le droit à l’image.
      </p>
      <div className="mt-6 rounded-[16px] border border-black/10 bg-white p-5 shadow-sm ring-1 ring-black/5 md:p-6">
        <DocumentSigningForm
          documents={status.documents}
          profile={status.profile}
          defaultTypedName={defaultTypedName}
          channel="online"
          returnTo={returnTo}
        />
      </div>
    </div>
  );
}

export default function AccountDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  return (
    <Suspense fallback={<div className="py-10 text-center text-black/60">Chargement…</div>}>
      <DocumentsContent searchParams={searchParams} />
    </Suspense>
  );
}
