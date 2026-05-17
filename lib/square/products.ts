export type SquareProductKind = "subscription" | "credit_pack" | "discovery";

export type SquareProduct = {
  id: string;
  kind: SquareProductKind;
  name: string;
  description: string;
  amountCents: number;
  credits: number;
  paymentLinkUrl: string;
  catalogObjectId?: string | null;
  catalogLabel?: string | null;
};

export const DEFAULT_SQUARE_PRODUCTS = [
  {
    id: "formule-01",
    kind: "subscription",
    name: "Abonnement 01",
    description: "20 crédits / mois.",
    amountCents: 9000,
    credits: 20,
    paymentLinkUrl: "https://square.link/u/2tdwuxzj",
  },
  {
    id: "formule-02",
    kind: "subscription",
    name: "Abonnement 02",
    description: "40 crédits / mois.",
    amountCents: 17000,
    credits: 40,
    paymentLinkUrl: "https://square.link/u/gW0StYbg",
  },
  {
    id: "formule-03",
    kind: "subscription",
    name: "Abonnement 03",
    description: "60 crédits / mois.",
    amountCents: 24000,
    credits: 60,
    paymentLinkUrl: "https://square.link/u/qmFVI9nB",
  },
  {
    id: "credits-2",
    kind: "credit_pack",
    name: "Pack de crédit 01",
    description: "Pack de 2 crédits.",
    amountCents: 1500,
    credits: 2,
    paymentLinkUrl: "https://square.link/u/xIA0Pahf",
  },
  {
    id: "credits-6",
    kind: "credit_pack",
    name: "Pack de crédit 02",
    description: "Pack de 6 crédits.",
    amountCents: 3600,
    credits: 6,
    paymentLinkUrl: "https://square.link/u/hgbetnRA",
  },
  {
    id: "credits-12",
    kind: "credit_pack",
    name: "Pack de crédit 03",
    description: "Pack de 12 crédits.",
    amountCents: 6600,
    credits: 12,
    paymentLinkUrl: "https://square.link/u/uIOBYTuu",
  },
  {
    id: "credits-20",
    kind: "credit_pack",
    name: "Pack de crédit 04",
    description: "Pack de 20 crédits.",
    amountCents: 10000,
    credits: 20,
    paymentLinkUrl: "https://square.link/u/CZCMiUpo",
  },
  {
    id: "credits-60",
    kind: "credit_pack",
    name: "Pack de crédit 05",
    description: "Pack de 60 crédits.",
    amountCents: 27000,
    credits: 60,
    paymentLinkUrl: "https://square.link/u/qUHYmiNc",
  },
  {
    id: "decouverte-couture",
    kind: "discovery",
    name: "Pack découverte couture",
    description:
      "2h de couture en autonomie encadrée, si vous voulez venir une première fois pour tester et découvrir l'atelier, sans vous engager.",
    amountCents: 1500,
    credits: 2,
    paymentLinkUrl: "https://square.link/u/OPAqHpzu",
  },
  {
    id: "decouverte-menuiserie",
    kind: "discovery",
    name: "Pack découverte menuiserie",
    description:
      "2h de menuiserie en autonomie encadrée, si vous voulez venir une première fois pour tester et découvrir l'atelier, sans vous engager.",
    amountCents: 3000,
    credits: 6,
    paymentLinkUrl: "https://square.link/u/9sIC6VDe",
  },
] satisfies SquareProduct[];

/** @deprecated Use loadSquareProducts / getSquareProduct from load-products.ts */
export const squareProducts = DEFAULT_SQUARE_PRODUCTS;

export function getSquareProductFromDefaults(productId: string) {
  return DEFAULT_SQUARE_PRODUCTS.find((product) => product.id === productId) ?? null;
}

/** Production payment links only — sandbox must use the Square API instead. */
export function getSquareProductPaymentLinkUrl(product: SquareProduct) {
  if (process.env.SQUARE_ENVIRONMENT !== "production") {
    return null;
  }

  return product.paymentLinkUrl;
}

