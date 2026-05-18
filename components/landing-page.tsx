import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { VisitAtelierCallout } from "@/components/marketing";
import { MonthlyActivitiesCalendar } from "@/components/monthly-activities-calendar";

const ASSETS = {
  heroWood: "/assets/pictures/c684ad317993704862dcfcc1d97400638b639f66.png",
  heroCouture: "/assets/pictures/63ae04e0666801e448100c2c15e0f3589d90e665.png",
  heroElec: "/assets/pictures/120e19b8f3497733331fe206ad3cebf6cc80d967.png",
  wordMenuiserie: "/assets/words/orange/menuiserie.png",
  wordCouture: "/assets/words/bleue/couture.png",
  wordElectronique: "/assets/words/verte/electronique.png",
  wordCeramique: "/assets/words/rose/ceramique.png",
  starBlue: "/assets/figma-landing/star-blue.png",
  starOrange: "/assets/figma-landing/star-orange.png",
  pratiqueLibre: "/assets/homepage/Frame 42.jpg",
  cours: "/assets/homepage/Frame 43.jpg",
  atelier: "/assets/homepage/Vector.jpg",
  instagramOne: "/assets/instagram/655781979_17860317159690779_7751715208418556990_n.jpg",
  instagramTwo: "/assets/instagram/660284162_17853781842690779_931413534108163183_n.jpeg",
  instagramThree: "/assets/instagram/670453179_17860602957690779_9102878959608060197_n.jpg",
  instagramFour: "/assets/instagram/669432384_17855364162690779_7614125889124842469_n.jpg",
} as const;

const INSTAGRAM_URL = "https://www.instagram.com/manufacto.marseille/";

const wordImages = [
  {
    src: ASSETS.wordMenuiserie,
    alt: "menuiserie",
    width: 496,
    height: 90,
    className: "h-6 w-auto max-w-[40vw] sm:h-7 md:h-9 lg:h-11",
  },
  {
    src: ASSETS.wordCouture,
    alt: "couture",
    width: 279,
    height: 63,
    className: "h-6 w-auto max-w-[40vw] sm:h-7 md:h-9 lg:h-11",
  },
  {
    src: ASSETS.wordElectronique,
    alt: "électronique",
    width: 466,
    height: 124,
    className: "h-9 w-auto max-w-[40vw] sm:h-10 md:h-12 lg:h-16",
  },
  {
    src: ASSETS.wordCeramique,
    alt: "céramique",
    width: 428,
    height: 130,
    className: "h-9 w-auto max-w-[40vw] sm:h-10 md:h-12 lg:h-16",
  },
];

function ImageTile({
  src,
  alt,
  className = "",
  children,
}: {
  src: string;
  alt: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[19px] bg-[#d9d9d9] ${className}`}>
      <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 640px" />
      {children ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 px-6 text-center text-[30px] font-semibold leading-tight text-white transition group-hover:bg-black/30">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function CalendrierAteliersFallback() {
  return (
    <div
      className="min-h-[380px] rounded-[19px] border border-black/10 bg-[#f2f2f2] md:min-h-[520px]"
      aria-hidden
    />
  );
}

export function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <header className="overflow-hidden border-y border-white bg-[#fff8f0]">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-6 md:px-8 md:pb-12 md:pt-10">
          <div className="mx-auto max-w-[1040px]">
            <div className="mb-6 flex flex-col items-start gap-4 text-left md:flex-row md:gap-6">
              <p className="min-w-0 flex-1 text-xl leading-relaxed text-[#2d2d2d] md:max-w-[65%] md:text-2xl">
                <Logo className="mr-2 inline-block h-10 w-auto align-bottom md:h-12" />
                c&apos;est un atelier partagé et multidisciplinaire au coeur de
                Marseille, ouvert à toutes celles et ceux qui veulent faire de leurs mains.
              </p>
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl shadow-md ring-1 ring-black/5 md:h-40 md:w-40">
                <Image
                  src={ASSETS.heroWood}
                  alt="Mains manipulant du textile"
                  fill
                  className="object-cover"
                  sizes="160px"
                  priority
                />
              </div>
            </div>

            <div className="mb-0 flex flex-col items-start gap-4 md:gap-6">
              <div className="relative aspect-[16/10] w-full max-w-xs overflow-hidden rounded-xl shadow-md ring-1 ring-black/5">
                <Image
                  src={ASSETS.heroCouture}
                  alt="Mains travaillant le bois avec une règle et un crayon"
                  fill
                  className="object-cover object-left"
                  sizes="(max-width: 768px) 100vw, 320px"
                  priority
                />
              </div>

              <div className="-mt-0 flex flex-col-reverse items-start gap-4 text-left md:-mt-32 md:flex-row md:items-end md:gap-6">
                <p className="min-w-0 flex-1 text-base leading-[1.7] text-[#2d2d2d] md:max-w-xl md:text-lg">
                  Un lieu pour avoir accès à l&apos;<strong>espace</strong>, aux{" "}
                  <strong>machines</strong>, <strong>outils</strong> et{" "}
                  <strong>compétences</strong> pour faire soi-même, créer,
                  réparer... au gré de ses envies ou de ses besoins.
                </p>
                <div className="relative h-48 w-48 shrink-0 overflow-hidden rounded-xl shadow-md ring-1 ring-black/5 md:h-56 md:w-56">
                  <Image
                    src={ASSETS.heroElec}
                    alt="Mains travaillant sur une carte électronique"
                    fill
                    className="object-cover"
                    sizes="224px"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="border-b border-black/30 px-4 py-4 sm:px-5 md:py-5 lg:py-0">
        <div className="mx-auto flex w-full max-w-[1220px] flex-wrap items-center justify-center gap-x-3 gap-y-3 sm:gap-x-5 md:gap-x-6 lg:min-h-[96px] xl:gap-x-8">
          {wordImages.map((word, index) => (
            <div key={word.alt} className="flex min-w-0 items-center gap-3 sm:gap-5 lg:gap-8">
              {index > 0 ? <span className="hidden text-2xl leading-none lg:inline">·</span> : null}
              <Image
                src={word.src}
                alt={word.alt}
                width={word.width}
                height={word.height}
                className={`object-contain ${word.className}`}
                sizes="(max-width: 768px) 160px, 288px"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1274px] px-5 pb-14 pt-16 md:pb-[94px] md:pt-[82px]">
        <p className="mb-14 text-center text-2xl leading-tight text-black/75">
          Un lieu pour :
        </p>

        <div className="grid gap-16 md:grid-cols-2 md:gap-[86px]">
          <article className="relative flex flex-col">
            <Image
              src={ASSETS.starBlue}
              alt=""
              width={242}
              height={193}
              className="absolute -left-10 -top-14 z-0 h-[150px] w-[188px] object-contain md:-left-10 md:-top-20 md:h-[193px] md:w-[242px]"
              aria-hidden
            />
            <h2 className="relative z-10 mb-6 pl-20 text-[30px] font-semibold leading-tight text-black/80">
              faire
            </h2>
            <div className="relative z-10 min-h-[210px] flex-1 space-y-5 text-xl leading-normal text-black/75">
              <p>
                Vous cherchez un lieu où <strong>fabriquer, réparer, transformer,
                rénover, bricoler</strong> ou donner vie à vos projets en ayant
                accès à des machines adaptées ?
              </p>
              <p>
                En autonomie ou accompagné.e, Manufacto est ouvert à toute
                personne ayant un projet de réparation et/ou de fabrication
                autour du travail du bois, du textile, de l&apos;électronique ou
                de la céramique, quel que soit son niveau.
              </p>
            </div>
            <Link href="/pratique-libre" className="mt-8 block">
              <ImageTile
                src={ASSETS.pratiqueLibre}
                alt="Projet de menuiserie en pratique libre"
                className="group h-[337px]"
              >
                découvrez la pratique libre
              </ImageTile>
            </Link>
          </article>

          <article className="relative flex flex-col">
            <Image
              src={ASSETS.starOrange}
              alt=""
              width={246}
              height={205}
              className="absolute -left-12 -top-14 z-0 h-[155px] w-[186px] rotate-[37deg] object-contain md:-left-16 md:-top-20 md:h-[205px] md:w-[246px]"
              aria-hidden
            />
            <h2 className="relative z-10 mb-6 pl-16 text-[30px] font-semibold leading-tight text-black/80">
              apprendre
            </h2>
            <div className="relative z-10 min-h-[210px] flex-1 space-y-5 text-xl leading-normal text-black/75">
              <p>
                Vous voulez apprendre à utiliser une machine à coudre, une
                raboteuse, un fer à souder ? À rénover un meuble, à faire une
                lampe, à fabriquer votre table basse, réparer votre électroménager ?
              </p>
              <p>
                Vous êtes au bon endroit. Que vous soyez <strong>débutants ou
                plus avancés</strong>, découvrez nos cours ponctuels pour
                développer de nouvelles compétences, vous perfectionner, et
                pouvoir donner vie à vos projets.
              </p>
            </div>
            <Link href="/cours" className="mt-8 block">
              <ImageTile
                src={ASSETS.cours}
                alt="Tabourets en bois fabriqués en cours"
                className="group h-[337px]"
              >
                découvrez nos cours ponctuels
              </ImageTile>
            </Link>
          </article>
        </div>
      </section>

      <VisitAtelierCallout />

      <section id="calendrier" className="mx-auto max-w-[1274px] px-5 py-20">
        <h2 className="mb-8 text-[30px] font-semibold leading-tight text-black/80">
          calendrier du mois
        </h2>
        <div className="mb-8 max-w-[1196px] text-xl leading-normal text-black/75">
          <p>Retrouvez notre proposition de cours pour ce mois-ci.</p>
          <p>
            Certains reviennent régulièrement, d&apos;autres sont plus ponctuels,
            vous pouvez retrouver le détail{" "}
            <Link href="/cours" className="font-semibold text-[#4a56dd] underline">
              ici.
            </Link>
          </p>
        </div>
        <Suspense fallback={<CalendrierAteliersFallback />}>
          <div className="rounded-[19px] border border-black/10 bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-8">
            <MonthlyActivitiesCalendar />
          </div>
        </Suspense>
      </section>

      <section className="bg-[#fff8f0]">
        <div className="mx-auto grid max-w-[1274px] gap-6 px-5 py-[50px] md:grid-cols-[298px_1fr_auto] md:items-start">
          <h2 className="text-[30px] font-bold leading-none tracking-[-0.6px]">
            newsletter
          </h2>
          <div className="max-w-[783px] text-xl leading-normal text-black/75">
            <p>
              Pour rester au courant de nos actualités, laissez-nous votre mail.
              On ne vous inondera pas c&apos;est promis, vous recevrez de nos
              nouvelles <strong>une fois par trimestre.</strong>
            </p>
            <p className="mt-6">
              Vous pouvez aussi choisir de recevoir, chaque début de mois, le
              calendrier des cours proposés (cochez simplement la case).
            </p>
          </div>
          <Link
            href="/newsletter"
            className="text-2xl font-semibold text-[#4a56dd] underline underline-offset-2 md:pt-12"
          >
            s&apos;inscrire
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1274px] px-5 py-[60px] text-center">
        <div className="mx-auto max-w-[1071px] text-xl leading-normal text-black/75">
          <h2 className="mb-5 text-[30px] font-semibold leading-tight text-[#4a56dd]">
            pourquoi manufacto?
          </h2>
          <p>
            Parce que nous sommes nombreux et nombreuses à aimer fabriquer,
            bricoler, créer des objets, du mobilier, le transformer, le réparer,
            le rénover. Pourtant, en ville, ceci n&apos;a rien de simple ! Entre
            le fait de pouvoir faire du bruit, de la poussière, avoir les bons
            outils, la place nécessaire et être aidé si besoin, les freins du
            quotidien sont nombreux.
          </p>
          <p className="mt-5">
            La <strong>mutualisation d&apos;un espace et d&apos;outils de qualité</strong>{" "}
            nous est apparue comme une réponse susceptible de profiter au{" "}
            <strong>plus grand nombre.</strong>
          </p>
        </div>

        <ImageTile
          src={ASSETS.atelier}
          alt="Personnes travaillant dans l'atelier de menuiserie"
          className="mt-16 h-[260px] md:h-[438px]"
        />

        <p className="mx-auto mt-16 max-w-[1072px] text-xl leading-normal text-black/75">
          Plus besoin de faire de la poussière dans votre salon, de trouver
          quelqu&apos;un qui pourrait vous prêter une machine à coudre,
          d&apos;attendre que vos voisins ou voisines soient réveillées pour
          enfin travailler à votre nouvelle étagère, de se dire qu&apos;il
          faudrait réparer ce grille pain mais que vous n&apos;avez pas ce
          qu&apos;il faut, ou de laisser sur leboncoin des pépites à retaper sans
          savoir par où commencer... venez nous rencontrer !
        </p>
      </section>

      <section className="mx-auto max-w-[1274px] px-5 pb-20 text-center">
        <Link
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-[34px] font-bold leading-none tracking-[-1px] text-[#4a56dd] sm:text-[50px]"
        >
          manufacto.marseille
        </Link>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          <ImageTile src={ASSETS.instagramOne} alt="Espace menuiserie" className="h-[220px] md:h-[361px]" />
          <ImageTile src={ASSETS.instagramTwo} alt="Assemblage bois en cours" className="h-[220px] md:h-[361px]" />
          <ImageTile src={ASSETS.instagramThree} alt="Outils sur établi" className="h-[220px] md:h-[361px]" />
          <ImageTile src={ASSETS.instagramFour} alt="Atelier textile collectif" className="h-[220px] md:h-[361px]" />
        </div>
        <p className="mt-8 text-xl leading-normal text-black/75">
          Suivez-nous sur instagram pour suivre nos actualités !
        </p>
      </section>
    </main>
  );
}
