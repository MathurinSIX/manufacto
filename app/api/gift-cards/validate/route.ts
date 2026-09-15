import { NextResponse } from "next/server";

import { validateGiftCardForBooking } from "@/lib/gift-cards/redeem";
import { giftCardCreditsRemaining } from "@/lib/gift-cards/types";

type ValidateBody = {
  code?: string;
  activityId?: string;
  sessionId?: string;
  requiredCredits?: number;
  requiredAmountCents?: number;
  participantCount?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ValidateBody;
    const code = body.code?.trim() ?? "";

    if (!code) {
      return NextResponse.json({ ok: false, error: "Code requis." }, { status: 400 });
    }

    const result = await validateGiftCardForBooking(code, {
      activityId: body.activityId,
      sessionId: body.sessionId,
      requiredCredits: body.requiredCredits,
      requiredAmountCents: body.requiredAmountCents,
      participantCount: body.participantCount,
    });

    if (result.ok === false) {
      return NextResponse.json({ ok: false, error: result.error });
    }

    return NextResponse.json({
      ok: true,
      kind: result.giftCard.kind,
      creditsRemaining: giftCardCreditsRemaining(result.giftCard),
      amountCents: result.giftCard.amount_cents,
    });
  } catch (error) {
    console.error("Gift card validation error:", error);
    return NextResponse.json(
      { ok: false, error: "Impossible de vérifier le code." },
      { status: 500 },
    );
  }
}
