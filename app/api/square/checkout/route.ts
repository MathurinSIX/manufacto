import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSquareProduct, loadSquareProducts } from "@/lib/square/load-products";
import { resolveSquareSubscriptionFromItemVariation } from "@/lib/square/catalog-api";
import {
  createSquareAdHocPaymentLink,
  createSquareCatalogPaymentLink,
  createSquareSubscriptionPaymentLink,
  getAdminClient,
  getSiteUrl,
  syncSupabaseUserToSquare,
} from "@/lib/square/server";
import { clampParticipantCount } from "@/lib/participant-count";
import { resolveAccountUserId } from "@/lib/account-share";
import {
  bookingParticipantsAreValid,
  normalizeBookingParticipants,
} from "@/lib/participant-count";
import { quoteCustomCredits } from "@/lib/credit-rates";
import {
  clampCreditUnitQuantity,
  isUnitCreditPack,
} from "@/lib/square/products";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CheckoutBody = {
  productId?: string;
  activityId?: string;
  sessionId?: string;
  reservationStart?: string;
  reservationEnd?: string;
  participantCount?: number;
  participantNames?: string[];
  participantEmails?: string[];
  quantity?: number;
  customAmountEuros?: number;
};

function isBookingProductKind(kind: string) {
  return kind === "course" || kind === "discovery";
}

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
    const {
      productId,
      activityId,
      sessionId,
      reservationStart,
      reservationEnd,
      participantCount: participantCountInput,
      participantNames: participantNamesInput,
      participantEmails: participantEmailsInput,
      quantity: quantityInput,
      customAmountEuros,
    } = (await request.json()) as CheckoutBody;

    if (customAmountEuros != null) {
      const amountCents = Math.round(Number(customAmountEuros) * 100);
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      }
      const accountUserId = await resolveAccountUserId(supabase, user.id);
      const { getUserLegalCompliance } = await import("@/lib/legal/status");
      const { LEGAL_REQUIRED_ERROR, LEGAL_DOCS_PATH } = await import(
        "@/lib/legal/types"
      );
      const compliance = await getUserLegalCompliance(supabase, accountUserId);
      if (!compliance.complete) {
        return NextResponse.json(
          {
            error: LEGAL_REQUIRED_ERROR,
            redirectTo: LEGAL_DOCS_PATH,
          },
          { status: 403 },
        );
      }

      const products = await loadSquareProducts(supabase);
      const quote = quoteCustomCredits(
        amountCents,
        products
          .filter(
            (product) =>
              product.kind === "credit_pack" && product.credits !== 2,
          )
          .map((product) => ({
            id: product.id,
            credits: product.credits,
            amountCents: product.amountCents,
          })),
      );
      if (!quote) {
        return NextResponse.json(
          {
            error:
              "Choisissez un montant au moins égal au plus petit pack de crédits.",
          },
          { status: 400 },
        );
      }

      const adminClient = getAdminClient();
      const squareCustomerId = await syncSupabaseUserToSquare({
        supabase: adminClient,
        userId: user.id,
      });
      const siteUrl = getSiteUrl(request);
      const paymentLink = await createSquareAdHocPaymentLink({
        name: `Crédits Manufacto — ${quote.credits} crédits`,
        amountCents: quote.amountCents,
        buyer: {
          userId: user.id,
          userEmail: user.email,
          squareCustomerId,
        },
        siteUrl,
        redirectPath: "/account/square/return",
        paymentNote: `Manufacto credits custom for ${accountUserId}`,
      });

      const { error: insertError } = await adminClient.from("square_purchase").insert({
        user_id: accountUserId,
        product_id: "credits-custom",
        product_kind: "credit_pack",
        amount_cents: quote.amountCents,
        credits: quote.credits,
        currency: "EUR",
        status: "pending",
        square_payment_link_id: paymentLink.paymentLinkId,
        square_payment_link_url: paymentLink.paymentLinkUrl,
        square_order_id: paymentLink.orderId,
        square_customer_id: squareCustomerId,
        idempotency_key: paymentLink.idempotencyKey,
      });

      if (insertError) {
        console.error("Error recording custom credit purchase:", insertError);
        return NextResponse.json(
          { error: "Impossible de préparer le paiement" },
          { status: 500 },
        );
      }

      return NextResponse.json({ url: paymentLink.paymentLinkUrl });
    }

    const participantCount = clampParticipantCount(participantCountInput ?? 1);
    const participants = normalizeBookingParticipants(
      Array.from({ length: participantCount }, (_, index) => ({
        name: participantNamesInput?.[index] ?? "",
        email: participantEmailsInput?.[index] ?? "",
      })),
    );
    const participantNames = participants.map((participant) => participant.name);
    const participantEmails = participants.map((participant) => participant.email);
    const sessionNeedsAttendees = Boolean(sessionId?.trim());
    if (sessionNeedsAttendees && !bookingParticipantsAreValid(participants)) {
      return NextResponse.json(
        {
          error:
            "Indiquez le nom de chaque personne. L'e-mail, s'il est rempli, doit être valide.",
        },
        { status: 400 },
      );
    }
    const requestedQuantity = clampCreditUnitQuantity(quantityInput ?? 1);

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

    const accountUserId = user
      ? await resolveAccountUserId(supabase, user.id)
      : null;

    if (user && accountUserId) {
      const { getUserLegalCompliance } = await import("@/lib/legal/status");
      const { LEGAL_REQUIRED_ERROR, LEGAL_DOCS_PATH } = await import(
        "@/lib/legal/types"
      );
      const compliance = await getUserLegalCompliance(supabase, accountUserId);
      if (!compliance.complete) {
        return NextResponse.json(
          {
            error: LEGAL_REQUIRED_ERROR,
            redirectTo: LEGAL_DOCS_PATH,
            message:
              "Avant de réserver, merci de signer le règlement intérieur et la décharge.",
          },
          { status: 403 },
        );
      }
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
            user_id: accountUserId,
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

      if (catalogProduct.kind === "credit_pack" && (!user || !accountUserId)) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      }

      if (catalogProduct.catalogObjectId) {
        const checkoutQuantity = isBookingProductKind(catalogProduct.kind)
          ? participantCount
          : isUnitCreditPack(catalogProduct)
            ? requestedQuantity
            : 1;
        const paymentLink = await createSquareCatalogPaymentLink({
          catalogObjectId: catalogProduct.catalogObjectId,
          buyer,
          siteUrl,
          redirectPath,
          quantity: checkoutQuantity,
          paymentNote: `Manufacto ${catalogProduct.name} (${catalogProduct.id})${
            user?.id ? ` for ${accountUserId}` : ""
          }`,
        });

        if (user) {
          const adminClient = getAdminClient();
          const { error: insertError } = await adminClient.from("square_purchase").insert({
            user_id: accountUserId,
            product_id: catalogProduct.id,
            product_kind: catalogProduct.kind,
            amount_cents: catalogProduct.amountCents * checkoutQuantity,
            credits: catalogProduct.credits * checkoutQuantity,
            currency: "EUR",
            status: "pending",
            square_payment_link_id: paymentLink.paymentLinkId,
            square_payment_link_url: paymentLink.paymentLinkUrl,
            square_order_id: paymentLink.orderId,
            square_customer_id: squareCustomerId,
            idempotency_key: paymentLink.idempotencyKey,
            ...(isBookingProductKind(catalogProduct.kind)
              ? {
                  participant_count: checkoutQuantity,
                  participant_names: participantNames,
                  participant_emails: participantEmails,
                }
              : {}),
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

    const adminClient = getAdminClient();
    const activityQuery = adminClient
      .from("activity")
      .select("id, name, price, type");
    const { data: activity } = activityIdForPurchase
      ? await activityQuery.eq("id", activityIdForPurchase).maybeSingle()
      : await activityQuery.eq("square_product_id", normalizedProductId).maybeSingle();

    const coursePrice =
      activity?.type === "cours" && activity.price != null
        ? Number(activity.price)
        : null;

    if (coursePrice != null && Number.isFinite(coursePrice) && coursePrice > 0) {
      const courseQuantity = Math.max(1, participantCount);
      const courseAmountCents = Math.round(coursePrice * 100) * courseQuantity;
      const courseName = activity?.name?.trim() || "Cours";
      const paymentLink = await createSquareAdHocPaymentLink({
        name:
          courseQuantity > 1
            ? `${courseName} — ${courseQuantity} places`
            : courseName,
        amountCents: courseAmountCents,
        buyer,
        siteUrl,
        redirectPath,
        paymentNote: [
          "Manufacto cours",
          courseName,
          activity?.id ? `activity ${activity.id}` : null,
          `session ${normalizedSessionId}`,
          `user ${accountUserId}`,
        ]
          .filter(Boolean)
          .join(" · "),
      });

      const { error: insertError } = await adminClient.from("square_purchase").insert({
        user_id: accountUserId,
        product_id: activity?.id ?? normalizedProductId,
        product_kind: "course",
        amount_cents: courseAmountCents,
        credits: 0,
        currency: "EUR",
        status: "pending",
        square_payment_link_id: paymentLink.paymentLinkId,
        square_payment_link_url: paymentLink.paymentLinkUrl,
        square_order_id: paymentLink.orderId,
        square_customer_id: squareCustomerId,
        idempotency_key: paymentLink.idempotencyKey,
        participant_count: courseQuantity,
        participant_names: participantNames,
        participant_emails: participantEmails,
        ...purchaseContextColumns,
      });

      if (insertError) {
        console.error("Error recording course purchase:", insertError);
        return NextResponse.json(
          { error: "Impossible de préparer le paiement" },
          { status: 500 },
        );
      }

      return NextResponse.json({ url: paymentLink.paymentLinkUrl });
    }

    const paymentLink = await createSquareCatalogPaymentLink({
      catalogObjectId: normalizedProductId,
      buyer,
      siteUrl,
      redirectPath,
      quantity: participantCount,
      paymentNote: [
        "Manufacto cours",
        normalizedProductId,
        activityIdForPurchase ? `activity ${activityIdForPurchase}` : null,
        `session ${normalizedSessionId}`,
        `user ${accountUserId}`,
      ]
        .filter(Boolean)
        .join(" · "),
    });

    const { error: insertError } = await adminClient.from("square_purchase").insert({
      user_id: accountUserId,
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
      participant_count: participantCount,
      participant_names: participantNames,
      participant_emails: participantEmails,
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
