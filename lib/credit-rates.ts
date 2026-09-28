export type CreditTier = {
  id: string;
  credits: number;
  amountCents: number;
};

export type CreditQuote = {
  credits: number;
  /** Cents paid per credit at the rate applied. */
  rateCents: number;
  /** Pack whose rate is used. */
  tierId: string;
  exactPack: boolean;
  /** Lowest price that still buys this number of credits. */
  amountCents: number;
};

const MAX_CUSTOM_CENTS = 200_000;

export function creditRateCents(amountCents: number, credits: number) {
  if (credits <= 0 || amountCents <= 0) return Number.POSITIVE_INFINITY;
  return amountCents / credits;
}

/** Lowest euros-per-credit among packs the amount is large enough to reach. */
export function quoteCustomCredits(
  amountCents: number,
  tiers: CreditTier[],
): CreditQuote | null {
  if (!Number.isInteger(amountCents) || amountCents <= 0 || amountCents > MAX_CUSTOM_CENTS) {
    return null;
  }

  const valid = tiers.filter(
    (tier) =>
      tier.credits > 0 &&
      tier.credits !== 2 &&
      tier.amountCents > 0 &&
      tier.id !== "credits-2",
  );
  if (valid.length === 0) return null;

  const minimum = Math.min(...valid.map((tier) => tier.amountCents));
  if (amountCents < minimum) return null;

  const exact = valid
    .filter((tier) => tier.amountCents === amountCents)
    .sort((left, right) => right.credits - left.credits)[0];
  if (exact) {
    return {
      credits: exact.credits,
      rateCents: creditRateCents(exact.amountCents, exact.credits),
      tierId: exact.id,
      exactPack: true,
      amountCents: exact.amountCents,
    };
  }

  const unlocked = valid.filter((tier) => tier.amountCents <= amountCents);
  unlocked.sort((left, right) => {
    const rateDiff =
      creditRateCents(left.amountCents, left.credits) -
      creditRateCents(right.amountCents, right.credits);
    if (rateDiff !== 0) return rateDiff;
    return right.credits - left.credits;
  });
  const best = unlocked[0];
  if (!best) return null;

  const rateCents = creditRateCents(best.amountCents, best.credits);
  let credits = Math.floor(amountCents / rateCents + 1e-9);
  if (credits < 1) return null;

  let priceCents = Math.round(credits * rateCents);
  while (credits > 1 && priceCents > amountCents) {
    credits -= 1;
    priceCents = Math.round(credits * rateCents);
  }
  if (priceCents > amountCents) return null;

  const sameCreditPack = valid
    .filter((tier) => tier.credits === credits)
    .sort((left, right) => left.amountCents - right.amountCents)[0];
  if (sameCreditPack && sameCreditPack.amountCents <= priceCents) {
    return {
      credits,
      rateCents: creditRateCents(sameCreditPack.amountCents, sameCreditPack.credits),
      tierId: sameCreditPack.id,
      exactPack: true,
      amountCents: sameCreditPack.amountCents,
    };
  }

  return {
    credits,
    rateCents,
    tierId: best.id,
    exactPack: false,
    amountCents: priceCents,
  };
}

export function formatCreditRate(amountCents: number, credits: number) {
  const euros = amountCents / 100 / credits;
  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(euros);
  return `${formatted} / crédit`;
}

export function minimumCustomAmountCents(tiers: CreditTier[]) {
  const amounts = tiers
    .filter((tier) => tier.credits > 0 && tier.credits !== 2 && tier.amountCents > 0)
    .map((tier) => tier.amountCents);
  return amounts.length ? Math.min(...amounts) : 0;
}
