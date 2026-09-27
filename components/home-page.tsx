import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CourseCalendarPanel } from "@/components/course-calendar-panel";
import {
  BrandLockup,
  CourseCarousel,
  GiftOfferBanner,
  ImageTile,
  InstagramStrip,
  NewsletterBanner,
  P,
  PhotoRibbon,
  PrimaryCta,
  RIBBON_LIEU,
  RIBBON_SITE,
  VisitBanner,
  WordStrip,
} from "@/components/mockups/shared";
import { scopeHref, type SiteScope } from "@/components/mockups/paths";
import { getFeaturedCoursesWithImages } from "@/lib/featured-courses";
import type { ExperimentVariant } from "@/lib/posthog/experiments";

async function HomeCourseCarousel() {
  const courses = await getFeaturedCoursesWithImages();
  return <CourseCarousel courses={courses} />;
}

function CourseCarouselFallback() {
  return (
    <div
      className="h-[320px] rounded-[19px] border border-black/10 bg-[#f2f2f2]"
      aria-hidden
    />
  );
}

function HomeHeroHeadline({ variant }: { variant: ExperimentVariant }) {
  if (variant === "test") {
    return (
      <h1 className="max-w-4xl text-[34px] font-bold leading-[1.15] tracking-[-0.02em] md:text-[48px]">
        <span className="text-[#f56800]">Faire soi-même</span>,{" "}
        <span className="text-[#4a56dd]">réparer</span>,{" "}
        <span className="text-[#d73459]">réemployer</span>,{" "}
        <span className="text-[#20b75a]">créer</span>.
      </h1>
    );
  }

  return (
    <h1 className="max-w-3xl text-[34px] font-bold leading-[1.15] tracking-[-0.02em] md:text-[48px]">
      Un atelier pour{" "}
      <span className="text-[#f56800]">faire</span>,{" "}
      <span className="text-[#4a56dd]">apprendre</span>
      {" "}ou{" "}
      <span className="text-[#d73459]">offrir</span>
    </h1>
  );
}

function PratiqueTileCopy() {
  return (
    <span className="flex flex-col items-center gap-2">
      <span className="rounded-md bg-[#f56800] px-3 py-1.5 text-sm font-bold uppercase tracking-wide md:text-base">
        Je veux faire
      </span>
      <span className="text-base font-medium">
        pratique libre, autonome ou encadrée →
      </span>
    </span>
  );
}

function HomeHeroSubtext() {
  return (
    <p className="max-w-2xl text-lg text-black/70 md:text-xl">
      Manufacto rassemble un atelier bois, un atelier couture, un atelier
      céramique et un repair café. C&apos;est un lieu ouvert à toutes et
      tous, qui donne accès à l&apos;espace, aux machines, outils et
      compétences pour faire soi-même.
    </p>
  );
}

/** Chemin + cours homepage — production (`site`) or mockup scope */
export function HomePage({
  scope = "site",
  headline = "control",
}: {
  scope?: SiteScope;
  headline?: ExperimentVariant;
} = {}) {
  const h = (path: string) => scopeHref(scope, path);

  return (
    <main>
      <header className="bg-[#fff8f0]">
        <div className="mx-auto max-w-[1274px] px-5 pb-10 pt-10 md:pb-12 md:pt-14">
          <div className="flex flex-col items-start gap-4 md:items-center md:text-center">
            <BrandLockup />
            <HomeHeroHeadline variant={headline} />
            <HomeHeroSubtext />
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3 md:gap-6">
            <Link href={h("/pratique-libre")} className="group relative block">
              <Image
                src={P.starBlue}
                alt=""
                width={120}
                height={96}
                className="absolute -left-2 -top-6 z-10 h-14 w-auto object-contain md:h-16"
                aria-hidden
              />
              <ImageTile
                src={P.pl28}
                alt="Pratique libre"
                className="h-[260px] md:h-[340px]"
                priority
              >
                <PratiqueTileCopy />
              </ImageTile>
            </Link>

            <Link href={h("/cours")} className="group relative block">
              <Image
                src={P.starOrange}
                alt=""
                width={120}
                height={100}
                className="absolute -right-1 -top-6 z-10 h-14 w-auto rotate-[18deg] object-contain md:h-16"
                aria-hidden
              />
              <ImageTile
                src={P.boisMain}
                alt="Cours ponctuels"
                className="h-[260px] md:h-[340px]"
                priority
              >
                <span className="flex flex-col items-center gap-2">
                  <span className="rounded-md bg-[#4a56dd] px-3 py-1.5 text-sm font-bold uppercase tracking-wide md:text-base">
                    Je veux apprendre
                  </span>
                  <span className="text-base font-medium">cours ponctuels →</span>
                </span>
              </ImageTile>
            </Link>

            <Link href={h("/offrir")} className="group relative block">
              <Image
                src={P.starRouge}
                alt=""
                width={120}
                height={100}
                className="absolute -right-2 -top-5 z-10 h-14 w-auto -rotate-[12deg] object-contain md:h-16"
                aria-hidden
              />
              <ImageTile
                src={P.portrait15}
                alt="Offrir Manufacto"
                className="h-[260px] md:h-[340px]"
              >
                <span className="flex flex-col items-center gap-2">
                  <span className="rounded-md bg-[#d73459] px-3 py-1.5 text-sm font-bold uppercase tracking-wide md:text-base">
                    Je veux offrir
                  </span>
                  <span className="text-base font-medium">carte cadeau →</span>
                </span>
              </ImageTile>
            </Link>
          </div>
        </div>
      </header>

      <VisitBanner reserveHref="/reserver" />

      <section className="border-y border-black/10 px-5 py-6">
        <WordStrip />
      </section>

      <section className="mx-auto max-w-[1274px] px-5 py-10">
        <PhotoRibbon images={[...RIBBON_SITE]} />
      </section>

      <section className="pb-14">
        <div className="mx-auto max-w-[1274px] px-5">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-[30px] font-semibold text-black/80">
                Nos prochains cours ponctuels
              </h2>
              <p className="mt-2 max-w-2xl text-lg text-black/65">
                Faites défiler — initiation, perfectionnement ou fabrication
                d&apos;un objet.
              </p>
            </div>
            <PrimaryCta href={h("/cours")} className="px-5 py-3 text-base">
              Voir tous les cours
            </PrimaryCta>
          </div>
          <Suspense fallback={<CourseCarouselFallback />}>
            <HomeCourseCarousel />
          </Suspense>
        </div>
      </section>

      <section id="calendrier" className="mx-auto max-w-[1274px] px-5 pb-16">
        <h2 className="mb-8 text-[30px] font-semibold text-black/80">
          Calendrier des cours
        </h2>
        <div className="mb-8 max-w-[1196px] space-y-3 text-xl leading-normal text-black/75">
          <p>Retrouvez notre proposition de cours pour ce mois-ci.</p>
          <p>
            Certains reviennent régulièrement, d&apos;autres sont plus ponctuels.
            Cliquez un jour pour le détail — durée, crédits, prix et inscription.
            Le catalogue complet est{" "}
            <Link href={h("/cours")} className="font-semibold text-[#4a56dd] underline">
              ici
            </Link>
            .
          </p>
        </div>
        <CourseCalendarPanel />
      </section>

      <section className="bg-[#fff8f0]">
        <div className="mx-auto grid max-w-[1274px] gap-8 px-5 py-14 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-[30px] font-semibold text-black/80">
              Venez en pratique libre
            </h2>
            <p className="mt-4 text-xl text-black/70">
              Menuiserie, couture ou céramique — réservez un espace de travail en
              autonomie complète ou encadrée. Créez un compte, chargez des crédits
              (valables un an), réservez vos créneaux, et c&apos;est parti.
            </p>
            <p className="mt-3 text-lg text-black/60">
              Tarifs selon la discipline&nbsp;: de 1 à 4 crédits / heure.
            </p>
            <PrimaryCta href={h("/pratique-libre")} className="mt-8">
              Découvrir la pratique libre
            </PrimaryCta>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ImageTile src={P.heroMenuiserie} alt="Menuiserie" className="h-40 md:h-48" />
            <ImageTile src={P.heroCoutureNew} alt="Couture" className="h-40 md:h-48" />
            <ImageTile src={P.heroCeramique} alt="Céramique" className="h-40 md:h-48" />
            <ImageTile src={P.heroElecNew} alt="Électronique" className="h-40 md:h-48" />
          </div>
        </div>
      </section>

      <GiftOfferBanner courseHref={h("/offrir")} />

      <NewsletterBanner />

      <section className="mx-auto max-w-[1274px] px-5 py-12">
        <PhotoRibbon images={[...RIBBON_LIEU]} />
      </section>

      <InstagramStrip />
    </main>
  );
}
