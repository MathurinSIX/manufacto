import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import {
  AtelierCreditPackGrid,
  AtelierDiscoveryPackGrid,
  AtelierSubscriptionList,
} from "@/components/atelier-tarifs-purchases";
import {
  MARKETING_LINK_CLASS,
  MarketingBody,
  MarketingSectionTitle,
} from "@/components/marketing";

const ASSETS = {
  heroWood: "/assets/figma-landing/hero-wood.png",
  heroCouture: "/assets/figma-landing/hero-couture.png",
  heroElec: "/assets/figma-landing/hero-elec.png",
  wordMenuiserie: "/assets/figma-landing/words-orange.png",
  wordCouture: "/assets/figma-landing/words-blue.png",
  wordElectronique: "/assets/figma-landing/words-green.png",
  wordCeramique: "/assets/figma-landing/words-pink.png",
  pictoVectoriel: "/assets/picto/picto_vectoriel.svg",
  starBlue: "/assets/figma-landing/star-blue.png",
  starOrange: "/assets/figma-landing/star-orange.png",
  heroAtelier: "/assets/l_atelier/Frame 44.jpg",
  universAtelier: "/assets/l_atelier/Vector.jpg",
  creditSystem: "/assets/l_atelier/Frame 1321317462.jpg",
  tarifs: "/assets/l_atelier/WhatsApp Image 2026-05-11 at 17.40.04 1.jpg",
} as const;

const universes = [
  {
    label: "menuiserie",
    image: "/assets/picto/menuiserie/menuiserie.png",
    width: 180,
    height: 140,
  },
  {
    label: "couture",
    image: "/assets/picto/couture/couture.png",
    width: 180,
    height: 140,
  },
  {
    label: "électronique",
    image: "/assets/picto/electronique/electronique.png",
    width: 180,
    height: 140,
  },
  {
    label: "céramique",
    image: "/assets/picto/ceramique/ceramique.png",
    width: 180,
    height: 140,
  },
];

const courseCards = [
  {
    number: "1.",
    title: "créez un compte et achetez un pass manufacto,",
    color: "text-[#f56800]",
    copy: " que vous chargez avec le nombre de crédits de votre choix.",
  },
  {
    number: "2.",
    title: "avant votre première venue, nous vous enverrons un lien pour vous inscrire à une visite détaillée",
    color: "text-[#f56800]",
    copy: " de l’atelier. Elle sera l’occasion de se rencontrer, de vous faire faire le tour des lieux et de vous expliquer comment l’atelier fonctionne.",
  },
  {
    number: "3.",
    title: "réservez vos prochains créneaux / cours.",
    color: "text-[#f56800]",
    copy: " Vous serez débité du nombre de crédits correspondant, le solde reste disponible pour une prochaine fois, sur votre espace en ligne.",
  },
];

function ImageTile({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[6px] bg-[#d9d9d9] ${className}`}>
      <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 520px" />
    </div>
  );
}

export default function AtelierPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="flex min-h-screen w-full flex-col items-center">
        <section className="relative h-[176px] w-full overflow-hidden bg-[#d9d9d9] md:h-[300px]">
          <Image
            src={ASSETS.heroAtelier}
            alt="Manufacto, atelier partagé de menuiserie"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </section>

        <section id="concept" className="mx-auto w-full max-w-[990px] scroll-mt-28 px-5 pb-10 pt-8 text-center">
          <h2 className="text-center text-[28px] font-bold leading-none tracking-[-0.5px] text-[#f56800] md:text-[43px]">
            qu&apos;est-ce que manufacto?
          </h2>
          <div className="mx-auto mt-5 max-w-[620px] space-y-12 text-xl leading-normal text-black/75">
            <p>
              Manufacto est né d&apos;une envie : proposer un{" "}
              <strong>lieu accessible</strong> à des{" "}
              <strong>particuliers et amateurs, amatrices</strong> qui
              voudraient travailler le bois, le textile, la terre, ou
              l&apos;électronique dans un espace adapté et avec des machines de
              qualité.
            </p>
            <p>
              Situé au cœur du 5ème arrondissement, l&apos;atelier rassemble
              plusieurs espaces de pratique: menuiserie, couture, électronique
              et céramique.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1030px] px-5 pb-12">
          <h1 className="text-center text-[28px] font-bold leading-none tracking-[-0.5px] text-[#f56800] md:text-[43px]">
            un atelier, quatre univers
          </h1>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
            {universes.map((universe) => (
              <div key={universe.label} className="text-center">
                <div className="flex h-[112px] items-center justify-center p-4 md:h-[156px]">
                  <Image
                    src={universe.image}
                    alt={universe.label}
                    width={universe.width}
                    height={universe.height}
                    className="max-h-full w-auto object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1030px] px-5 pb-16">
          <div className="grid gap-10 md:grid-cols-[1fr_430px] md:items-start">
            <div>
            <MarketingBody className="max-w-[920px] space-y-8">
              <p>
                Manufacto est organisé autour de quatre univers techniques et
                créatifs distincts. Chacun d&apos;entre eux a son espace, ses
                outils, ses machines.
              </p>
              <p>
                Chaque espace est organisé autour de{" "}
                <strong>plusieurs postes de travail distincts</strong>, que
                chacun peut réserver pour la durée et l&apos;usage de son choix,
                pour <strong>réaliser ses propres projets</strong>, en autonomie
                ou en autonomie encadrée.
              </p>
              <p>
                En complément de ces temps de{" "}
                <strong>pratique libre</strong>, nous vous proposons également
                des <strong>cours ponctuels</strong> pour débloquer de nouvelles
                compétences.
              </p>
              <p>
                L&apos;objectif : se faire plaisir en donnant vie à ses projets,{" "}
                <strong>
                  quel que soit votre niveau, vos besoins et vos envies.
                </strong>
              </p>
            </MarketingBody>
            <div className="mt-12 flex flex-wrap gap-x-24 gap-y-4">
              <Link
                href="/pratique-libre"
                className={MARKETING_LINK_CLASS}
              >
                découvrez la pratique libre
              </Link>
              <Link
                href="/cours"
                className="text-2xl font-semibold text-[#58a34d] underline underline-offset-2"
              >
                découvrez nos cours
              </Link>
            </div>
            </div>
            <ImageTile
              src={ASSETS.universAtelier}
              alt="Chaise en bois en cours de fabrication"
              className="h-[380px] rounded-[16px]"
            />
          </div>
        </section>

        <section id="fonctionnement" className="w-full scroll-mt-28 bg-[#fff8f0]">
          <div className="mx-auto max-w-[1030px] px-5 py-10 md:py-14">
            <MarketingSectionTitle className="mb-12 text-black">
              fonctionnement
            </MarketingSectionTitle>

            <div className="mb-7 flex items-center gap-5">
              <Image
                src={ASSETS.starBlue}
                alt=""
                width={120}
                height={96}
                className="h-16 w-20 object-contain"
                aria-hidden
              />
              <p className="max-w-[760px] text-2xl font-bold leading-tight text-black/80">
                vous êtes intéressé par la{" "}
                <span className="text-[#58a34d]">pratique libre</span>, <br />
                et peut être{" "}
                <span className="text-[#58a34d]">quelques cours</span> de temps
                en temps
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {courseCards.map((card) => (
                <article
                  key={card.number}
                  className="min-h-[280px] rounded-[28px] bg-white px-8 py-9 shadow-sm"
                >
                  <p className={`text-[64px] font-normal leading-none ${card.color}`}>
                    {card.number}
                  </p>
                  <p className="mt-4 text-lg leading-normal text-black/75">
                    <strong className="text-black/80">{card.title}</strong>
                    {card.copy}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-16">
              <div className="mb-7 flex items-center gap-5">
                <Image
                  src={ASSETS.starOrange}
                  alt=""
                  width={120}
                  height={100}
                  className="h-16 w-20 object-contain"
                  aria-hidden
                />
                <p className="max-w-[760px] text-2xl font-bold leading-tight text-black">
                  vous voulez{" "}
                  <span className="text-[#f6c51d]">
                    simplement acheter un cours
                  </span>
                  <br />
                  de montée en compétence
                </p>
              </div>
              <p className="text-xl leading-normal text-black/75">
                Que ce soit pour <strong>découvrir</strong> avant de pratiquer,
                ou pour <strong>offrir</strong> (et c&apos;est une très bonne
                idée !), alors rien de plus simple : Choisissez-le parmi nos
                propositions, réglez et venez le jour dit.
              </p>
            </div>
          </div>

          <div className="mt-4 bg-white/55">
            <div className="mx-auto grid max-w-[1030px] gap-6 px-5 py-8 md:grid-cols-[210px_1fr] md:items-center">
              <p className="text-2xl font-bold text-[#f56800]">
                besoin d&apos;aide ?
              </p>
              <p className="text-lg leading-normal text-black/75">
                <strong className="text-black/80">
                  Toutes ces démarches peuvent également être effectuées sur
                  place
                </strong>{" "}
                à l&apos;atelier, si vous préférez. Passez dans nos heures
                d&apos;ouvertures, nous pourrons vous aider.
              </p>
            </div>
          </div>
        </section>

        <section id="horaires-et-tarifs" className="mx-auto w-full max-w-[1030px] scroll-mt-28 px-5 py-14">
          <MarketingSectionTitle className="text-black">
            horaires
          </MarketingSectionTitle>

          <div className="relative mx-auto mt-12 max-w-[610px] rounded-[18px] border border-[#f56800]/60 bg-[#fff8f0] px-8 py-10 text-center text-xl leading-normal text-black/75">
            <Image
              src={ASSETS.starOrange}
              alt=""
              width={166}
              height={138}
              className="absolute -right-10 -top-10 h-[112px] w-[135px] object-contain"
              aria-hidden
            />
            <div className="relative space-y-1 font-medium">
              <p>Mardi : 13h / 20h</p>
              <p>Mercredi : 9h / 21h</p>
              <p>Jeudi : 13h / 21h</p>
              <p>Vendredi : 9h / 17h</p>
              <p>Samedi* : 9h / 12h &amp; 13h / 17h</p>
            </div>
            <p className="relative mt-5 text-xs">
              *nous sommes fermés tous les derniers samedi du mois.
            </p>
          </div>
        </section>

        <section id="tarifs" className="mx-auto w-full max-w-[1030px] px-5 pb-20">
          <MarketingSectionTitle className="text-black">
            tarifs
          </MarketingSectionTitle>

          <div className="mt-16 grid gap-10 md:grid-cols-[1fr_430px] md:items-start">
            <div>
              <h3 className="text-[28px] font-bold leading-none text-black">
                manufacto fonctionne avec <br />
                un système de crédit
              </h3>
              <MarketingBody className="mt-14 text-lg">
                <p>
                  Pour avoir accès à l&apos;atelier, il vous suffit de{" "}
                  <strong>charger votre pass</strong> avec un certain nombre de
                  crédits, avec lesquels vous pouvez ensuite{" "}
                  <strong>acheter des heures de pratique libre</strong> en
                  menuiserie, en couture, des ateliers de montée en
                  compétence... ou autre selon votre choix.
                </p>
                <p>
                  Les crédits s&apos;achètent par lots, et sont{" "}
                  <strong>valables un an.</strong>
                  <br />
                  Les tarifs sont dégressifs.
                </p>
                <p>
                  Parmi nos activités, deux peuvent être payées en dehors de ce
                  système de crédit :
                </p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>
                    <strong>les ateliers de montée en compétence</strong>, si
                    vous voulez simplement les offrir, ou découvrir le lieu, une
                    pratique ou des outils spécifiques.
                  </li>
                  <li>
                    <strong>les cuissons de céramique</strong> : elles sont
                    facturées à l&apos;unité, en dehors du système de crédit.
                  </li>
                </ul>
              </MarketingBody>
            </div>
            <ImageTile
              src={ASSETS.creditSystem}
              alt="Maillet et copeaux de bois"
              className="h-[440px] rounded-[16px]"
            />
          </div>

          <div className="mt-20 grid gap-10 md:grid-cols-[1fr_430px] md:items-start">
            <ImageTile
              src={ASSETS.tarifs}
              alt="Outils de menuiserie sur un établi"
              className="h-[760px] rounded-[16px]"
            />
            <div className="space-y-8">
              <div>
                <h3 className="border-b border-black pb-1 text-[34px] font-bold leading-none text-[#f56800]">
                  menuiserie
                </h3>
                <div className="mt-4 space-y-1 text-lg leading-tight text-black/75">
                  <div className="flex justify-between gap-6">
                    <span>autonomie complète</span>
                    <span>2 crédits / heure</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span>autonomie encadrée</span>
                    <span>3 crédits / heure</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span>aide à la conception</span>
                    <span>4 crédits / heure</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="border-b border-black pb-1 text-[34px] font-bold leading-none text-[#4a56dd]">
                  couture
                </h3>
                <div className="mt-4 space-y-1 text-lg leading-tight text-black/75">
                  <div className="flex justify-between gap-6">
                    <span>autonomie complète</span>
                    <span>1 crédit / heure</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span>autonomie encadrée</span>
                    <span>2 crédits / heure</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="border-b border-black pb-1 text-[34px] font-bold leading-none text-[#d73459]">
                  céramique
                </h3>
                <div className="mt-4 space-y-3 text-lg leading-tight text-black/75">
                  <div className="flex justify-between gap-6">
                    <span>autonomie complète</span>
                    <span>2 crédits / heure</span>
                  </div>
                  <div>
                    <p>cuissons</p>
                    <div className="flex justify-between gap-6">
                      <span>· four entier</span>
                      <span>60 €</span>
                    </div>
                    <p className="mt-2 max-w-[300px] text-xs leading-tight">
                      pour retrouver le détail des modalités de nos cuissons
                      (terres acceptées, taille du four etc), allez sur notre
                      page cuisson.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="border-b border-black pb-1 text-[34px] font-bold leading-none text-[#20b75a]">
                  électronique
                </h3>
                <div className="mt-4 space-y-1 text-lg leading-tight text-black/75">
                  <div className="flex justify-between gap-6">
                    <span>autonomie complète</span>
                    <span>1 crédit / heure</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span>repair café</span>
                    <span>prix libre</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="border-b border-black pb-1 text-[34px] font-bold leading-none text-[#f6c51d]">
                  cours
                </h3>
                <div className="mt-4 space-y-1 text-lg leading-tight text-black/75">
                  <div className="flex justify-between gap-6">
                    <span>catégorie 01</span>
                    <span>50 € / 10 crédits</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span>catégorie 02</span>
                    <span>72 € / 15 crédits</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span>catégorie 03</span>
                    <span>100 € / 20 crédits</span>
                  </div>
                </div>
              </div>

              <p className="pt-8 text-lg leading-tight text-black/75">
                À savoir : en pratique libre{" "}
                <strong>(autonomie complète &amp; encadrée)</strong> la durée
                minimale de réservation est de deux heures consécutives.
              </p>
            </div>
          </div>

          <div className="mt-20 grid gap-10 md:grid-cols-[380px_1fr] md:items-start">
            <div>
              <h3 className="text-[28px] font-bold leading-tight text-[#4a56dd]">
                les packs découverte*
              </h3>
              <p className="mt-7 text-lg leading-normal text-black/75">
                Deux packs à choisir si vous voulez venir une première fois pour
                tester et découvrir l&apos;atelier, sans vous engager.
              </p>
              <p className="mt-7 text-lg leading-normal text-black/75">
                En savoir plus sur l&apos;autonomie encadrée{" "}
                <Link href="/pratique-libre" className="font-bold underline">
                  en menuiserie
                </Link>{" "}
                /{" "}
                <Link href="/pratique-libre" className="font-bold underline">
                  en couture
                </Link>
                .
              </p>
              <p className="mt-7 text-lg leading-normal text-black/75">
                *offre limitée à un achat / personne.
              </p>
            </div>
            <Suspense
              fallback={
                <div className="grid min-h-[155px] animate-pulse gap-2 rounded-[14px] bg-[#fff8f0] md:grid-cols-2" />
              }
            >
              <AtelierDiscoveryPackGrid />
            </Suspense>
          </div>

          <div className="mt-20 grid gap-10 md:grid-cols-[380px_1fr] md:items-center">
            <div>
              <h3 className="text-[28px] font-bold leading-tight text-[#f56800]">
                les packs de crédits
              </h3>
              <p className="mt-6 text-lg leading-normal text-black/75">
                Les crédits sont <strong>valables un an</strong> à partir de
                leur date d&apos;achat.
              </p>
              <p className="mt-6 text-lg leading-normal text-black/75">
                Ces recharges sont créditées directement sur votre compte
                personnel. S&apos;il vous reste des crédits au moment de votre
                achat, ils s&apos;ajoutent à ceux que vous venez d&apos;acheter.
              </p>
            </div>
            <Suspense
              fallback={
                <div className="grid min-h-[155px] animate-pulse grid-cols-2 gap-2 rounded-[14px] bg-[#fff8f0] md:grid-cols-5" />
              }
            >
              <AtelierCreditPackGrid />
            </Suspense>
          </div>

          <div className="mt-20 grid gap-10 md:grid-cols-[470px_1fr] md:items-start">
            <div>
              <h3 className="text-[28px] font-bold leading-tight text-[#f56800]">
                les abonnements
              </h3>
              <div className="mt-6 space-y-5 text-lg leading-normal text-black/75">
                <p>
                  Les abonnements vous permettent d&apos;avoir un volume de
                  crédit mensuel à utiliser à l&apos;atelier, à tarif
                  préférentiel.
                </p>
                <p>
                  Chaque mois, votre compte sera crédité du nombre de crédit
                  correspondant. Si vous n&apos;utilisez pas tout sur le mois, le
                  solde reste disponible et se cumule à celui du mois suivant.
                  Vous devrez par ailleurs{" "}
                  <strong>dans tous les cas réserver vos créneaux</strong> avant
                  de venir à l&apos;atelier.
                  <br />
                  <strong>La durée d&apos;engagement est de 3 mois</strong>, vous
                  pouvez ensuite résilier chaque mois. Après résiliation, vous
                  disposez de 3 mois pour utiliser votre solde de crédits.
                </p>
              </div>
              <p className="mt-14 max-w-[390px] text-xs leading-tight text-black/75">
                15% de réduction sur tous nos tarifs pour les personnes
                étudiantes, au chômages, bénéficiaires du RSA. Et si vous ne
                rentrez dans aucune de ces cases mais que nos tarifs sont à
                freins à votre venue, venez nous rencontrer et discutons en.
              </p>
            </div>
            <Suspense
              fallback={
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="min-h-[120px] animate-pulse rounded-[14px] bg-[#fff8f0]"
                    />
                  ))}
                </div>
              }
            >
              <AtelierSubscriptionList />
            </Suspense>
          </div>
        </section>
      </div>
    </main>
  );
}
