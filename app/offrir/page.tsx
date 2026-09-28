import { Suspense } from "react";

import { CreditOfferPicker } from "@/components/credit-offer-picker";
import { PageHero } from "@/components/mockups/site-pages";
import { PrimaryCta } from "@/components/mockups/shared";
import { loadCreditCourseExamples, loadPracticeCreditRates } from "@/lib/credit-course-examples";
import { loadSquareProducts } from "@/lib/square/load-products";
import { OFFER_HERO_PHOTO } from "@/lib/site-photo-sets";

async function OffrirCreditsSection() {
  const [products, examples, practiceRates] = await Promise.all([
    loadSquareProducts(),
    loadCreditCourseExamples(),
    loadPracticeCreditRates(),
  ]);
  const packs = products
    .filter(
      (product) =>
        product.kind === "credit_pack" &&
        product.id !== "credits-2" &&
        product.credits !== 2,
    )
    .map((product) => ({
      id: product.id,
      credits: product.credits,
      amountCents: product.amountCents,
      catalogObjectId: product.catalogObjectId,
    }))
    .sort((left, right) => left.amountCents - right.amountCents);

  return (
    <section className="mx-auto max-w-[1274px] px-5 py-8">
      <CreditOfferPicker
        packs={packs}
        examples={examples}
        practiceRates={practiceRates}
        mode="gift"
      />
    </section>
  );
}

function OffrirPageBody() {
  return (
    <main>
      <PageHero
        title="Offrez le plaisir de faire soi-même"
        lead={
          <>
            <p>
              Une carte cadeau en crédits&nbsp;: la personne choisit ensuite ses
              cours ou ses créneaux de pratique libre, selon le nombre de
              crédits offerts.
            </p>
            <p>Les crédits sont valables un an.</p>
          </>
        }
        image={OFFER_HERO_PHOTO}
      />

      <Suspense
        fallback={
          <section className="mx-auto max-w-[1274px] px-5 py-8">
            <p className="text-black/60">Chargement…</p>
          </section>
        }
      >
        <OffrirCreditsSection />
      </Suspense>

      <section className="bg-[#fff8f0]">
        <div className="mx-auto flex max-w-[1274px] flex-col gap-6 px-5 py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[28px] font-bold text-black/90">
              Besoin d&apos;aide pour choisir ?
            </h2>
            <p className="mt-2 max-w-xl text-lg text-black/70">
              Passez nous voir pendant les heures d&apos;ouverture, ou réservez
              une visite le mardi soir — on vous oriente.
            </p>
          </div>
          <PrimaryCta href="/contact">Réserver une visite</PrimaryCta>
        </div>
      </section>
    </main>
  );
}

export default function OffrirPage() {
  return <OffrirPageBody />;
}
