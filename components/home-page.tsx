import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { MockupPointsCalendar } from "@/components/mockups/mockup-points-calendar";
import {
  BrandLockup,
  CourseCarousel,
  GiftOfferBanner,
  ImageTile,
  InstagramStrip,
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

/** Chemin + cours homepage — production (`site`) or mockup scope */
export function HomePage({ scope = "site" }: { scope?: SiteScope } = {}) {
  const h = (path: string) => scopeHref(scope, path);

  return (
    <main>
      <header className="bg-[#fff8f0]">
        <div className="mx-auto max-w-[1274px] px-5 pb-10 pt-10 md:pb-12 md:pt-14">
          <div className="flex flex-col items-start gap-4 md:items-center md:text-center">
            <BrandLockup />
            <h1 className="max-w-3xl text-[34px] font-bold leading-[1.15] tracking-[-0.02em] md:text-[48px]">
              Un atelier pour{" "}
              <span className="text-[#f56800]">faire</span>,{" "}
              <span className="text-[#4a56dd]">apprendre</span>
              {" "}ou{" "}
              <span className="text-[#d73459]">offrir</span>
            </h1>
            <p className="max-w-xl text-lg text-black/70 md:text-xl">
              Menuiserie, couture, céramique, électronique — l&apos;espace, les
              machines et un coup de main, à Marseille.
            </p>
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
                <span className="flex flex-col items-center gap-2">
                  <span className="rounded-md bg-[#f56800] px-3 py-1.5 text-sm font-bold uppercase tracking-wide md:text-base">
                    Je veux pratiquer
                  </span>
                  <span className="text-base font-medium">pratique libre →</span>
                </span>
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
            Cliquez une discipline pour filtrer, un jour pour le détail — durée,
            crédits, prix et inscription. Le catalogue complet est{" "}
            <Link href={h("/cours")} className="font-semibold text-[#4a56dd] underline">
              ici
            </Link>
            .
          </p>
        </div>
        <Suspense
          fallback={
            <div
              className="min-h-[380px] rounded-[19px] border border-black/10 bg-[#f2f2f2] md:min-h-[520px]"
              aria-hidden
            />
          }
        >
          <div className="rounded-[19px] border border-black/10 bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-8">
            <MockupPointsCalendar />
          </div>
        </Suspense>
      </section>

      <section className="bg-[#fff8f0]">
        <div className="mx-auto grid max-w-[1274px] gap-8 px-5 py-14 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-[30px] font-semibold text-black/80">
              Ou venez en pratique libre
            </h2>
            <p className="mt-4 text-xl text-black/70">
              Menuiserie, couture ou céramique — en autonomie ou encadré·e.
              Créez un compte, chargez des crédits (valables un an), passez
              une visite, puis réservez vos créneaux.
            </p>
            <p className="mt-3 text-lg text-black/60">
              Tarifs selon la discipline : de 1 à 4 crédits / heure. Le détail
              des offres est sur la page pratique libre.
            </p>
            <PrimaryCta href={h("/pratique-libre")} className="mt-8">
              Découvrir la pratique libre
            </PrimaryCta>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ImageTile src={P.pl22} alt="Établi en pratique libre" className="h-40 md:h-52" />
            <ImageTile src={P.portrait13} alt="Travail en atelier" className="h-40 md:h-52" />
            <ImageTile src={P.pl33} alt="Espace atelier" className="col-span-2 h-40 md:h-48" />
          </div>
        </div>
      </section>

      <GiftOfferBanner courseHref={h("/offrir")} />

      <section className="border-t border-black/10">
        <div className="mx-auto flex max-w-[1274px] flex-col items-start justify-between gap-3 px-5 py-7 sm:flex-row sm:items-center">
          <p className="text-sm text-black/50">
            Une fois par mois — les nouvelles de l&apos;atelier, sans spam.
          </p>
          <Link
            href="/newsletter"
            className="text-sm font-semibold text-[#4a56dd] underline underline-offset-2 hover:text-[#3540bf]"
          >
            S&apos;inscrire à la newsletter
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1274px] px-5 py-12">
        <PhotoRibbon images={[...RIBBON_LIEU]} />
      </section>

      <InstagramStrip />
    </main>
  );
}
