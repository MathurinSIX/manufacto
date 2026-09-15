import Image from "next/image";
import Link from "next/link";
import {
  BrandLockup,
  GiftOfferBanner,
  ImageTile,
  InstagramStrip,
  P,
  PhotoMosaic,
  PhotoRibbon,
  PrimaryCta,
  RIBBON_LIEU,
  SecondaryCta,
  WordStrip,
} from "@/components/mockups/shared";
import { mockupHref } from "@/components/mockups/paths";

const h = (path: string) => mockupHref("visite", path);

export default function MockupVisiteHomePage() {
  return (
    <main>
      <header className="relative min-h-[78vh] overflow-hidden bg-[#2d2d2d] text-white">
        <Image
          src={P.atelierPeople}
          alt="L'atelier Manufacto"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />

        <div className="relative mx-auto flex min-h-[78vh] max-w-[1274px] flex-col justify-end px-5 pb-12 pt-16 md:pb-16 md:pt-20">
          <BrandLockup />
          <h1 className="mt-6 max-w-2xl text-[36px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[52px]">
            Venez découvrir l&apos;atelier
          </h1>
          <p className="mt-4 max-w-lg text-lg text-white/90 md:text-xl">
            Tous les mardis de 18h30 à 19h, on vous présente le lieu et son
            fonctionnement. C&apos;est gratuit, sur inscription.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <PrimaryCta href={h("/contact")}>Réserver une visite</PrimaryCta>
            <SecondaryCta href={h("/cours")} className="border-white text-white hover:bg-white/15">
              Voir les cours
            </SecondaryCta>
            <Link
              href={h("/offrir")}
              className="text-base font-semibold text-white underline underline-offset-4 hover:text-[#f6c51d]"
            >
              Offrir une carte cadeau →
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-black/10 bg-[#fff8f0] px-5 py-6">
        <WordStrip />
      </section>

      <section className="mx-auto max-w-[1274px] px-5 py-12 md:py-16">
        <PhotoRibbon images={[...RIBBON_LIEU]} />
      </section>

      <section className="mx-auto max-w-[1274px] px-5 pb-16">
        <h2 className="mb-3 text-center text-[30px] font-semibold text-black/80">
          Un lieu pour faire et apprendre
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-lg text-black/70 md:text-xl">
          Accès à l&apos;espace, aux machines, aux outils et aux compétences pour
          fabriquer, réparer ou créer — au gré de vos envies.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              src: P.pratiqueLibre,
              title: "Pratique libre",
              blurb:
                "Venez travailler sur vos projets en autonomie ou encadré·e, selon votre niveau.",
              href: h("/pratique-libre"),
            },
            {
              src: P.cours,
              title: "Cours ponctuels",
              blurb:
                "Apprenez à utiliser une machine, fabriquer un objet, ou vous perfectionner.",
              href: h("/cours"),
            },
            {
              src: P.pl26,
              title: "L'atelier",
              blurb:
                "Menuiserie, couture, céramique et électronique au cœur de Marseille.",
              href: h("/atelier"),
            },
          ].map((item) => (
            <Link key={item.title} href={item.href} className="group block">
              <ImageTile src={item.src} alt={item.title} className="h-64 md:h-72" />
              <h3 className="mt-4 text-2xl font-semibold group-hover:text-[#4a56dd]">
                {item.title}
              </h3>
              <p className="mt-1 text-lg text-black/65">{item.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <GiftOfferBanner courseHref={h("/offrir")} />

      <section className="mx-auto max-w-[1274px] px-5 py-16">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-[30px] font-semibold text-black/80">Pourquoi Manufacto ?</h2>
            <p className="mt-2 max-w-2xl text-lg text-black/70">
              En ville, fabriquer et réparer n&apos;a rien de simple. Mutualiser un
              espace et des outils de qualité, c&apos;est notre réponse pour le plus
              grand nombre.
            </p>
          </div>
          <Link href={h("/cours")} className="font-semibold text-[#4a56dd] underline underline-offset-2">
            voir les cours
          </Link>
        </div>
        <PhotoMosaic
          images={[P.atelierWide, P.portrait13, P.handsElec, P.pl30, P.portrait18, P.pl35]}
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Link href={h("/pratique-libre")} className="group block">
            <ImageTile src={P.pl29} alt="Pratique libre" className="h-64">
              découvrez la pratique libre
            </ImageTile>
          </Link>
          <Link href={h("/cours")} className="group block">
            <ImageTile src={P.tabouret12} alt="Cours" className="h-64">
              découvrez nos cours ponctuels
            </ImageTile>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1071px] px-5 pb-12 text-center">
        <p className="text-xl leading-normal text-black/75">
          Plus besoin de faire de la poussière dans le salon, d&apos;attendre que les
          voisins soient réveillés, ou de laisser un projet sur leboncoin faute
          d&apos;outils. Venez nous rencontrer.
        </p>
      </section>

      <InstagramStrip />
    </main>
  );
}
