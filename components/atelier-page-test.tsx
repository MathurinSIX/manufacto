import Link from "next/link";

import { MockupAtelierPage } from "@/components/mockups/site-pages";
import type { ExperimentVariant } from "@/lib/posthog/experiments";

const RATE_GROUPS = [
  {
    title: "Menuiserie",
    color: "#f56800",
    rows: [
      { label: "Autonomie complète", value: "2 crédits / h" },
      { label: "Autonomie encadrée", value: "3 crédits / h" },
      { label: "Accompagnement au projet", value: "4 crédits / h" },
    ],
  },
  {
    title: "Couture",
    color: "#4a56dd",
    rows: [
      { label: "Autonomie complète", value: "1 crédit / h" },
      { label: "Autonomie encadrée", value: "2 crédits / h" },
    ],
  },
  {
    title: "Céramique",
    color: "#d73459",
    rows: [
      { label: "Autonomie complète", value: "2 crédits / h" },
      { label: "Autonomie encadrée", value: "3 crédits / h" },
      { label: "Cuisson (four entier)", value: "60 €" },
    ],
  },
  {
    title: "Cours",
    color: "#c9a227",
    rows: [
      { label: "Catégorie 01", value: "50 € / 10 crédits" },
      { label: "Catégorie 02", value: "72 € / 15 crédits" },
      { label: "Catégorie 03", value: "100 € / 20 crédits" },
    ],
  },
] as const;

const SUBSCRIPTIONS = [
  { label: "Abonnement 01", price: "90 €", credits: "20 crédits / mois" },
  { label: "Abonnement 02", price: "170 €", credits: "40 crédits / mois" },
  { label: "Abonnement 03", price: "240 €", credits: "60 crédits / mois" },
] as const;

const DISCOVERY = [
  { label: "Couture", price: "15 €", detail: "2h autonomie encadrée" },
  {
    label: "Menuiserie / céramique",
    price: "30 €",
    detail: "2h autonomie encadrée",
  },
] as const;

/** Today's retours atelier (test variant). */
export function AtelierPageTest({
  heroLead = "test",
}: {
  heroLead?: ExperimentVariant;
} = {}) {
  return (
    <>
      <MockupAtelierPage scope="site" heroLead={heroLead} />
      <section
        id="tarifs"
        className="scroll-mt-28 border-t border-black/10 bg-white"
      >
        <div className="mx-auto max-w-[1274px] px-5 py-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div>
              <h2 className="text-[30px] font-semibold text-black/80 md:text-[34px]">
                Tarifs
              </h2>
              <p className="mt-4 max-w-xl text-lg leading-normal text-black/65">
                Système de crédits (valables un an). Achats et recharges dans{" "}
                <Link
                  href="/account?tab=credits"
                  className="font-semibold text-[#4a56dd] underline"
                >
                  mon compte
                </Link>
                .
              </p>
            </div>
            <p className="text-base leading-normal text-black/60 sm:max-w-xs sm:text-right">
              <strong>15&nbsp;%</strong> étudiants / chômage / RSA — uniquement
              sur place.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {RATE_GROUPS.map((group) => (
              <div
                key={group.title}
                className="rounded-[14px] border border-black/8 bg-[#fff8f0]/70 px-4 py-3"
              >
                <h3
                  className="border-b border-black/10 pb-1.5 text-sm font-bold uppercase tracking-wide"
                  style={{ color: group.color }}
                >
                  {group.title}
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm text-black/75">
                  {group.rows.map((row) => (
                    <li
                      key={row.label}
                      className="flex items-baseline justify-between gap-3"
                    >
                      <span className="min-w-0 leading-snug">{row.label}</span>
                      <span className="shrink-0 font-semibold tabular-nums text-black/85">
                        {row.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#f56800]">
              Packs de crédits
            </h3>
            <p className="mt-1 text-sm text-black/55">
              Valables un an, cumulables avec le solde restant — à acheter depuis{" "}
              <Link
                href="/account?tab=credits"
                className="font-semibold text-[#4a56dd] underline"
              >
                mon compte
              </Link>
              .
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { price: "8 €", credits: "1 crédit" },
                { price: "36 €", credits: "6 crédits" },
                { price: "50 €", credits: "10 crédits" },
                { price: "66 €", credits: "12 crédits" },
                { price: "72 €", credits: "15 crédits" },
                { price: "100 €", credits: "20 crédits" },
              ].map((pack) => (
                <div
                  key={pack.credits}
                  className="rounded-[14px] border border-[#f56800]/40 bg-[#fff8f0] px-3 py-4 text-center"
                >
                  <p className="text-2xl font-semibold tabular-nums text-black/90">
                    {pack.price}
                  </p>
                  <p className="mt-1 text-sm text-black/65">{pack.credits}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[14px] border border-black/8 px-4 py-3">
              <h3 className="text-sm font-bold text-[#f56800]">Pack découverte</h3>
              <p className="mt-0.5 text-xs text-black/50">
                Première venue — un achat par personne
              </p>
              <ul className="mt-2 space-y-1 text-sm text-black/75">
                {DISCOVERY.map((pack) => (
                  <li
                    key={pack.label}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <span>
                      {pack.label}
                      <span className="text-black/50"> — {pack.detail}</span>
                    </span>
                    <span className="font-semibold tabular-nums">{pack.price}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[14px] border border-black/8 px-4 py-3">
              <h3 className="text-sm font-bold text-[#f56800]">Abonnements</h3>
              <p className="mt-0.5 text-xs text-black/50">
                Engagement 3 mois, puis résiliation mensuelle
              </p>
              <ul className="mt-2 space-y-1 text-sm text-black/75">
                {SUBSCRIPTIONS.map((plan) => (
                  <li
                    key={plan.label}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <span>
                      {plan.label}
                      <span className="text-black/50"> — {plan.credits}</span>
                    </span>
                    <span className="font-semibold tabular-nums">{plan.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
