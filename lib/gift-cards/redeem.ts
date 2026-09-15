import {
  generateGiftCardCode,
  isValidGiftCardCodeFormat,
  normalizeGiftCardCode,
} from "@/lib/gift-cards/code";
import {
  giftCardCreditsRemaining,
  giftCardPaymentType,
  type GiftCardRow,
} from "@/lib/gift-cards/types";
import { getAdminClient } from "@/lib/square/server";

export type GiftCardValidationContext = {
  activityId?: string | null;
  sessionId?: string | null;
  requiredCredits?: number;
  requiredAmountCents?: number;
  participantCount?: number;
};

export type GiftCardValidationResult =
  | {
      ok: true;
      giftCard: GiftCardRow;
      creditsRemaining: number;
    }
  | {
      ok: false;
      error: string;
    };

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") {
    return value;
  }

  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value) || 0;
}

export async function loadGiftCardByCode(
  rawCode: string,
): Promise<GiftCardRow | null> {
  const code = normalizeGiftCardCode(rawCode);

  if (!isValidGiftCardCodeFormat(code)) {
    return null;
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("gift_card")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error("Error loading gift card:", error);
    return null;
  }

  return (data as GiftCardRow | null) ?? null;
}

export async function validateGiftCardForBooking(
  rawCode: string,
  context: GiftCardValidationContext,
): Promise<GiftCardValidationResult> {
  const giftCard = await loadGiftCardByCode(rawCode);

  if (!giftCard) {
    return { ok: false, error: "Code carte cadeau invalide." };
  }

  if (giftCard.status === "pending") {
    return {
      ok: false,
      error: "Ce code n'est pas encore actif. Attendez la confirmation du paiement.",
    };
  }

  if (giftCard.status === "redeemed" || giftCard.status === "depleted") {
    return { ok: false, error: "Cette carte cadeau a déjà été utilisée." };
  }

  if (giftCard.status !== "active") {
    return { ok: false, error: "Cette carte cadeau n'est plus valable." };
  }

  if (new Date(giftCard.expires_at).getTime() <= Date.now()) {
    return { ok: false, error: "Cette carte cadeau a expiré." };
  }

  const creditsRemaining = giftCardCreditsRemaining(giftCard);

  if (giftCard.kind === "credits") {
    const requiredCredits = context.requiredCredits ?? 0;

    if (requiredCredits <= 0) {
      return { ok: false, error: "Cette réservation ne peut pas être payée en crédits." };
    }

    if (creditsRemaining < requiredCredits) {
      return {
        ok: false,
        error: `Solde insuffisant (${creditsRemaining} crédit${creditsRemaining !== 1 ? "s" : ""} restant${creditsRemaining !== 1 ? "s" : ""}, ${requiredCredits} requis).`,
      };
    }

    return { ok: true, giftCard, creditsRemaining };
  }

  if (giftCard.kind === "course") {
    const activityId = context.activityId?.trim() ?? "";
    const sessionId = context.sessionId?.trim() ?? "";

    if (giftCard.session_id && sessionId && giftCard.session_id !== sessionId) {
      return {
        ok: false,
        error: "Cette carte cadeau est valable pour une autre session.",
      };
    }

    if (giftCard.activity_id && activityId && giftCard.activity_id !== activityId) {
      return {
        ok: false,
        error: "Cette carte cadeau est valable pour un autre cours.",
      };
    }

    const participantCount = Math.max(1, context.participantCount ?? 1);
    const unitPriceCents = context.requiredAmountCents ?? 0;
    const requiredAmountCents = unitPriceCents * participantCount;

    if (unitPriceCents <= 0) {
      return {
        ok: false,
        error: "Cette réservation n'a pas de tarif cours associé.",
      };
    }

    if (giftCard.amount_cents < requiredAmountCents) {
      return {
        ok: false,
        error: "Cette carte cadeau ne couvre pas le montant de la réservation.",
      };
    }

    return { ok: true, giftCard, creditsRemaining: 0 };
  }

  return { ok: false, error: "Type de carte cadeau inconnu." };
}

export async function redeemGiftCardForRegistration({
  giftCard,
  userId,
  registrationId,
  creditsUsed,
  amountCentsUsed,
}: {
  giftCard: GiftCardRow;
  userId: string;
  registrationId: string;
  creditsUsed: number;
  amountCentsUsed: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getAdminClient();

  if (giftCard.kind === "credits") {
    const remaining = giftCardCreditsRemaining(giftCard);
    const nextRemaining = remaining - creditsUsed;

    if (nextRemaining < 0) {
      return { ok: false, error: "Solde carte cadeau insuffisant." };
    }

    const nextStatus = nextRemaining <= 0 ? "depleted" : "active";

    const { error: updateError } = await supabase
      .from("gift_card")
      .update({
        credits: nextRemaining,
        status: nextStatus,
        redeemed_by_user_id: userId,
      })
      .eq("id", giftCard.id)
      .eq("status", "active");

    if (updateError) {
      console.error("Error updating gift card balance:", updateError);
      return { ok: false, error: "Impossible d'utiliser la carte cadeau." };
    }
  } else {
    const { error: updateError } = await supabase
      .from("gift_card")
      .update({
        status: "redeemed",
        redeemed_by_user_id: userId,
      })
      .eq("id", giftCard.id)
      .eq("status", "active");

    if (updateError) {
      console.error("Error redeeming course gift card:", updateError);
      return { ok: false, error: "Impossible d'utiliser la carte cadeau." };
    }
  }

  const { error: redemptionError } = await supabase.from("gift_card_redemption").insert({
    gift_card_id: giftCard.id,
    registration_id: registrationId,
    credits_used: creditsUsed,
    amount_cents_used: amountCentsUsed,
    redeemed_by_user_id: userId,
  });

  if (redemptionError) {
    console.error("Error recording gift card redemption:", redemptionError);
    return { ok: false, error: "Impossible d'enregistrer l'utilisation de la carte cadeau." };
  }

  return { ok: true };
}

export { generateGiftCardCode, giftCardPaymentType, normalizeGiftCardCode };
