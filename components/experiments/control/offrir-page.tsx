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
    .filter(
      (product) =>
        product.kind === "credit_pack" &&
        product.id !== "credits-2" &&
        product.credits !== 2,
    )
    .map((product) => ({
      id: product.id,
      name: product.name,
      credits: product.credits,
      amountCents: product.amountCents,
      description: product.description,
    }));

  const ensureGiftPack = (id: string, credits: number, amountCents: number) => {
    if (creditPacks.some((pack) => pack.id === id || pack.credits === credits)) {
      return;
    }
    creditPacks.push({
      id,
      name: `${credits} crédits`,
      credits,
      amountCents,
      description: `Pack de ${credits} crédits.`,
    });
  };
  ensureGiftPack("credits-10", 10, 5000);
  ensureGiftPack("credits-15", 15, 7200);
  creditPacks.sort((a, b) => a.amountCents - b.amountCents);

  const categories: OffrirCourseCategoryOption[] = courseCategories.map(
    (category) => ({
      id: category.id,
      label: category.label,
      amountCents: category.amountCents,
      credits: category.credits,
      description: category.description,
      examples: category.examples,
      hideCreditEquivalence: true,
    }),
  );

  return (
    <OffrirGiftModals
      creditPacks={creditPacks}
      courseCategories={categories}
      showCustomAmount
      creditsIntro="Pour la pratique libre : choisissez un nombre de crédits. La personne à qui vous les offrez pourra ensuite réserver ses créneaux de pratique directement depuis son espace en ligne. Tarifs dégressifs, crédits valables un an."
    />
  );
}

export default function OffrirPageControl() {
  return (
    <main>
      <PageHero
        title="Offrez le plaisir de faire soi-même"
        lead={
          <>
            <p>
              Carte cadeau, cours ponctuel ou pack de crédits&nbsp;: Manufacto est
              le cadeau parfait pour toutes celles et ceux qui aiment faire
              eux-même, veulent découvrir de nouveaux univers créatifs, se
              perfectionner, ou avoir accès à un atelier de création selon leurs
              envies et leurs besoins, “à la carte”.
            </p>
            <p>Les crédits sont valables un an.</p>
          </>
        }
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
