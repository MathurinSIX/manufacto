import { sendEmail } from "@/lib/email/resend";
import { getAdminClient } from "@/lib/square/server";
import { giftCardCreditsRemaining, type GiftCardRow } from "@/lib/gift-cards/types";

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

function formatGiftCardSummary(card: GiftCardRow): string {
  if (card.kind === "credits") {
    const credits = giftCardCreditsRemaining(card);
    return `${credits} crédit${credits !== 1 ? "s" : ""} pour la pratique libre`;
  }

  return `Un cours Manufacto (${priceFormatter.format(card.amount_cents / 100)})`;
}

function buildGiftCardEmailHtml({
  card,
  recipientName,
}: {
  card: GiftCardRow;
  recipientName?: string | null;
}) {
  const summary = formatGiftCardSummary(card);
  const expiresOn = new Date(card.expires_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const greeting = recipientName?.trim()
    ? `Bonjour ${recipientName.trim()},`
    : "Bonjour,";

  const messageBlock = card.personal_message?.trim()
    ? `<p style="margin:16px 0;padding:16px;background:#fff8f0;border-radius:12px;color:#333;">
        ${card.personal_message.trim().replace(/\n/g, "<br />")}
      </p>`
    : "";

  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;color:#111;max-width:560px;line-height:1.5;">
      <p>${greeting}</p>
      <p>Vous avez reçu une carte cadeau Manufacto : <strong>${summary}</strong>.</p>
      ${messageBlock}
      <p style="margin:24px 0;">
        <span style="display:inline-block;padding:14px 20px;background:#f56800;color:#fff;font-size:22px;font-weight:700;letter-spacing:0.08em;border-radius:12px;">
          ${card.code}
        </span>
      </p>
      <p>Pour l'utiliser, connectez-vous sur le site Manufacto, choisissez votre créneau, puis sélectionnez <strong>Carte cadeau</strong> comme mode de paiement et saisissez ce code.</p>
      <p style="color:#555;">Valable jusqu'au ${expiresOn}.</p>
      <p style="margin-top:24px;color:#555;">À bientôt à l'atelier,<br />L'équipe Manufacto</p>
    </div>
  `;
}

export async function notifyGiftCardIssued(giftCardId: string) {
  const supabase = getAdminClient();
  const { data: card, error } = await supabase
    .from("gift_card")
    .select("*")
    .eq("id", giftCardId)
    .maybeSingle();

  if (error || !card) {
    console.error("Gift card not found for email:", giftCardId, error);
    return { ok: false as const, error: "Gift card not found" };
  }

  const typedCard = card as GiftCardRow;
  const summary = formatGiftCardSummary(typedCard);

  return sendEmail({
    to: typedCard.recipient_email,
    subject: `Votre carte cadeau Manufacto — ${summary}`,
    html: buildGiftCardEmailHtml({ card: typedCard }),
  });
}

export async function notifyGiftCardPurchaser(giftCardId: string) {
  const supabase = getAdminClient();
  const { data: card, error } = await supabase
    .from("gift_card")
    .select("*")
    .eq("id", giftCardId)
    .maybeSingle();

  if (error || !card) {
    return { ok: false as const, error: "Gift card not found" };
  }

  const typedCard = card as GiftCardRow;

  if (typedCard.purchaser_email === typedCard.recipient_email) {
    return { ok: true as const, error: null };
  }

  return sendEmail({
    to: typedCard.purchaser_email,
    subject: "Confirmation — votre carte cadeau Manufacto",
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;color:#111;max-width:560px;line-height:1.5;">
        <p>Bonjour,</p>
        <p>Merci pour votre achat. Nous avons envoyé la carte cadeau à <strong>${typedCard.recipient_email}</strong>.</p>
        <p>Code : <strong>${typedCard.code}</strong></p>
        <p style="color:#555;">L'équipe Manufacto</p>
      </div>
    `,
  });
}
