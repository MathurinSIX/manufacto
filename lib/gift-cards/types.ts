export type GiftCardKind = "credits" | "course";

export type GiftCardStatus =
  | "pending"
  | "active"
  | "depleted"
  | "redeemed"
  | "expired"
  | "cancelled";

export type GiftCardRow = {
  id: string;
  code: string;
  kind: GiftCardKind;
  credits: number | string | null;
  initial_credits: number | string | null;
  amount_cents: number;
  product_id: string | null;
  activity_id: string | null;
  session_id: string | null;
  purchaser_email: string;
  recipient_email: string;
  personal_message: string | null;
  status: GiftCardStatus;
  square_order_id: string | null;
  square_payment_id: string | null;
  square_payment_link_id: string | null;
  idempotency_key: string;
  redeemed_by_user_id: string | null;
  expires_at: string;
  fulfilled_at: string | null;
  created_at: string;
};

export function giftCardCreditsRemaining(card: Pick<GiftCardRow, "credits">): number {
  if (card.credits === null || card.credits === undefined) {
    return 0;
  }

  return typeof card.credits === "number" ? card.credits : Number(card.credits) || 0;
}

export function giftCardPaymentType(giftCardId: string): string {
  return `gift_card:${giftCardId}`;
}

export function parseGiftCardPaymentType(
  paymentType: string | null | undefined,
): string | null {
  if (!paymentType?.startsWith("gift_card:")) {
    return null;
  }

  const giftCardId = paymentType.slice("gift_card:".length).trim();
  return giftCardId.length > 0 ? giftCardId : null;
}
