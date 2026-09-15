import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { MockupPointsCalendar } from "@/components/mockups/mockup-points-calendar";
import {
  BrandLockup,
  CourseCarousel,
  FEATURED_COURSES,
  GiftOfferBanner,
  ImageTile,
  InstagramStrip,
  P,
  PhotoRibbon,
  PrimaryCta,
  RIBBON_LIEU,
  SecondaryCta,
  VisitBanner,
  WordStrip,
} from "@/components/mockups/shared";
import { mockupHref } from "@/components/mockups/paths";

const h = (path: string) => mockupHref("sessions", path);

export default function MockupSessionsHomePage() {
  return (
    <main>
      <header className="relative overflow-hidden bg-[#fff8f0]">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 md:block">
          <Image
            src={P.bois14}
            alt="Travail du bois en cours"
            fill
            className="object-cover"
            sizes="50vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#fff8f0] via-[#fff8f0]/55 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-[1274px] px-5 pb-12 pt-10 md:pb-16 md:pt-14">
          <BrandLockup />
          <h1 className="mt-6 max-w-xl text-[34px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[48px]">
            Nos prochains cours ponctuels
          </h1>
          <p className="mt-4 max-w-md text-lg text-black/70 md:text-xl">
            Initiation, perfectionnement ou fabrication d&apos;un objet :
            inscrivez-vous à une session, ou venez en pratique libre.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <PrimaryCta href={h("/cours")}>Voir tous les cours</PrimaryCta>
            <SecondaryCta href={h("/pratique-libre")}>Pratique libre</SecondaryCta>
            <SecondaryCta href={h("/offrir")}>Offrir une carte cadeau</SecondaryCta>
          </div>

          <div className="mt-8 md:hidden">
            <ImageTile src={P.bois14} alt="Travail du bois en cours" className="h-56" priority />
          </div>

          <div className="mt-10">
            <WordStrip />
          </div>
        </div>
      </header>

      <VisitBanner reserveHref={h("/contact")} />

      <section className="mx-auto max-w-[1274px] px-5 py-12">
        <PhotoRibbon images={[...RIBBON_LIEU]} />
      </section>

      <section className="pb-14">
        <div className="mx-auto max-w-[1274px] px-5">
          <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-[30px] font-semibold text-black/80">
                À la une ce mois-ci
              </h2>
              <p className="mt-2 text-lg text-black/65">
                Faites défiler — dates et inscriptions sur la page cours.
              </p>
            </div>
            <Link
              href={h("/cours")}
              className="font-semibold text-[#4a56dd] underline underline-offset-2"
            >
              catalogue complet
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-[1274px] px-5">
          <CourseCarousel courses={FEATURED_COURSES} />
        </div>
      </section>

      <section id="calendrier" className="mx-auto max-w-[1274px] px-5 pb-16">
        <h2 className="mb-8 text-[30px] font-semibold leading-tight text-black/80">
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
              Accès à l&apos;atelier et aux machines pour vos projets. Créez un
              compte, chargez des crédits, puis réservez vos créneaux en ligne.
            </p>
            <PrimaryCta href={h("/pratique-libre")} className="mt-8">
              Découvrir la pratique libre
            </PrimaryCta>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ImageTile src={P.pl22} alt="Établi en pratique libre" className="h-40 md:h-52" />
            <ImageTile src={P.pl29} alt="Projet en cours" className="h-40 md:h-52" />
            <ImageTile src={P.pl33} alt="Espace menuiserie" className="col-span-2 h-40 md:h-48" />
          </div>
        </div>
      </section>

      <GiftOfferBanner courseHref={h("/offrir")} />

      <section className="mx-auto max-w-[1071px] px-5 py-16 text-center">
        <h2 className="mb-5 text-[30px] font-semibold text-[#4a56dd]">
          Pourquoi Manufacto ?
        </h2>
        <p className="text-xl leading-normal text-black/75">
          Parce que nous sommes nombreux·ses à aimer fabriquer, réparer et créer —
          et qu&apos;en ville, avoir l&apos;espace, les outils et un coup de main
          n&apos;a rien d&apos;évident.
        </p>
        <p className="mt-5 text-xl leading-normal text-black/75">
          Manufacto mutualise un atelier et des outils de qualité pour le plus
          grand nombre : cours ponctuels pour apprendre, et pratique libre pour
          vos projets.
        </p>
      </section>

      <InstagramStrip />
    </main>
  );
}
