import { Suspense } from "react";

import {
  OffrirGiftModals,
  type OffrirCourseCategoryOption,
  type OffrirCreditPackOption,
} from "@/components/offrir-gift-modals";
import { PageHero } from "@/components/mockups/site-pages";
import { PrimaryCta } from "@/components/mockups/shared";
import { getGiftCourseCategoriesWithExamples } from "@/lib/gift-cards/upcoming-examples";
import { loadSquareProducts } from "@/lib/square/load-products";

const P = {
  tabouret12: "/assets/photos-new/site/15_Photo_en_bas_verticale_.jpg",
};

async function OffrirGiftSection() {
  const [products, courseCategories] = await Promise.all([
    loadSquareProducts(),
    getGiftCourseCategoriesWithExamples(),
  ]);

  const creditPacks: OffrirCreditPackOption[] = products
    .filter((product) => product.kind === "credit_pack" && product.catalogObjectId)
    .map((product) => ({
      id: product.id,
      name: product.name,
      credits: product.credits,
      amountCents: product.amountCents,
      description: product.description,
    }));

  const categories: OffrirCourseCategoryOption[] = courseCategories.map(
    (category) => ({
      id: category.id,
      label: category.label,
      amountCents: category.amountCents,
      credits: category.credits,
      description: category.description,
      examples: category.examples,
    }),
  );

  return (
    <OffrirGiftModals creditPacks={creditPacks} courseCategories={categories} />
  );
}

export default function OffrirPage() {
  return (
    <main>
      <PageHero
        title="Offrir Manufacto"
        lead="Carte cadeau, cours ponctuel ou pack de crédits : faites découvrir l’atelier à quelqu’un que vous aimez. Les crédits sont valables un an."
        image={P.tabouret12}
      />

      <Suspense
        fallback={
          <section className="mx-auto max-w-[1274px] px-5 py-14">
            <h2 className="text-[30px] font-semibold text-black/80">
              Deux façons d&apos;offrir
            </h2>
            <p className="mt-6 text-black/60">Chargement…</p>
          </section>
        }
      >
        <OffrirGiftSection />
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
