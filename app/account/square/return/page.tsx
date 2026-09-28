import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fulfillSquarePurchaseFromRedirect } from "@/lib/square/server";
import { createClient } from "@/lib/supabase/server";
import { resolveAccountUserId } from "@/lib/account-share";

// Note: do NOT add `export const dynamic = "force-dynamic"` here. It is
// incompatible with `cacheComponents` (next.config.ts) and 500s the page,
// which silently breaks Square fulfillment on redirect. `await searchParams`
// already opts this route into dynamic rendering.

type SquareReturnSearchParams = {
  orderId?: string | string[];
  transactionId?: string | string[];
  checkoutId?: string | string[];
  referenceId?: string | string[];
};

function firstString(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0]?.trim() || null;
  }
  return value?.trim() || null;
}

async function userNeedsAtelierVisitPrompt(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: visitActivities } = await supabase
    .from("activity")
    .select("id")
    .eq("type", "visite")
    .is("deleted_at", null);

  const visitIds = (visitActivities ?? []).map((row) => row.id);
  if (visitIds.length === 0) {
    return true;
  }

  const { data: sessions } = await supabase
    .from("session")
    .select("id")
    .in("activity_id", visitIds);

  const sessionIds = (sessions ?? []).map((row) => row.id);
  if (sessionIds.length === 0) {
    return true;
  }

  const { data: registrations } = await supabase
    .from("registration")
    .select("id")
    .eq("user_id", userId)
    .in("session_id", sessionIds)
    .limit(1);

  return !registrations?.length;
}

// Reading `searchParams` must happen inside its own Suspense boundary under
// `cacheComponents`, otherwise the whole page is blocked from streaming and
// Next 16 logs a runtime error.
async function SquareReturnFulfillment({
  searchParams,
}: {
  searchParams?: Promise<SquareReturnSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const orderId = firstString(params.orderId);
  const transactionId = firstString(params.transactionId);

  if (orderId || transactionId) {
    await fulfillSquarePurchaseFromRedirect({
      orderId,
      paymentId: transactionId,
    });
  }

  return null;
}

async function SquareReturnCtas() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const showVisitCta = user
    ? await userNeedsAtelierVisitPrompt(
        await resolveAccountUserId(supabase, user.id),
      )
    : false;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {showVisitCta ? (
        <Link
          href="/reserver"
          className="inline-flex rounded-[14px] bg-[#f56800] px-5 py-3 font-semibold text-white transition hover:bg-[#d95a00]"
        >
          Réserver ma visite de l&apos;atelier
        </Link>
      ) : null}
      <Link
        href="/account"
        className="inline-flex rounded-[14px] bg-[#4a56dd] px-5 py-3 font-semibold text-white transition hover:bg-[#3844c8]"
      >
        Retour à mon compte
      </Link>
    </div>
  );
}

export default function SquareReturnPage({
  searchParams,
}: {
  searchParams?: Promise<SquareReturnSearchParams>;
}) {
  return (
    <main className="min-h-screen bg-[#fff8f0] px-5 py-20 text-black">
      <Suspense fallback={null}>
        <SquareReturnFulfillment searchParams={searchParams} />
      </Suspense>
      <Card className="mx-auto max-w-[620px] rounded-[19px] border border-black/10 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="text-[30px] leading-tight">
            Paiement reçu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-base leading-normal text-black/70">
          <p>
            Merci pour votre achat. Square confirme le paiement en arrière-plan ;
            votre réservation ou vos crédits apparaîtront dans votre compte dans
            quelques instants.
          </p>
          <Suspense
            fallback={
              <Link
                href="/account"
                className="inline-flex rounded-[14px] bg-[#4a56dd] px-5 py-3 font-semibold text-white transition hover:bg-[#3844c8]"
              >
                Retour à mon compte
              </Link>
            }
          >
            <SquareReturnCtas />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
