import { Suspense } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fulfillGiftCardFromRedirect } from "@/lib/gift-cards/fulfill";

type MerciSearchParams = {
  orderId?: string | string[];
  transactionId?: string | string[];
};

function firstString(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0]?.trim() || null;
  }
  return value?.trim() || null;
}

async function GiftReturnFulfillment({
  searchParams,
}: {
  searchParams?: Promise<MerciSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const orderId = firstString(params.orderId);
  const transactionId = firstString(params.transactionId);

  if (orderId || transactionId) {
    await fulfillGiftCardFromRedirect({
      orderId,
      paymentId: transactionId,
    });
  }

  return null;
}

export default function OffrirMerciPage({
  searchParams,
}: {
  searchParams?: Promise<MerciSearchParams>;
}) {
  return (
    <main className="min-h-screen bg-[#fff8f0] px-5 py-20 text-black">
      <Suspense fallback={null}>
        <GiftReturnFulfillment searchParams={searchParams} />
      </Suspense>
      <Card className="mx-auto max-w-[620px] rounded-[19px] border border-black/10 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="text-[30px] leading-tight">Merci pour votre achat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-base leading-normal text-black/70">
          <p>
            Votre paiement est confirmé. Le code carte cadeau sera envoyé par e-mail
            dans quelques instants.
          </p>
          <p>
            La personne pourra l&apos;utiliser lors de sa réservation en choisissant
            <strong> Carte cadeau</strong> comme mode de paiement.
          </p>
          <Link
            href="/offrir"
            className="inline-flex rounded-[14px] bg-[#4a56dd] px-5 py-3 font-semibold text-white transition hover:bg-[#3844c8]"
          >
            Retour à Offrir
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
