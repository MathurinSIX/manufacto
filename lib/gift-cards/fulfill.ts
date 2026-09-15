import {
  notifyGiftCardIssued,
  notifyGiftCardPurchaser,
} from "@/lib/email/gift-card-emails";
import { getAdminClient } from "@/lib/square/server";
import type { GiftCardRow } from "@/lib/gift-cards/types";

const GIFT_CARD_VALIDITY_MS = 365 * 24 * 60 * 60 * 1000;

export function giftCardExpiresAt(from = new Date()): string {
  return new Date(from.getTime() + GIFT_CARD_VALIDITY_MS).toISOString();
}

export async function fulfillGiftCardPurchase({
  orderId,
  paymentId,
}: {
  orderId?: string | null;
  paymentId?: string | null;
}): Promise<{ fulfilled: boolean; giftCard?: GiftCardRow }> {
  if (!orderId && !paymentId) {
    return { fulfilled: false };
  }

  const supabase = getAdminClient();
  const filters: string[] = [];

  if (orderId) {
    filters.push(`square_order_id.eq.${orderId}`);
  }

  if (paymentId) {
    filters.push(`square_payment_id.eq.${paymentId}`);
  }

  const { data: existingByPayment, error: existingError } = paymentId
    ? await supabase
        .from("gift_card")
        .select("*")
        .eq("square_payment_id", paymentId)
        .in("status", ["active", "depleted", "redeemed"])
        .maybeSingle()
    : { data: null, error: null };

  if (existingError) {
    console.error("Error checking fulfilled gift card:", existingError);
    return { fulfilled: false };
  }

  if (existingByPayment) {
    return { fulfilled: true, giftCard: existingByPayment as GiftCardRow };
  }

  const { data: pendingCard, error: pendingError } = await supabase
    .from("gift_card")
    .select("*")
    .eq("status", "pending")
    .or(filters.join(","))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pendingError) {
    console.error("Error finding pending gift card:", pendingError);
    return { fulfilled: false };
  }

  if (!pendingCard) {
    return { fulfilled: false };
  }

  const fulfilledAt = new Date().toISOString();
  const { data: activatedCard, error: activateError } = await supabase
    .from("gift_card")
    .update({
      status: "active",
      square_order_id: orderId ?? pendingCard.square_order_id,
      square_payment_id: paymentId ?? pendingCard.square_payment_id,
      fulfilled_at: fulfilledAt,
    })
    .eq("id", pendingCard.id)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (activateError) {
    console.error("Error activating gift card:", activateError);
    throw activateError;
  }

  if (!activatedCard) {
    return { fulfilled: false };
  }

  void notifyGiftCardIssued(activatedCard.id).catch((error) => {
    console.error("Failed to send gift card email:", error);
  });
  void notifyGiftCardPurchaser(activatedCard.id).catch((error) => {
    console.error("Failed to send gift card purchaser email:", error);
  });

  return { fulfilled: true, giftCard: activatedCard as GiftCardRow };
}

export async function fulfillGiftCardFromRedirect({
  orderId,
  paymentId,
}: {
  orderId?: string | null;
  paymentId?: string | null;
}) {
  if (!orderId && !paymentId) {
    return { fulfilled: false as const, reason: "missing-ids" as const };
  }

  try {
    const result = await fulfillGiftCardPurchase({ orderId, paymentId });
    return result.fulfilled
      ? ({ fulfilled: true as const } as const)
      : ({ fulfilled: false as const, reason: "not-found" as const } as const);
  } catch (error) {
    console.error("Error fulfilling gift card from redirect:", error);
    return { fulfilled: false as const, reason: "error" as const };
  }
}
