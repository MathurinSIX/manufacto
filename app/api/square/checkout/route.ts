import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSquareProduct } from "@/lib/square/load-products";
import { resolveSquareSubscriptionFromItemVariation } from "@/lib/square/catalog-api";
import {
  createSquareCatalogPaymentLink,
  createSquareSubscriptionPaymentLink,
  getAdminClient,
  getSiteUrl,
  syncSupabaseUserToSquare,
} from "@/lib/square/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CheckoutBody = {
  productId?: string;
  activityId?: string;
  sessionId?: string;
  reservationStart?: string;
  reservationEnd?: string;
};

function buildPurchaseContextColumns({
  activityId,
  sessionId,
  reservationStartDate,
  reservationEndDate,
  hasValidReservationWindow,
}: {
  activityId: string | null;
  sessionId: string;
  reservationStartDate: Date | null;
  reservationEndDate: Date | null;
  hasValidReservationWindow: boolean | Date | null;
}) {
  return {
    ...(activityId ? { activity_id: activityId } : {}),
    ...(sessionId ? { session_id: sessionId } : {}),
    ...(hasValidReservationWindow && reservationStartDate && reservationEndDate
      ? {
          reserved_start_ts: reservationStartDate.toISOString(),
          reserved_end_ts: reservationEndDate.toISOString(),
        }
      : {}),
  };
}

export async function POST(request: Request) {
  try {
    const { productId, activityId, sessionId, reservationStart, reservationEnd } =
      (await request.json()) as CheckoutBody;

    if (!productId?.trim()) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 400 });
    }

    const normalizedProductId = productId.trim();
    const catalogProduct = await getSquareProduct(normalizedProductId);
    const isActivityCatalogCheckout = !catalogProduct;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const canCheckoutWithoutAccount = isActivityCatalogCheckout;

    if (!user && !canCheckoutWithoutAccount) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const siteUrl = getSiteUrl(request);
    const redirectPath = user
      ? "/account/square/return"
      : activityId
        ? "/cours"
        : "/pratique-libre";

    const adminClientForBuyer = user ? getAdminClient() : null;
    const squareCustomerId =
      user && adminClientForBuyer
        ? await syncSupabaseUserToSquare({
            supabase: adminClientForBuyer,
            userId: user.id,
          })
        : null;
    const userFullName =
      ((user?.user_metadata?.full_name as string | undefined) ??
        (user?.user_metadata?.name as string | undefined) ??
        [
          user?.user_metadata?.first_name as string | undefined,
          user?.user_metadata?.last_name as string | undefined,
        ]
          .filter(Boolean)
          .join(" ")) ||
      null;
    const userPhone = (user?.user_metadata?.phone as string | undefined) ?? null;
    const buyer = {
      userId: user?.id,
      userEmail: user?.email,
      userFullName: userFullName || null,
      userPhone: userPhone || null,
      squareCustomerId,
    };

    if (catalogProduct) {
      const normalizedSessionId = sessionId?.trim() ?? "";
      const normalizedActivityId = activityId?.trim() ?? "";
      const activityIdForPurchase = UUID_RE.test(normalizedActivityId)
        ? normalizedActivityId
        : null;
      const reservationStartDate = reservationStart
        ? new Date(reservationStart)
        : null;
      const reservationEndDate = reservationEnd ? new Date(reservationEnd) : null;
      const hasValidReservationWindow =
        reservationStartDate &&
        reservationEndDate &&
        !Number.isNaN(reservationStartDate.getTime()) &&
        !Number.isNaN(reservationEndDate.getTime()) &&
        reservationEndDate.getTime() > reservationStartDate.getTime();
      const purchaseContextColumns = buildPurchaseContextColumns({
        activityId: activityIdForPurchase,
        sessionId: normalizedSessionId,
        reservationStartDate,
        reservationEndDate,
        hasValidReservationWindow,
      });

      if (catalogProduct.kind === "discovery") {
        if (!user) {
          return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        if (
          !UUID_RE.test(normalizedSessionId) ||
          !hasValidReservationWindow
        ) {
          return NextResponse.json(
            { error: "Sélectionnez un créneau avant de payer" },
            { status: 400 },
          );
        }
      }

      if (catalogProduct.kind === "subscription") {
        if (!catalogProduct.catalogObjectId) {
          return NextResponse.json(
            {
              error:
                "Cet abonnement n'est pas encore lié à un produit Square. Contactez l'atelier.",
            },
            { status: 400 },
          );
        }

        const resolved = await resolveSquareSubscriptionFromItemVariation(
          catalogProduct.catalogObjectId,
        );

        if (!resolved) {
          return NextResponse.json(
            {
              error:
                "Le produit Square lié n'est pas configuré en tant qu'abonnement. Vérifiez la configuration dans Square (champ « Subscription plans » sur l'article) ou contactez l'atelier.",
            },
            { status: 400 },
          );
        }

        const paymentLink = await createSquareSubscriptionPaymentLink({
          product: catalogProduct,
          itemVariationId: resolved.itemVariationId,
          planVariationId: resolved.planVariationId,
          buyer,
          siteUrl,
          redirectPath,
        });

        if (user) {
          const adminClient = getAdminClient();
          const { error: insertError } = await adminClient.from("square_purchase").insert({
            user_id: user.id,
            product_id: catalogProduct.id,
            product_kind: catalogProduct.kind,
            amount_cents: catalogProduct.amountCents,
            credits: catalogProduct.credits,
            currency: "EUR",
            status: "pending",
            square_payment_link_id: paymentLink.paymentLinkId,
            square_payment_link_url: paymentLink.paymentLinkUrl,
            square_order_id: paymentLink.orderId,
            square_customer_id: squareCustomerId,
            idempotency_key: paymentLink.idempotencyKey,
            ...purchaseContextColumns,
          });

          if (insertError) {
            console.error("Error recording Square subscription purchase:", insertError);
            return NextResponse.json(
              { error: "Impossible de préparer le paiement" },
              { status: 500 },
            );
          }
        }

        return NextResponse.json({ url: paymentLink.paymentLinkUrl });
      }

      if (catalogProduct.catalogObjectId) {
        const paymentLink = await createSquareCatalogPaymentLink({
          catalogObjectId: catalogProduct.catalogObjectId,
          buyer,
          siteUrl,
          redirectPath,
          paymentNote: `Manufacto ${catalogProduct.name} (${catalogProduct.id})${
            user?.id ? ` for ${user.id}` : ""
          }`,
        });

        if (user) {
          const adminClient = getAdminClient();
          const { error: insertError } = await adminClient.from("square_purchase").insert({
            user_id: user.id,
            product_id: catalogProduct.id,
            product_kind: catalogProduct.kind,
            amount_cents: catalogProduct.amountCents,
            credits: catalogProduct.credits,
            currency: "EUR",
            status: "pending",
            square_payment_link_id: paymentLink.paymentLinkId,
            square_payment_link_url: paymentLink.paymentLinkUrl,
            square_order_id: paymentLink.orderId,
            square_customer_id: squareCustomerId,
            idempotency_key: paymentLink.idempotencyKey,
            ...purchaseContextColumns,
          });

          if (insertError) {
            console.error("Error recording Square purchase:", insertError);
            return NextResponse.json(
              { error: "Impossible de préparer le paiement" },
              { status: 500 },
            );
          }
        }

        return NextResponse.json({ url: paymentLink.paymentLinkUrl });
      }

      return NextResponse.json(
        {
          error:
            "Ce produit n'est pas encore lié à un produit Square. Contactez l'atelier.",
        },
        { status: 400 },
      );
    }

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const normalizedSessionId = sessionId?.trim() ?? "";
    if (!UUID_RE.test(normalizedSessionId)) {
      return NextResponse.json(
        { error: "Sélectionnez une session avant de payer" },
        { status: 400 },
      );
    }

    const normalizedActivityId = activityId?.trim() ?? "";
    const activityIdForPurchase = UUID_RE.test(normalizedActivityId)
      ? normalizedActivityId
      : null;
    const purchaseContextColumns = buildPurchaseContextColumns({
      activityId: activityIdForPurchase,
      sessionId: normalizedSessionId,
      reservationStartDate: null,
      reservationEndDate: null,
      hasValidReservationWindow: false,
    });

    const paymentLink = await createSquareCatalogPaymentLink({
      catalogObjectId: normalizedProductId,
      buyer,
      siteUrl,
      redirectPath,
      paymentNote: [
        "Manufacto cours",
        normalizedProductId,
        activityIdForPurchase ? `activity ${activityIdForPurchase}` : null,
        `session ${normalizedSessionId}`,
        `user ${user.id}`,
      ]
        .filter(Boolean)
        .join(" · "),
    });

    const adminClient = getAdminClient();
    const { error: insertError } = await adminClient.from("square_purchase").insert({
      user_id: user.id,
      product_id: normalizedProductId,
      product_kind: "course",
      amount_cents: 0,
      credits: 0,
      currency: "EUR",
      status: "pending",
      square_payment_link_id: paymentLink.paymentLinkId,
      square_payment_link_url: paymentLink.paymentLinkUrl,
      square_order_id: paymentLink.orderId,
      square_customer_id: squareCustomerId,
      idempotency_key: paymentLink.idempotencyKey,
      ...purchaseContextColumns,
    });

    if (insertError) {
      console.error("Error recording Square catalog purchase:", insertError);
      return NextResponse.json(
        { error: "Impossible de préparer le paiement" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: paymentLink.paymentLinkUrl });
  } catch (error) {
    console.error("Square checkout error:", error);
    return NextResponse.json(
      { error: "Impossible de démarrer le paiement Square" },
      { status: 500 },
    );
  }
}
