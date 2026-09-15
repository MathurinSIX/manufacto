import Image from "next/image";
import Link from "next/link";
import { ExpertEquipmentDetails } from "@/components/expert-equipment-details";
import {
  ImageTile,
  P,
  PhotoRibbon,
  PrimaryCta,
  RIBBON_LIEU,
  RIBBON_PORTRAITS,
  SecondaryCta,
  WordStrip,
} from "@/components/mockups/shared";
import { type SiteScope, scopeHref } from "@/components/mockups/paths";

function PageHero({
  title,
  lead,
  image,
  children,
}: {
  title: string;
  lead: string;
  image: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="bg-[#fff8f0]">
      <div className="mx-auto grid max-w-[1274px] gap-8 px-5 py-12 md:grid-cols-2 md:items-center md:py-16">
        <div>
          <h1 className="text-[34px] font-bold leading-tight tracking-[-0.02em] md:text-[46px]">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-xl leading-normal text-black/75">{lead}</p>
          {children ? <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{children}</div> : null}
        </div>
        <ImageTile src={image} alt="" className="h-64 md:h-[380px]" priority />
      </div>
    </header>
  );
}

export { PageHero };

export function MockupAtelierPage({ scope = "site" }: { scope?: SiteScope } = {}) {
  const h = (path: string) => scopeHref(scope, path);
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
      label: "céramique",
      image: "/assets/picto/ceramique/ceramique.png",
      width: 180,
      height: 140,
    },
  ] as const;

  return (
    <main>
      <PageHero
        title="L'atelier"
        lead="Un atelier partagé et multidisciplinaire au cœur de Marseille : espace, machines, outils et compétences pour faire de vos mains."
        image={P.atelierFrame}
      >
        <PrimaryCta href={h("/contact")}>Réserver une visite</PrimaryCta>
      </PageHero>

      <section className="border-b border-black/10 px-5 py-6">
        <WordStrip />
      </section>

      <section
        id="concept"
        className="mx-auto max-w-[990px] scroll-mt-28 px-5 py-14 text-center"
      >
        <h2 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-[#f56800] md:text-[40px]">
          Qu&apos;est-ce que Manufacto&nbsp;?
        </h2>
        <div className="mx-auto mt-8 max-w-[640px] space-y-8 text-xl leading-normal text-black/75">
          <p>
            Manufacto est né d&apos;une envie&nbsp;: proposer un{" "}
            <strong>lieu accessible</strong> à des{" "}
            <strong>particuliers et amateurs, amatrices</strong> qui voudraient
            travailler le bois, le textile ou la terre dans un espace adapté et
            avec des machines de qualité.
          </p>
          <p>
            Situé au cœur du 5ème arrondissement, l&apos;atelier rassemble
            plusieurs espaces de pratique&nbsp;: menuiserie, couture et
            céramique.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1274px] px-5 pb-16">
        <h2 className="text-center text-[28px] font-bold leading-tight tracking-[-0.02em] text-[#f56800] md:text-[40px]">
          Un atelier, trois univers
        </h2>
        <div className="mt-8 grid grid-cols-3 gap-4 md:mt-10 md:gap-10">
          {universes.map((universe) => (
            <div key={universe.label} className="text-center">
              <div className="flex h-[100px] items-center justify-center p-2 md:h-[156px] md:p-4">
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

        <div className="mt-12 grid gap-10 md:grid-cols-[1fr_minmax(0,430px)] md:items-start md:gap-14">
          <div>
            <div className="max-w-[720px] space-y-6 text-xl leading-normal text-black/75">
              <p>
                Manufacto est organisé autour de trois univers techniques et
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
                En complément de ces temps de <strong>pratique libre</strong>,
                nous vous proposons également des{" "}
                <strong>cours ponctuels</strong> pour débloquer de nouvelles
                compétences.
              </p>
              <p>
                L&apos;objectif&nbsp;: se faire plaisir en donnant vie à ses
                projets,{" "}
                <strong>
                  quel que soit votre niveau, vos besoins et vos envies.
                </strong>
              </p>
            </div>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-10 sm:gap-y-3">
              <Link
                href={h("/pratique-libre")}
                className="text-xl font-semibold text-[#4a56dd] underline underline-offset-2 md:text-2xl"
              >
                Découvrez la pratique libre
              </Link>
              <Link
                href="/cours"
                className="text-xl font-semibold text-[#20b75a] underline underline-offset-2 md:text-2xl"
              >
                Découvrez nos cours
              </Link>
            </div>
          </div>
          <ImageTile
            src={P.atelierVector}
            alt="Chaise en bois en cours de fabrication"
            className="h-[320px] md:h-[380px]"
          />
        </div>
      </section>

      <section id="horaires" className="scroll-mt-28 bg-[#fff8f0]">
        <div className="mx-auto grid max-w-[1274px] gap-10 px-5 py-14 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-start md:gap-16">
          <div>
            <h2 className="text-[30px] font-semibold text-black/80 md:text-[34px]">
              Horaires
            </h2>
            <p className="mt-4 max-w-md text-lg leading-normal text-black/65">
              L&apos;atelier est ouvert du mardi au samedi. Fermé le dimanche,
              le lundi, et tous les derniers samedis du mois.
            </p>
            <p className="mt-6 max-w-md text-base text-black/60">
              Les tarifs fonctionnent avec un système de crédits (valables un
              an).{" "}
              <Link href="/atelier#tarifs" className="font-semibold text-[#4a56dd] underline">
                Voir les tarifs
              </Link>
              {" · "}
              <Link href={h("/pratique-libre")} className="font-semibold text-[#4a56dd] underline">
                Pratique libre
              </Link>
            </p>
          </div>

          <div className="overflow-hidden rounded-[19px] border border-black/10 bg-white shadow-sm ring-1 ring-black/5">
            <ul className="divide-y divide-black/8">
              {[
                { day: "Lundi", hours: "Fermé", closed: true },
                { day: "Mardi", hours: "13h – 20h" },
                { day: "Mercredi", hours: "9h – 21h" },
                { day: "Jeudi", hours: "13h – 21h" },
                { day: "Vendredi", hours: "9h – 16h" },
                { day: "Samedi", hours: "9h – 12h · 13h – 17h", note: true },
                { day: "Dimanche", hours: "Fermé", closed: true },
              ].map((row) => (
                <li
                  key={row.day}
                  className={`flex items-baseline justify-between gap-6 px-5 py-3.5 md:px-6 md:py-4 ${
                    row.closed ? "bg-black/[0.02]" : ""
                  }`}
                >
                  <span
                    className={`text-base font-semibold md:text-lg ${
                      row.closed ? "text-black/40" : "text-[#f56800]"
                    }`}
                  >
                    {row.day}
                    {"note" in row && row.note ? (
                      <span className="text-[#f56800]">*</span>
                    ) : null}
                  </span>
                  <span
                    className={`text-right text-base tabular-nums md:text-lg ${
                      row.closed ? "text-black/35" : "text-black/75"
                    }`}
                  >
                    {row.hours}
                  </span>
                </li>
              ))}
            </ul>
            <p className="border-t border-black/8 bg-[#fff8f0]/80 px-5 py-3 text-xs leading-snug text-black/55 md:px-6">
              * Fermé tous les derniers samedis du mois.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1274px] px-5 py-14">
        <PhotoRibbon images={[...RIBBON_LIEU]} />
      </section>
    </main>
  );
}

const COURSES = [
  {
    title: "Fabriquer un tabouret en bois",
    blurb: "De la découpe à l’assemblage, repartez avec un objet fini.",
    image: P.tabouret12,
    tint: "#fff3e8",
    accent: "#f56800",
  },
  {
    title: "Découverte des machines stationnaires",
    blurb: "Apprenez à utiliser en sécurité les grandes machines de l’atelier.",
    image: P.machines2,
    tint: "#fff8f0",
    accent: "#f56800",
  },
  {
    title: "Initiation aux assemblages traditionnels",
    blurb: "Tenons, mortaises et assemblages solides — les bases du métier.",
    image: P.assemblages1,
    tint: "#f0f1ff",
    accent: "#4a56dd",
  },
  {
    title: "Maîtriser l’outillage portatif de base",
    blurb: "Les gestes essentiels pour démarrer en menuiserie en confiance.",
    image: P.outillage4,
    tint: "#e8faee",
    accent: "#20b75a",
  },
  {
    title: "Fabriquer son porte-clés & les scies",
    blurb: "Un petit objet pour apprendre les différents types de scie.",
    image: P.portecles5,
    tint: "#fff3e8",
    accent: "#f56800",
  },
  {
    title: "Initiation au travail du bois",
    blurb: "Fabrication d’un objet du quotidien, tous niveaux bienvenus.",
    image: P.boisMain,
    tint: "#fdebef",
    accent: "#d73459",
  },
] as const;

export function MockupCoursPage({ scope = "site" }: { scope?: SiteScope } = {}) {
  const h = (path: string) => scopeHref(scope, path);
  return (
    <main>
      <PageHero
        title="Cours ponctuels"
        lead="Apprenez à utiliser une machine, fabriquer un objet ou vous perfectionner. Débutant·e ou plus avancé·e : il y a une session pour vous."
        image={P.cours}
      >
        <PrimaryCta href={h("/offrir")}>Offrir un cours</PrimaryCta>
      </PageHero>

      <section className="mx-auto max-w-[1274px] px-5 py-14">
        <h2 className="mb-8 text-[30px] font-semibold text-black/80">
          Notre catalogue
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {COURSES.map((course) => (
            <article
              key={course.title}
              className="flex flex-col overflow-hidden rounded-[19px] border border-black/8"
              style={{ backgroundColor: course.tint }}
            >
              <div className="relative h-48">
                <Image src={course.image} alt={course.title} fill className="object-cover" sizes="400px" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-xl font-bold text-black/90">{course.title}</h3>
                <p className="mt-2 text-base text-black/65">{course.blurb}</p>
                <div className="mt-auto flex flex-col gap-2 pt-6">
                  <Link
                    href="/cours"
                    className="text-lg font-semibold underline underline-offset-2"
                    style={{ color: course.accent }}
                  >
                    Voir le cours →
                  </Link>
                  <Link href={h("/offrir")} className="text-base text-black/55 underline underline-offset-2">
                    Offrir ce cours
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-10 text-lg text-black/65">
          Les dates et inscriptions se gèrent sur la page cours du site.{" "}
          <Link href="/cours" className="font-semibold text-[#4a56dd] underline">
            Ouvrir le calendrier live →
          </Link>
        </p>
      </section>
    </main>
  );
}

export function MockupPratiquePage({
  scope = "site",
  afterHero,
  heroSecondary,
}: {
  scope?: SiteScope;
  afterHero?: React.ReactNode;
  /** Replaces the default “Première visite” secondary CTA (e.g. pack découverte modal). */
  heroSecondary?: React.ReactNode;
} = {}) {
  const h = (path: string) => scopeHref(scope, path);

  const disciplines = [
    {
      id: "menuiserie",
      label: "Menuiserie",
      color: "#f56800",
      tint: "#fff3e8",
      word: P.wordMenuiserie,
      wordW: 496,
      wordH: 90,
      wordClassName: "h-9 w-auto object-contain object-left sm:h-11 md:h-14",
      expertKind: "menuiserie" as const,
      intro:
        "Espace machines stationnaires et outillage à main. Venez avec des chaussures fermées. Les consommables de base (papier à poncer, vis…) sont vendus sur place si besoin.",
      offers: [
        {
          title: "Aide à la conception",
          rate: "4 crédits / h",
          summary:
            "Une heure avec un professionnel pour peaufiner plans, assemblages et fiches de débit avant de passer à la réalisation.",
          detail:
            "Si vous débutez, une ou plusieurs séances de préparation aident à réussir le projet dès les premières étapes. Contact : contact@manufacto-marseille.fr",
        },
        {
          title: "Autonomie complète",
          rate: "2 crédits / h",
          summary:
            "Pour la phase de réalisation, quand vous vous sentez autonome. Pas d’encadrant technique dédié sur place.",
          detail:
            "Vous jugez de votre niveau par rapport à l’objectif. Vous pouvez alterner autonomie complète et encadrée selon les étapes. Chaussures fermées obligatoires.",
        },
        {
          title: "Autonomie encadrée",
          rate: "3 crédits / h",
          summary:
            "Un encadrant technique est présent et peut vous conseiller — sans faire le projet à votre place ni former aux machines.",
          detail:
            "Ces créneaux ne remplacent pas un cours : on vous oriente, on ne forme pas machine par machine. Si vous n’avez jamais utilisé les machines, commencez par un cours du catalogue. Chaussures fermées obligatoires.",
        },
      ],
    },
    {
      id: "couture",
      label: "Couture",
      color: "#4a56dd",
      tint: "#f0f1ff",
      word: P.wordCouture,
      wordW: 279,
      wordH: 63,
      wordClassName: "h-9 w-auto object-contain object-left sm:h-11 md:h-14",
      expertKind: "couture" as const,
      intro:
        "Tables de travail et de coupe, piqueuses industrielles, machines familiales et surjeteuse. Apportez de préférence votre tissu et ce dont vous aurez besoin.",
      offers: [
        {
          title: "Autonomie complète",
          rate: "1 crédit / h",
          summary:
            "Réalisez vos projets dès que vous vous sentez autonome, sans encadrant technique dédié.",
          detail:
            "L’autonomie n’est pas un statut figé : vous pouvez réserver de l’encadré une autre fois selon le projet.",
        },
        {
          title: "Autonomie encadrée",
          rate: "2 crédits / h",
          summary:
            "Une personne de référence est présente pour vous conseiller sur la technique et l’organisation du projet.",
          detail:
            "Prérequis : savoir installer le fil et recharger une canette. Sinon, suivez d’abord le cours d’initiation machine à coudre.",
        },
      ],
    },
    {
      id: "ceramique",
      label: "Céramique",
      color: "#d73459",
      tint: "#fff0f3",
      word: P.wordCeramique,
      wordW: 428,
      wordH: 130,
      wordClassName: "h-12 w-auto object-contain object-left sm:h-14 md:h-[4.25rem]",
      expertKind: "ceramique" as const,
      intro:
        "Tables de travail et tours. La cuisson est incluse pour les pièces réalisées à l’atelier.",
      offers: [
        {
          title: "Autonomie complète",
          rate: "2 crédits / h",
          summary:
            "Travaillez en autonomie sur vos pièces, sans encadrante technique dédiée.",
          detail:
            "Vous jugez de votre niveau par rapport à l’objectif ; vous pouvez mixer autonomie et encadré selon les phases.",
        },
        {
          title: "Autonomie encadrée",
          rate: "3 crédits / h",
          summary:
            "Une encadrante est présente pour répondre à vos questions et vous conseiller sur les étapes du projet.",
          detail:
            "Ces créneaux ne remplacent pas un cours d’initiation : on vous oriente, on ne fait pas la pièce à votre place.",
        },
        {
          title: "Cuisson hors atelier",
          rate: "60€ / four",
          summary:
            "Cuisez des pièces réalisées hors de Manufacto (grès uniquement, four complet).",
          detail: null,
          expertCuisson: true,
        },
      ],
    },
  ] as const;

  return (
    <main>
      <PageHero
        title="Pratique libre"
        lead="Travaillez sur vos projets en menuiserie, couture ou céramique — en autonomie ou encadré·e. Vous réservez des créneaux, débités en crédits sur votre compte."
        image={P.pratiqueLibre}
      >
        <PrimaryCta href="/account?tab=credits">Acheter des crédits</PrimaryCta>
        {heroSecondary ?? (
          <SecondaryCta href={h("/contact")}>Première visite</SecondaryCta>
        )}
      </PageHero>

      {afterHero}

      <section className="border-y border-black/10 bg-white">
        <div className="mx-auto max-w-[1274px] space-y-16 px-5 py-14">
          <div>
            <h2 className="text-[30px] font-semibold text-black/80">
              Les offres par discipline
            </h2>
            <p className="mt-3 max-w-3xl text-lg text-black/65">
              Autonomie complète ou encadrée selon votre besoin. Les créneaux
              encadrés ne remplacent pas un cours : pour apprendre une machine
              ou une technique,{" "}
              <Link href={h("/cours")} className="font-semibold text-[#4a56dd] underline">
                voyez le catalogue de cours
              </Link>
              .
            </p>
          </div>

          {disciplines.map((d) => (
            <div key={d.id} id={d.id} className="scroll-mt-28">
              <div className="max-w-3xl">
                <Image
                  src={d.word}
                  alt={d.label}
                  width={d.wordW}
                  height={d.wordH}
                  className={d.wordClassName}
                />
                <p className="mt-5 text-lg leading-relaxed text-black/75">
                  {d.intro}
                </p>
                <ExpertEquipmentDetails kind={d.expertKind} accent={d.color} />
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {d.offers.map((offer) => (
                  <article
                    key={offer.title}
                    className="flex flex-col rounded-[19px] border border-black/8 p-6"
                    style={{ backgroundColor: d.tint }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-xl font-bold text-black/90">{offer.title}</h4>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ color: d.color, backgroundColor: "white" }}
                      >
                        {offer.rate}
                      </span>
                    </div>
                    <p className="mt-3 text-base leading-snug text-black/70">
                      {offer.summary}
                    </p>
                    {"expertCuisson" in offer && offer.expertCuisson ? (
                      <ExpertEquipmentDetails kind="cuisson" accent={d.color} />
                    ) : offer.detail ? (
                      <details className="group mt-4">
                        <summary
                          className="cursor-pointer list-none text-sm font-semibold underline underline-offset-2"
                          style={{ color: d.color }}
                        >
                          <span className="group-open:hidden">En savoir plus</span>
                          <span className="hidden group-open:inline">Réduire</span>
                        </summary>
                        <p className="mt-3 text-sm leading-relaxed text-black/65">
                          {offer.detail}
                        </p>
                      </details>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1274px] px-5 py-14">
        <PhotoRibbon images={[...RIBBON_PORTRAITS, ...RIBBON_LIEU].slice(0, 12)} />
      </section>
    </main>
  );
}

export function MockupOffrirPage({ scope = "site" }: { scope?: SiteScope } = {}) {
  const h = (path: string) => scopeHref(scope, path);
  return (
    <main>
      <PageHero
        title="Offrir Manufacto"
        lead="Carte cadeau, cours ponctuel ou pack de crédits : faites découvrir l’atelier à quelqu’un que vous aimez. Les crédits sont valables un an."
        image={P.tabouret12}
      >
        {scope === "site" ? (
          <PrimaryCta href="/offrir">Offrir un cours</PrimaryCta>
        ) : (
          <PrimaryCta href={h("/cours")}>Offrir un cours</PrimaryCta>
        )}
        <SecondaryCta href={scope === "site" ? "/offrir" : h("/offrir")}>
          Offrir des crédits
        </SecondaryCta>
      </PageHero>

      <section className="mx-auto max-w-[1274px] px-5 py-14">
        <h2 className="text-[30px] font-semibold text-black/80">
          Deux façons d&apos;offrir
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <article className="flex flex-col rounded-[19px] border border-black/10 bg-[#fff3e8] p-8">
            <h3 className="text-2xl font-bold text-[#f56800]">Un cours ponctuel</h3>
            <p className="mt-4 flex-1 text-lg text-black/75">
              Idéal pour découvrir une pratique ou monter en compétence. Choisissez
              une catégorie de tarif, réglez en ligne, et la personne reçoit un code
              pour réserver.
            </p>
          </article>
          <article className="flex flex-col rounded-[19px] border border-black/10 bg-[#f0f1ff] p-8">
            <h3 className="text-2xl font-bold text-[#4a56dd]">Un pack de crédits</h3>
            <p className="mt-4 flex-1 text-lg text-black/75">
              Pour la pratique libre : la personne charge un pass, visite
              l&apos;atelier, puis réserve ses créneaux. Tarifs dégressifs,
              crédits valables un an.
            </p>
          </article>
        </div>
      </section>

      <section className="bg-[#fff8f0]">
        <div className="mx-auto flex max-w-[1274px] flex-col gap-6 px-5 py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[28px] font-bold text-black/90">Besoin d&apos;aide pour choisir ?</h2>
            <p className="mt-2 max-w-xl text-lg text-black/70">
              Passez nous voir pendant les heures d&apos;ouverture, ou réservez
              une visite le mardi soir — on vous oriente.
            </p>
          </div>
          <PrimaryCta href={h("/contact")}>Réserver une visite</PrimaryCta>
        </div>
      </section>
    </main>
  );
}

export function MockupContactPage({ scope = "site" }: { scope?: SiteScope } = {}) {
  return (
    <main>
      <PageHero
        title="Contact & visite"
        lead="Tous les mardis de 18h30 à 19h, Martin, Nafissa, Cyprien et Delphine vous présentent le lieu. C’est gratuit, sur inscription."
        image={P.atelierPeople}
      >
        <PrimaryCta href="/reserver">Réserver une visite</PrimaryCta>
      </PageHero>

      <section className="mx-auto max-w-[1274px] px-5 py-14">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-[30px] font-semibold text-black/80">Nous trouver</h2>
            <p className="mt-5 text-xl text-black/75">8 rue de Locarno</p>
            <p className="text-xl text-black/75">13005 Marseille</p>
            <p className="mt-6 text-xl">
              <a href="mailto:contact@manufacto-marseille.fr" className="text-[#4a56dd] underline">
                contact@manufacto-marseille.fr
              </a>
            </p>
            <p className="mt-2 text-xl">
              <a href="tel:+33743461214" className="text-[#4a56dd] underline">
                07 43 46 12 14
              </a>
            </p>
          </div>
          <div className="overflow-hidden rounded-[19px] border border-black/10 bg-[#d9d9d9]">
            <iframe
              title="Manufacto — 8 rue de Locarno, Marseille"
              src="https://www.google.com/maps?q=8%20rue%20de%20Locarno%2C%2013005%20Marseille&output=embed"
              className="h-72 w-full border-0 md:h-full md:min-h-[320px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    </main>
  );
}
