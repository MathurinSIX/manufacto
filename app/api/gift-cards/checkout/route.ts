import { NextResponse } from "next/server";

import { generateGiftCardCode } from "@/lib/gift-cards/code";
import { getGiftCourseCategory } from "@/lib/gift-cards/course-categories";
import { giftCardExpiresAt } from "@/lib/gift-cards/fulfill";
import { getSquareProduct } from "@/lib/square/load-products";
import {
  clampCreditUnitQuantity,
  isUnitCreditPack,
  type SquareProductKind,
} from "@/lib/square/products";
import {
  createSquareAdHocPaymentLink,
  createSquareCatalogPaymentLink,
  getAdminClient,
  getSiteUrl,
} from "@/lib/square/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type GiftCheckoutBody = {
  kind?: "credits" | "course" | "credits_custom";
  productId?: string;
  quantity?: number;
  /** Custom gift credits: amount in euros, multiples of 5, min 100. 1 credit = 5€. */
  customAmountEuros?: number;
  /** Course gift tier: cat-01 | cat-02 | cat-03 */
  courseCategoryId?: string;
  purchaserEmail?: string;
  recipientEmail?: string;
  personalMessage?: string;
};

function normalizeEmail(value: string | undefined): string | null {
  const normalized = value?.trim().toLowerCase() ?? "";
  return EMAIL_RE.test(normalized) ? normalized : null;
}

function isGiftableProductKind(kind: SquareProductKind) {
  return kind === "credit_pack";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GiftCheckoutBody;
    const kind = body.kind ?? "credits";
    const purchaserEmail = normalizeEmail(body.purchaserEmail);
    const recipientEmail = normalizeEmail(body.recipientEmail) ?? purchaserEmail;

    if (!purchaserEmail) {
      return NextResponse.json(
        { error: "Indiquez une adresse e-mail valide." },
        { status: 400 },
      );
    }

    if (!recipientEmail) {
      return NextResponse.json(
        { error: "Indiquez l'e-mail du destinataire." },
        { status: 400 },
      );
    }

    const siteUrl = getSiteUrl(request);
    const redirectPath = "/offrir/merci";
    const adminClient = getAdminClient();

    if (kind === "credits_custom") {
      const euros = Number(body.customAmountEuros);
      if (!Number.isFinite(euros) || euros < 100 || euros % 5 !== 0) {
        return NextResponse.json(
          {
            error:
              "Choisissez un montant libre d'au moins 100€, par pallier de 5€.",
          },
          { status: 400 },
        );
      }

      const totalCredits = Math.round(euros / 5);
      const totalAmountCents = Math.round(euros * 100);
      const code = generateGiftCardCode();
      const expiresAt = giftCardExpiresAt();

      const paymentLink = await createSquareAdHocPaymentLink({
        name: `Carte cadeau crédits — ${totalCredits} crédits`,
        amountCents: totalAmountCents,
        buyer: { userEmail: purchaserEmail },
        siteUrl,
        redirectPath,
        paymentNote: `Manufacto carte cadeau crédits custom (${code})`,
      });

      const { error: insertError } = await adminClient.from("gift_card").insert({
        code,
        kind: "credits",
        credits: totalCredits,
        initial_credits: totalCredits,
        amount_cents: totalAmountCents,
        product_id: "credits-custom",
        purchaser_email: purchaserEmail,
        recipient_email: recipientEmail,
        personal_message: body.personalMessage?.trim() || null,
        status: "pending",
        square_order_id: paymentLink.orderId,
        square_payment_link_id: paymentLink.paymentLinkId,
        idempotency_key: paymentLink.idempotencyKey,
        expires_at: expiresAt,
      });

      if (insertError) {
        console.error("Error creating pending custom gift card:", insertError);
        return NextResponse.json(
          { error: "Impossible de préparer le paiement." },
          { status: 500 },
        );
      }

      return NextResponse.json({ url: paymentLink.paymentLinkUrl });
    }

    if (kind === "credits") {
      const productId = body.productId?.trim() ?? "";

      if (!productId) {
        return NextResponse.json({ error: "Produit introuvable." }, { status: 400 });
      }

      const product = await getSquareProduct(productId);

      if (!product || !isGiftableProductKind(product.kind)) {
        return NextResponse.json(
          { error: "Ce produit ne peut pas être offert en carte cadeau." },
          { status: 400 },
        );
      }

      if (product.credits === 2 || product.id === "credits-2") {
        return NextResponse.json(
          { error: "Ce pack n'est plus proposé en carte cadeau." },
          { status: 400 },
        );
      }

      const quantity = isUnitCreditPack(product)
        ? clampCreditUnitQuantity(body.quantity ?? 1)
        : 1;
      const totalCredits = product.credits * quantity;
      const totalAmountCents = product.amountCents * quantity;
      const code = generateGiftCardCode();
      const expiresAt = giftCardExpiresAt();

      const paymentLink = product.catalogObjectId
        ? await createSquareCatalogPaymentLink({
            catalogObjectId: product.catalogObjectId,
            buyer: { userEmail: purchaserEmail },
            siteUrl,
            redirectPath,
            quantity,
            paymentNote: `Manufacto carte cadeau ${product.id} (${code})`,
          })
        : await createSquareAdHocPaymentLink({
            name: `Carte cadeau crédits — ${totalCredits} crédits`,
            amountCents: totalAmountCents,
            buyer: { userEmail: purchaserEmail },
            siteUrl,
            redirectPath,
            paymentNote: `Manufacto carte cadeau ${product.id} (${code})`,
          });

      const { error: insertError } = await adminClient.from("gift_card").insert({
        code,
        kind: "credits",
        credits: totalCredits,
        initial_credits: totalCredits,
        amount_cents: totalAmountCents,
        product_id: product.id,
        purchaser_email: purchaserEmail,
        recipient_email: recipientEmail,
        personal_message: body.personalMessage?.trim() || null,
        status: "pending",
        square_order_id: paymentLink.orderId,
        square_payment_link_id: paymentLink.paymentLinkId,
        idempotency_key: paymentLink.idempotencyKey,
        expires_at: expiresAt,
      });

      if (insertError) {
        console.error("Error creating pending gift card:", insertError);
        return NextResponse.json(
          { error: "Impossible de préparer le paiement." },
          { status: 500 },
        );
      }

      return NextResponse.json({ url: paymentLink.paymentLinkUrl });
    }

    const category = getGiftCourseCategory(body.courseCategoryId?.trim() ?? "");

    if (!category) {
      return NextResponse.json(
        { error: "Choisissez une catégorie de cours." },
        { status: 400 },
      );
    }

    const code = generateGiftCardCode();
    const expiresAt = giftCardExpiresAt();
    const productId = `gift-course-${category.id}`;

    const paymentLink = await createSquareAdHocPaymentLink({
      name: `Carte cadeau cours — ${category.label}`,
      amountCents: category.amountCents,
      buyer: { userEmail: purchaserEmail },
      siteUrl,
      redirectPath,
      paymentNote: `Manufacto carte cadeau cours ${category.id} (${code})`,
    });

    const { error: insertError } = await adminClient.from("gift_card").insert({
      code,
      kind: "course",
      credits: null,
      initial_credits: null,
      amount_cents: category.amountCents,
      product_id: productId,
      activity_id: null,
      session_id: null,
      purchaser_email: purchaserEmail,
      recipient_email: recipientEmail,
      personal_message: body.personalMessage?.trim() || null,
      status: "pending",
      square_order_id: paymentLink.orderId,
      square_payment_link_id: paymentLink.paymentLinkId,
      idempotency_key: paymentLink.idempotencyKey,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error("Error creating pending course gift card:", insertError);
      return NextResponse.json(
        { error: "Impossible de préparer le paiement." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: paymentLink.paymentLinkUrl });
  } catch (error) {
    console.error("Gift card checkout error:", error);
    return NextResponse.json(
      { error: "Impossible de démarrer le paiement." },
      { status: 500 },
    );
  }
}
