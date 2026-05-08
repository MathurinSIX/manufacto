import Image from "next/image";
import { Navigation } from "@/components/navigation";
import { Suspense } from "react";
import Link from "next/link";

const ASSETS = {
  logoFull: "/assets/figma-landing/logo-full.png",
  heroWood: "/assets/figma-landing/hero-wood.png",
  heroCouture: "/assets/figma-landing/hero-couture.png",
  heroElec: "/assets/figma-landing/hero-elec.png",
  pictoVectoriel: "/assets/picto/picto_vectoriel.svg",
  starBlue: "/assets/figma-landing/star-blue.png",
  starOrange: "/assets/figma-landing/star-orange.png",
} as const;

const universes = [
  {
    label: "menuiserie",
    picto: "/assets/picto/menuiserie/menuiserie.png",
    symbol: "/assets/symboles/menuiserie_symbole.png",
  },
  {
    label: "couture",
    picto: "/assets/picto/couture/couture.png",
    symbol: "/assets/symboles/couture_symbole.png",
  },
  {
    label: "électronique",
    picto: "/assets/picto/electronique/electronique.png",
    symbol: "/assets/symboles/electronique_symbole.png",
  },
  {
    label: "céramique",
    picto: "/assets/picto/ceramique/ceramique.png",
    symbol: "/assets/symboles/ceramique_symbole.png",
  },
];

const courseCards = [
  {
    number: "1.",
    title: "stages intensifs",
    color: "text-[#f56800]",
    copy: "Des modules courts pour apprendre les bases d'une technique et repartir avec une réalisation concrète.",
    symbol: "/assets/symboles/menuiserie_symbole.png",
  },
  {
    number: "2.",
    title: "cours ponctuels",
    color: "text-[#4a56dd]",
    copy: "Menuiserie, couture, électronique ou réparation : choisissez la session qui correspond à votre projet.",
    symbol: "/assets/symboles/couture_symbole.png",
  },
  {
    number: "3.",
    title: "accompagnement projet",
    color: "text-[#f56800]",
    copy: "Un temps encadré pour avancer avec méthode, utiliser les machines et débloquer les étapes délicates.",
    symbol: "/assets/symboles/electronique_symbole.png",
  },
];

const skillRows = [
  ["faire un cadre en bois", "menuiserie", "2h30", "42€"],
  ["réparer un petit appareil", "électronique", "2h", "35€"],
  ["prendre en main sa machine", "couture", "3h", "48€"],
  ["rénover une chaise", "tapisserie", "4h", "65€"],
];

const monthlyClasses = [
  {
    title: "découverte des machines bois",
    symbol: "/assets/symboles/menuiserie_symbole.png",
  },
  {
    title: "assemblages simples",
    symbol: "/assets/symboles/menuiserie_symbole.png",
  },
  {
    title: "initiation machine à coudre",
    symbol: "/assets/symboles/couture_symbole.png",
  },
  {
    title: "réparation textile",
    symbol: "/assets/symboles/couture_symbole.png",
  },
  {
    title: "soudure électronique",
    symbol: "/assets/symboles/electronique_symbole.png",
  },
  {
    title: "céramique modelage",
    symbol: "/assets/symboles/ceramique_symbole.png",
  },
];

export default function AtelierPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="flex min-h-screen w-full flex-col items-center">
        <Suspense fallback={<nav className="w-full h-16" />}>
          <Navigation />
        </Suspense>

        <section className="w-full bg-[#d9d9d9]">
          <div className="mx-auto flex h-[176px] max-w-[1100px] items-end justify-center px-5 pb-8 md:h-[300px]">
            <div className="relative h-[44px] w-[230px] md:h-[58px] md:w-[304px]">
              <Image
                src={ASSETS.logoFull}
                alt="Manufacto"
                fill
                className="object-contain"
                priority
                sizes="304px"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[990px] px-5 pb-10 pt-8 text-center">
          <p className="mx-auto max-w-[520px] text-[19px] font-semibold leading-tight text-[#4a56dd] underline decoration-1 underline-offset-2 md:text-[24px]">
            qu&apos;est-ce que manufacto?
          </p>
          <p className="mx-auto mt-5 max-w-[620px] text-[13px] leading-relaxed text-black/75 md:text-[15px]">
            Manufacto c&apos;est un atelier partagé et multidisciplinaire au coeur
            de Marseille, ouvert à toutes celles et ceux qui veulent faire de
            leurs mains.
          </p>
        </section>

        <section className="mx-auto w-full max-w-[1030px] px-5 pb-12">
          <h1 className="text-center text-[28px] font-bold leading-none tracking-[-0.5px] text-[#f56800] md:text-[43px]">
            un atelier, quatre univers
          </h1>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
            {universes.map((universe) => (
              <div key={universe.label} className="text-center">
                <div className="flex h-[112px] items-center justify-center rounded-[6px] bg-[#fff8f0] p-4 md:h-[156px]">
                  <Image
                    src={universe.picto}
                    alt=""
                    width={180}
                    height={140}
                    className="max-h-full w-auto object-contain"
                    aria-hidden
                  />
                </div>
                <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-black/60">
                  {universe.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-[1030px] gap-8 px-5 pb-16 md:grid-cols-[1fr_310px] md:items-start">
          <div>
            <h2 className="text-[24px] font-bold leading-tight md:text-[32px]">
              construire son parcours
            </h2>
            <div className="mt-5 space-y-4 text-[14px] leading-relaxed text-black/75 md:text-[16px]">
              <p>
                Vous voulez apprendre à utiliser une machine à coudre, une
                raboteuse, un fer à souder ? À rénover un meuble, fabriquer une
                lampe, réparer votre électroménager ?
              </p>
              <p>
                Que vous soyez débutant.e ou plus avancé.e, l&apos;atelier propose
                des formats simples pour progresser, être accompagné.e et
                repartir avec les bons gestes.
              </p>
            </div>
            <div className="mt-7 flex flex-wrap gap-4 text-[13px] font-semibold">
              <Link
                href="/cours"
                className="text-[#4a56dd] underline underline-offset-2"
              >
                voir les cours
              </Link>
              <Link
                href="/activities"
                className="text-[#58a34d] underline underline-offset-2"
              >
                réserver une session
              </Link>
            </div>
          </div>

          <div className="flex h-[260px] items-center justify-center overflow-hidden rounded-[6px] bg-[#fff8f0] p-6 md:h-[326px]">
            <Image
              src={ASSETS.pictoVectoriel}
              alt=""
              width={650}
              height={492}
              className="h-full w-full object-contain"
              aria-hidden
            />
          </div>
        </section>

        <section className="w-full bg-[#fff8f0]">
          <div className="mx-auto max-w-[1030px] px-5 py-10 md:py-14">
            <h2 className="mb-8 text-[24px] font-bold leading-tight md:text-[32px]">
              les formats proposés
            </h2>
            <div className="grid gap-5 md:grid-cols-3">
              {courseCards.map((card) => (
                <article
                  key={card.number}
                  className="min-h-[210px] rounded-[6px] bg-white px-6 py-7 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className={`text-[38px] font-bold leading-none ${card.color}`}>
                      {card.number}
                    </p>
                    <Image
                      src={card.symbol}
                      alt=""
                      width={54}
                      height={54}
                      className="h-12 w-12 object-contain"
                      aria-hidden
                    />
                  </div>
                  <h3 className="mt-3 text-[18px] font-bold leading-tight">
                    {card.title}
                  </h3>
                  <p className="mt-4 text-[13px] leading-relaxed text-black/70">
                    {card.copy}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-[1030px] gap-8 px-5 py-14 md:grid-cols-[1fr_330px]">
          <div>
            <h2 className="text-[24px] font-bold leading-tight md:text-[32px]">
              tarifs et réservations
            </h2>
            <p className="mt-4 max-w-[560px] text-[14px] leading-relaxed text-black/75 md:text-[16px]">
              Les cours sont ouverts sur inscription, avec des groupes réduits
              pour garantir un vrai temps d&apos;échange et d&apos;accompagnement.
            </p>

            <div className="mt-8 overflow-hidden rounded-[6px] border border-black/10">
              {skillRows.map(([name, domain, duration, price]) => (
                <div
                  key={name}
                  className="grid grid-cols-[1fr_84px_54px] gap-3 border-b border-black/10 px-4 py-3 text-[12px] last:border-b-0 md:grid-cols-[1fr_120px_70px_60px]"
                >
                  <span className="font-semibold">{name}</span>
                  <span className="hidden text-black/55 md:block">{domain}</span>
                  <span className="text-black/55">{duration}</span>
                  <span className="text-right font-semibold text-[#f56800]">
                    {price}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[6px] bg-[#fff8f0] px-6 py-7">
            <h3 className="text-[18px] font-bold leading-tight text-[#4a56dd]">
              visite de l&apos;atelier
            </h3>
            <p className="mt-4 text-[13px] leading-relaxed text-black/70">
              Tous les mardis soir, de 18h30 à 19h, l&apos;équipe vous présente
              le lieu et son fonctionnement. C&apos;est gratuit, sur inscription.
            </p>
            <Link
              href="/activities"
              className="mt-6 inline-block text-[20px] font-semibold text-[#4a56dd] underline underline-offset-2"
            >
              réserver
            </Link>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-[1030px] gap-8 px-5 pb-14 md:grid-cols-[340px_1fr] md:items-center">
          <div className="grid h-[420px] grid-cols-2 grid-rows-2 gap-4 rounded-[6px] bg-[#fff8f0] p-5 md:h-[560px]">
            {universes.map((universe) => (
              <div
                key={universe.label}
                className="flex items-center justify-center rounded-[6px] bg-white p-4"
              >
                <Image
                  src={universe.symbol}
                  alt=""
                  width={120}
                  height={120}
                  className="max-h-full w-auto object-contain"
                  aria-hidden
                />
              </div>
            ))}
          </div>

          <div>
            <div className="relative mb-8">
              <Image
                src={ASSETS.starOrange}
                alt=""
                width={166}
                height={138}
                className="absolute -left-14 -top-14 h-[110px] w-[132px] object-contain"
                aria-hidden
              />
              <h2 className="relative text-[24px] font-bold leading-tight md:text-[32px]">
                calendrier du mois
              </h2>
            </div>
            <p className="max-w-[560px] text-[14px] leading-relaxed text-black/75 md:text-[16px]">
              Retrouvez notre proposition de cours pour ce mois-ci. Certains
              formats reviennent régulièrement, d&apos;autres sont plus ponctuels.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
              {monthlyClasses.map((course) => (
                <div
                  key={course.title}
                  className="min-h-[88px] rounded-[6px] border border-[#f56800]/30 bg-[#fff8f0] p-4 text-[12px] font-semibold leading-snug text-black/75"
                >
                  <Image
                    src={course.symbol}
                    alt=""
                    width={34}
                    height={34}
                    className="mb-3 h-8 w-8 object-contain"
                    aria-hidden
                  />
                  {course.title}
                </div>
              ))}
            </div>
            <Link
              href="/cours"
              className="mt-8 inline-block text-[18px] font-semibold text-[#58a34d] underline underline-offset-2"
            >
              voir tout le calendrier
            </Link>
          </div>
        </section>

        <section className="w-full bg-[#fff8f0]">
          <div className="mx-auto grid max-w-[1030px] gap-7 px-5 py-10 md:grid-cols-[260px_1fr_auto] md:items-center">
            <h2 className="text-[24px] font-bold leading-tight text-[#f56800] md:text-[30px]">
              devenir autonome
            </h2>
            <p className="text-[14px] leading-relaxed text-black/75 md:text-[16px]">
              Après une initiation, vous pouvez accéder à la pratique libre et
              venir travailler sur vos projets avec les machines, les outils et
              l&apos;espace de l&apos;atelier.
            </p>
            <Link
              href="/pratique-libre"
              className="text-[20px] font-semibold text-[#4a56dd] underline underline-offset-2"
            >
              découvrir
            </Link>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1030px] px-5 py-14">
          <div className="grid gap-8 md:grid-cols-[1fr_360px] md:items-start">
            <div>
              <Image
                src={ASSETS.starBlue}
                alt=""
                width={140}
                height={112}
                className="mb-2 h-[88px] w-[110px] object-contain"
                aria-hidden
              />
              <h2 className="text-[24px] font-bold leading-tight md:text-[32px]">
                horaires
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-black/75 md:text-[16px]">
                Les cours ont lieu en soirée et le week-end selon les disciplines.
                Le calendrier est mis à jour chaque mois avec les prochaines
                sessions disponibles.
              </p>
            </div>

            <div className="rounded-[6px] border border-black/10 p-5">
              {[
                ["mardi", "18h30 - 21h"],
                ["mercredi", "18h30 - 21h"],
                ["samedi", "10h - 17h"],
                ["dimanche", "ponctuel"],
              ].map(([day, time]) => (
                <div
                  key={day}
                  className="flex justify-between border-b border-black/10 py-3 text-[13px] last:border-b-0"
                >
                  <span className="font-semibold">{day}</span>
                  <span className="text-black/60">{time}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1030px] px-5 pb-20">
          <h2 className="mb-7 text-[24px] font-bold leading-tight md:text-[32px]">
            formules
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["cours découverte", "à partir de 35€", "Pour tester une pratique et prendre en main les outils."],
              ["cycle projet", "120€ / mois", "Pour apprendre sur plusieurs séances avec un objectif concret."],
              ["pratique libre", "sur abonnement", "Pour utiliser l'atelier en autonomie après validation."],
            ].map(([title, price, copy]) => (
              <article
                key={title}
                className="rounded-[6px] border border-[#f56800]/30 bg-white p-5"
              >
                <h3 className="text-[17px] font-bold leading-tight">{title}</h3>
                <p className="mt-3 text-[20px] font-bold text-[#f56800]">
                  {price}
                </p>
                <p className="mt-4 text-[12px] leading-relaxed text-black/65">
                  {copy}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
