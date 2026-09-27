import { Suspense } from "react";
import Link from "next/link";

import {
  AtelierCreditPackGrid,
  AtelierDiscoveryPackStrip,
  AtelierSubscriptionCards,
} from "@/components/atelier-tarifs-purchases";
import { MockupAtelierPage } from "@/components/mockups/site-pages";
import type { ExperimentVariant } from "@/lib/posthog/experiments";

const RATE_GROUPS = [
  {
    title: "Menuiserie",
    color: "#f56800",
    tint: "#fff3e8",
    rows: [
      { label: "Autonomie complète", value: "2 crédits / h" },
      { label: "Autonomie encadrée", value: "3 crédits / h" },
      { label: "Accompagnement au projet", value: "4 crédits / h" },
    ],
  },
  {
    title: "Couture",
    color: "#4a56dd",
    tint: "#f0f1ff",
    rows: [
      { label: "Autonomie complète", value: "1 crédit / h" },
      { label: "Autonomie encadrée", value: "2 crédits / h" },
    ],
  },
  {
    title: "Céramique",
    color: "#d73459",
    tint: "#fff0f3",
    rows: [
      { label: "Autonomie complète", value: "2 crédits / h" },
      { label: "Autonomie encadrée", value: "3 crédits / h" },
      { label: "Cuisson (four entier)", value: "60 €" },
    ],
  },
  {
    title: "Cours",
    color: "#c9a227",
    tint: "#fff8e6",
    rows: [
      { label: "Catégorie 01", value: "50 € / 10 crédits" },
      { label: "Catégorie 02", value: "72 € / 15 crédits" },
      { label: "Catégorie 03", value: "100 € / 20 crédits" },
    ],
  },
] as const;

/** Today's retours atelier (test variant). */
export function AtelierPageTest({
  heroLead = "test",
  tarifsVariant = "control",
}: {
  heroLead?: ExperimentVariant;
  /** control = cream layout without checkout. test = same layout with Acheter and Souscrire. */
  tarifsVariant?: ExperimentVariant;
} = {}) {
  const showCheckout = tarifsVariant === "test";

  return (
    <>
      <MockupAtelierPage scope="site" heroLead={heroLead} />
      <section
        id="tarifs"
        className="scroll-mt-28 border-t border-black/10 bg-[#fff8f0]"
      >
        <div className="mx-auto max-w-[1274px] px-5 py-14 md:py-16">
          <div className="rounded-[28px] bg-white px-5 py-8 shadow-sm ring-1 ring-black/5 md:px-10 md:py-12">
            <AtelierTarifsBody showCheckout={showCheckout} />
          </div>
        </div>
      </section>
    </>
  );
}

function AtelierTarifsBody({ showCheckout }: { showCheckout: boolean }) {
  const panelClass = "mt-8 rounded-[20px] bg-[#fff8f0] p-5 md:p-7";

  return (
    <>
      <h2 className="max-w-3xl text-[30px] font-bold leading-tight text-black md:text-[34px]">
        Manufacto fonctionne avec un système de crédit.
      </h2>
      <div className="mt-4 max-w-3xl space-y-3 text-base leading-normal text-black/70">
        <p>
          Il y a deux façons d&apos;accéder à l&apos;atelier : en réservant un
          cours, ou en achetant des crédits, qui vous permettront l&apos;accès
          en pratique libre.
        </p>
        <p>
          Pour la pratique libre : une fois les crédits chargés sur votre
          espace, vous pouvez réserver un poste de travail en menuiserie, en
          couture et en céramique, pour la durée de votre choix (à partir de
          1h), directement depuis votre compte.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {RATE_GROUPS.map((group) => (
          <div
            key={group.title}
            className="rounded-[16px] border border-black/5 px-4 py-4"
            style={{ backgroundColor: group.tint }}
          >
            <h3
              className="text-xs font-bold uppercase tracking-[0.12em]"
              style={{ color: group.color }}
            >
              {group.title}
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-black/75">
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

      <div className={panelClass}>
        <h3 className="text-[24px] font-semibold leading-tight text-black/85 md:text-[28px]">
          Acheter des crédits
        </h3>
        <p className="mt-2 text-base leading-normal text-black/65">
          Rechargez votre compte pour réserver vos prochains créneaux
        </p>
        <p className="mb-3 mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-[#f56800]">
          Packs de crédits
        </p>
        <Suspense
          fallback={
            <div className="grid min-h-[155px] animate-pulse grid-cols-2 gap-3 rounded-[14px] bg-[#fff8f0] md:grid-cols-3 lg:grid-cols-5" />
          }
        >
          <AtelierCreditPackGrid
            purchasableOnly
            showPurchaseButton={showCheckout}
          />
        </Suspense>
        <p className="mt-5 text-sm leading-normal text-black/60">
          Les crédits sont valables un an à partir de leur date d&apos;achat.
          Ils s&apos;ajoutent au solde déjà disponible sur votre compte.
        </p>
      </div>

      <div className="mt-4 rounded-[20px] bg-[#fff8f0] p-5 md:p-7">
        <h3 className="text-[24px] font-semibold leading-tight text-black/85 md:text-[28px]">
          Mon abonnement
        </h3>
        <p className="mt-2 text-base leading-normal text-black/65">
          Les abonnements vous permettent d&apos;avoir un volume de crédit
          mensuel à utiliser à l&apos;atelier, à tarif préférentiel.
        </p>
        <div className="mt-6">
          <Suspense
            fallback={
              <div className="grid gap-3 md:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="min-h-[220px] animate-pulse rounded-[14px] bg-[#fff8f0]"
                  />
                ))}
              </div>
            }
          >
            <AtelierSubscriptionCards showCheckout={showCheckout} />
          </Suspense>
        </div>
        <p className="mt-5 text-sm leading-normal text-black/60">
          Les abonnements ont une durée d&apos;engagement de 3 mois, puis
          peuvent être résiliés chaque mois. Les crédits non utilisés dans le
          mois restent disponibles et se cumulent. Vous devez dans tous les
          cas réserver vos créneaux avant de venir à l&apos;atelier. Après
          résiliation, vous disposez de 3 mois pour utiliser votre solde de
          crédits.
        </p>
      </div>

      <p
        className="mt-6 max-w-4xl rounded-[16px] bg-[#fff8f0] px-5 py-4 text-sm leading-normal text-black/65"
      >
        15% de réduction sur tous nos tarifs pour les personnes étudiantes, au
        chômage, bénéficiaires du RSA. Si vous ne rentrez dans aucune de ces
        cases mais que nos tarifs sont un frein à votre venue, venez nous
        rencontrer et discutons-en.
        <span className="mt-2 block">
          Réductions appliquées uniquement pour les paiements sur place.
        </span>
      </p>

      <div className="mt-6">
        <Suspense
          fallback={
            <div className="min-h-[160px] animate-pulse rounded-[19px] bg-white" />
          }
        >
          <AtelierDiscoveryPackStrip />
        </Suspense>
      </div>

      <div
        className="mt-6 flex flex-col gap-4 rounded-[20px] bg-[#fff3e8] px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-lg font-bold text-black/85">
            Envie d&apos;offrir du temps à l&apos;atelier&nbsp;?
          </p>
          <p className="mt-1 text-sm text-black/60">
            Un cours, une initiation, ou juste un accès pour pratiquer
            librement&nbsp;?
          </p>
        </div>
        <Link
          href="/offrir"
          className="inline-flex shrink-0 items-center justify-center rounded-[12px] bg-[#f56800] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#d95700]"
        >
          Découvrez nos cartes cadeaux&nbsp;!
        </Link>
      </div>
    </>
  );
}
