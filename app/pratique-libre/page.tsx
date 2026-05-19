import Image from "next/image";
import { Suspense, type ReactNode } from "react";
import { unstable_noStore } from "next/cache";
import {
  AtelierCreditPackGrid,
  AtelierSubscriptionList,
} from "@/components/atelier-tarifs-purchases";
import {
  MarketingPageContainer,
  MarketingPageHeader,
  MarketingSectionTitle,
} from "@/components/marketing";
import { CuissonOfferDetail } from "@/components/cuisson-offer-detail";
import { OfferCardTabs } from "@/components/offer-card-tabs";
import { DiscoveryPackReservationButton } from "@/components/discovery-pack-reservation-button";
import { DetailsHashOpener } from "@/components/details-hash-opener";
import {
  formatPracticeScheduleFromSessions,
  stripPracticeScheduleFromDetail,
} from "@/lib/format-practice-schedule";
import { createClient } from "@/lib/supabase/server";

const PRACTICE_ACTIVITY_NAMES = [
  "Menuiserie en autonomie",
  "Menuiserie en autonomie encadrée",
  "Accompagnement projet menuiserie",
  "Couture en autonomie",
  "Couture en autonomie encadrée",
  "Céramique en autonomie",
  "Cuisson céramique",
  "Électronique en autonomie",
  "Repair Café",
] as const;

type PracticeActivityName = (typeof PRACTICE_ACTIVITY_NAMES)[number];

type PracticeOfferInput = {
  title: string;
  summary: string;
  activityName: PracticeActivityName;
  detail?: string | ReactNode;
  image?: string;
  detailImage?: string;
  /** When false, no online reservation link is shown (e.g. cuisson). */
  reservable?: boolean;
};

const stepCards = [
  {
    number: "1.",
    title: "Créez un compte que vous chargez",
    text: " avec le nombre de crédits de votre choix.",
  },
  {
    number: "2.",
    title: "Avant votre première venue, nous vous enverrons un lien pour vous inscrire à une visite détaillée",
    text: " de l’atelier. Elle sera l’occasion de se rencontrer, de vous faire faire le tour des lieux et de vous expliquer comment l’atelier fonctionne.",
  },
  {
    number: "3.",
    title: "Réservez vos prochains créneaux / cours.",
    text: " Vous serez débité du nombre de crédits correspondant, le solde reste disponible pour une prochaine fois, sur votre espace en ligne.",
  },
];

const disciplineRows = [
  ["menuiserie", "text-[#f56800]", "menuiserie"],
  ["couture", "text-[#4a56dd]", "couture"],
  ["céramique", "text-[#d73459]", "ceramique"],
  ["électronique", "text-[#20b75a]", "electronique"],
];

const menuiserieOffers: PracticeOfferInput[] = [
  {
    title: "Aide à la conception",
    activityName: "Accompagnement projet menuiserie",
    summary:
      "Ce créneau d’une heure permet d’être accompagné par un professionnel dans la phase de conception du projet.",
    detail:
      "En menuiserie, la phase de conception est une étape essentielle du projet. Réfléchir à ses plans, à ses assemblages, préparer ses fiches de débit, sont des étapes fondamentales avant de s’engager dans un projet, et permettent de se donner toutes les chances de réussir à le mener à bien.\nLes créneaux de préparation au projet sont des créneaux dédiés à cette réflexion, accompagnés d’un professionnel. Nous vous accompagnons pour réfléchir à votre projet, échanger sur ses orientations, commenter vos plans et vérifier qu’ils correspondent bien à vos ambitions et à vos compétences.\n\nBien préparer son projet en amont, c’est gagner beaucoup de temps une fois que vous commencerez à lui donner vie.\nSi vous débutez, nous vous invitons vivement à prendre quelques séances de préparation au projet pour apprendre à mener à bien un projet de menuiserie, dès les premières étapes.\n\nTarif :\n4 crédits / heure.\n\nCréneaux disponibles :\nmardi de 17h à 18h\nmercredi, de 17h à 19h",
    image: "/assets/pratique libre/Frame 29.jpg",
    detailImage: "/assets/pratique libre/Frame 19.jpg",
  },
  {
    title: "Autonomie complète",
    activityName: "Menuiserie en autonomie",
    summary:
      "Des créneaux à réserver dès que vous passez à la phase de réalisation de votre projet, et que vous vous sentez autonome pour le mener à bien.",
    detail:
      "Chez manufacto, nous partons du principe que chacun est apte à juger de sa capacité à mener à bien son projet. L’autonomie complète s’adresse à celles et ceux qui cherchent un espace où pratiquer sans avoir besoin de la présence d’un encadrant technique mobilisable. Sur ces créneaux, il n’y a pas de professionnel dédié à l’accompagnement au projet dans les espaces établis.\n\nL’autonomie n’est pas un statut en soi : vous pouvez tout à fait alterner des créneaux d’autonomie encadrée avec des créneaux d’autonomie complète, selon les phases de votre projet. C’est à vous de juger de vos compétences par rapport à un objectif donné.\n\nTarif :\n2 crédits / heure.\n\nCréneaux disponibles :\nmardi, de 13h à 20h\nmercredi, de 9h à 13h et de 17h à 21h\njeudi, de 13h à 17h,\nvendredi, de 9h à 17h,\nsamedi*, de 13h à 17h, et parfois le matin (selon calendrier)\nnous sommes fermés les derniers samedi du mois.",
    image: "/assets/pratique libre/Frame 34.jpg",
    detailImage: "/assets/pratique libre/Frame 21.jpg",
  },
  {
    title: "Autonomie encadrée",
    activityName: "Menuiserie en autonomie encadrée",
    summary:
      "Des créneaux à réserver pour donner vie à votre projet, tout en ayant un encadrant technique de référence que vous pourrez mobiliser si nécessaire.",
    detail:
      "A la différence de l’autonomie complète, lors des créneaux d’autonomie encadrée, un encadrant technique est présent dans l’espace établi, et peut répondre à vos questions si besoin est. Cette personne de référence peut-être mobilisée pour vous conseiller sur certaines étapes de votre projet, vous donner un regard sur la manière dont vous envisagez de le réaliser, vous conseiller sur l’utilisation de certaines machines.\nEn revanche, ces créneaux n’ont pas vocation à vous apprendre à utiliser des machines spécifiques, ni à faire votre projet à votre place. Si vous voulez apprendre à utiliser de nouveaux outils, réservez plutôt le cours de montée en compétences correspondant.\n\nTarif :\n3 crédits / heure.\n\nCréneaux disponibles :\nmardi, de 18h à 20h\nmercredi, de 19h à 21h",
    image: "/assets/pratique libre/Frame 30.jpg",
    detailImage: "/assets/pratique libre/Frame 20.jpg",
  },
];

const coutureOffers: PracticeOfferInput[] = [
  {
    title: "Autonomie complète",
    activityName: "Couture en autonomie",
    summary:
      "Des créneaux à réserver pour réaliser vos projets, dès que vous vous sentez autonome pour le mener à bien.",
    detail:
      "Chez manufacto, nous partons du principe que chacun est apte à juger de sa capacité à mener à bien son projet. L’autonomie complète s’adresse à celles et ceux qui cherchent un espace où pratiquer sans avoir besoin de la présence d’un encadrant technique mobilisable. Sur ces créneaux, il n’y a pas de professionnel dédié à l’accompagnement au projet.\nL’autonomie complète n’est pas un statut en soi : vous pouvez tout à fait réserver des créneaux en autonomie complète sur certains projets, ou étapes de votre projet, et préférer l’autonomie encadrée une prochaine fois. C’est à vous de juger de vos compétences par rapport à un objectif donné.\n\nTarif :\n1 crédits / heure.\n\nCréneaux disponibles :\nmardi, de 13h à 20h\nmercredi, de 17h à 21h\njeudi, de 13h à 21h\nvendredi, de 9h à 17h\nsamedi, de 9h à 12h et de 13h à 17h",
    image: "/assets/pratique libre/Frame 31.jpg",
    detailImage: "/assets/pratique libre/Frame 22.jpg",
  },
  {
    title: "Autonomie encadrée",
    activityName: "Couture en autonomie encadrée",
    summary:
      "Des créneaux à réserver pour donner vie à votre projet, tout en ayant un encadrant technique de référence que vous pourrez mobiliser si nécessaire.",
    detail:
      "A la différence de l’autonomie complète, lors des créneaux d’autonomie encadrée, un encadrant ou une encadrante est présente dans l’espace couture, et peut répondre à vos questions si besoin est. Cette personne de référence peut-être mobilisée pour vous conseiller sur certaines étapes de votre projet, vous donner un regard critique sur la manière dont vous envisagez de le réaliser, vous conseiller sur l’utilisation de certaines techniques.\nCes créneaux n’ont pas vocation, en revanche, à vous apprendre à utiliser des machines spécifiques, ni à faire votre projet à votre place.\n\nTarif :\n2 crédits / heure.\n\nCréneaux disponibles :\nmardi, de 18h à 20h\nmercredi, de 9h à 12h\njeudi, de 19h à 21h",
    image: "/assets/pratique libre/Vector.jpg",
    detailImage: "/assets/pratique libre/Frame 23.jpg",
  },
];

const ceramiqueOffers: PracticeOfferInput[] = [
  {
    title: "Autonomie complète",
    activityName: "Céramique en autonomie",
    summary:
      "Des créneaux à réserver pour donner vie à vos projets, de manière autonome.",
    detail:
      "Chez manufacto, nous partons du principe que chacun est apte à juger de sa capacité à mener à bien son projet. En céramique, nous ne proposons que des créneaux d’autonomie complète, qui s’adressent à celles et ceux qui cherchent un espace où pratiquer sans avoir besoin de la présence d’un encadrant technique.\nL’équipe de manufacto est toujours présente dans les locaux, mais sur ces créneaux, il n’y a pas de professionnel dédié à l’accompagnement au projet.\nLa cuisson est incluse dans le tarif pour les pièces qui seront réalisées à l’atelier.\n\nTarif :\n2 crédits / heure.\n\nCréneaux disponibles :\nmardi, de 13h à 20h\nmercredi, de 9h à 21h\njeudi, de 13h à 21h\nvendredi, de 9h à 17h\nsamedi, de 9h à 12h et de 13h à 17h",
    image: "/assets/pratique libre/Frame 32.jpg",
    detailImage: "/assets/pratique libre/Frame 25.jpg",
  },
  {
    title: "Cuisson",
    activityName: "Cuisson céramique",
    reservable: false,
    summary:
      "Cuisez les pièces que vous avez réalisées hors de l’atelier.\n\nLes cuissons sont incluses pour les pièces ayant été réalisées chez nous.",
    detail: <CuissonOfferDetail />,
    image: "/assets/pratique libre/Frame 36.jpg",
    detailImage: "/assets/pratique libre/Frame 26.jpg",
  },
];

const electroniqueOffers: PracticeOfferInput[] = [
  {
    title: "Autonomie complète",
    activityName: "Électronique en autonomie",
    summary:
      "Des créneaux à réserver pour donner vie à vos projets, de manière autonome.",
    detail:
      "Chez manufacto, nous partons du principe que chacun est apte à juger de sa capacité à mener à bien son projet. En électronique, nous ne proposons que des créneaux d’autonomie complète, qui s’adressent à celles et ceux qui cherchent un espace où pratiquer sans avoir besoin de la présence d’un encadrant technique.\nL’équipe de manufacto est toujours présente dans les locaux, mais sur ces créneaux, il n’y a pas de professionnel dédié à l’accompagnement au projet. Vous aurez accès à l’espace et aux outils nécessaires pour réparer ou fabriquer de petits objets électriques / électroniques.\n\nTarif :\n1 crédits / heure.\n\nCréneaux disponibles :\nmardi, de 13h à 20h\nmercredi, de 17h à 21h\njeudi, de 13h à 21h\nvendredi, de 9h à 17h\nsamedi, de 9h à 12h et de 13h à 17h",
    image: "/assets/pratique libre/Frame 35.jpg",
    detailImage: "/assets/pratique libre/Frame 28.jpg",
  },
  {
    title: "Repair Café",
    activityName: "Repair Café",
    summary:
      "Des créneaux collectifs pour vous aider à réparer vos petits objets ménagers.",
    detail:
      "Les Repair Café, ce sont des moments conviviaux et collectifs pour apprendre à réparer ensemble. Vous venez avec un objet abîmé, et vous apprendrez, épaulé par nos bénévoles, à le réparer et à lui donner une deuxième vie.\n\nTarif :\nprix libre. Une adhésion à l’association vous sera demandée sur place.\n\nCréneaux disponibles :\ndates à ajouter",
    image: "/assets/pratique libre/Frame 33.jpg",
    detailImage: "/assets/pratique libre/Frame 27.jpg",
  },
];

const discoveryPacks = [
  {
    discipline: "couture",
    title: "Pack découverte couture",
    price: "15€",
    line1: "2h de couture en",
    line2: "autonomie encadrée",
    borderClass: "border-[#4a56dd]/70",
    cardClass: "bg-[#f0f1ff]",
    priceClass: "text-[#4a56dd]",
    linkClass: "text-[#4a56dd]",
  },
  {
    discipline: "menuiserie",
    title: "Pack découverte menuiserie",
    price: "30€",
    line1: "2h de menuiserie en",
    line2: "autonomie encadrée",
    borderClass: "border-[#f56800]/70",
    cardClass: "bg-[#fff3e8]",
    priceClass: "text-[#f56800]",
    linkClass: "text-[#f56800]",
  },
] satisfies {
  discipline: "couture" | "menuiserie";
  title: string;
  price: string;
  line1: string;
  line2: string;
  borderClass: string;
  cardClass: string;
  priceClass: string;
  linkClass: string;
}[];

const ASSETS = {
  starGreen: "/assets/stars/star_verte.png",
  starRed: "/assets/stars/star_rouge.png",
  starYellow: "/assets/stars/star_jaune.png",
  arrow: "/assets/fleches/orange/arrow_up_top_right.png",
  menuiserie: "/assets/pratique libre/Rectangle 11.jpg",
  couture: "/assets/pratique libre/Rectangle 12.jpg",
  ceramique: "/assets/pratique libre/Rectangle 15.jpg",
  electronique: "/assets/pratique libre/Rectangle 16.jpg",
} as const;

function InfoSection({
  title,
  star,
  children,
}: {
  title: string;
  star: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative border-t border-black/45 py-7">
      <Image
        src={star}
        alt=""
        width={100}
        height={100}
        className="absolute -right-6 top-3 h-20 w-20 object-contain"
        aria-hidden
      />
      <h3 className="mb-5 text-xl font-bold leading-tight text-black">
        {title}
      </h3>
      <div className="max-w-[1130px] space-y-4 pr-20 text-base leading-normal text-black/75">
        {children}
      </div>
    </section>
  );
}

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
    <div className={`relative overflow-hidden bg-[#d9d9d9] ${className}`}>
      <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 520px" />
    </div>
  );
}

function AccordionChevron({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-8 w-8 shrink-0 items-center justify-center text-black/55 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6 transition-transform group-open:rotate-180"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}

async function PratiqueLibreContent() {
  unstable_noStore();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: practiceActivities, error } = await supabase
    .from("activity")
    .select("id, name, nb_credits")
    .in("name", PRACTICE_ACTIVITY_NAMES)
    .is("deleted_at", null);

  if (error) {
    console.error("Error fetching practice activities", error);
  }

  const { data: discoveryPackActivities, error: discoveryPackError } = await supabase
    .from("activity")
    .select("id, discipline, square_product_id")
    .eq("type", "pack_decouverte")
    .in(
      "discipline",
      discoveryPacks.map((pack) => pack.discipline),
    )
    .is("deleted_at", null);

  if (discoveryPackError) {
    console.error("Error fetching discovery pack activities", discoveryPackError);
  }

  const activities = practiceActivities ?? [];

  const activityIdsByName = new Map<PracticeActivityName, string>(
    activities
      ?.filter((activity) =>
        PRACTICE_ACTIVITY_NAMES.includes(activity.name as PracticeActivityName),
      )
      .map((activity) => [
        activity.name as PracticeActivityName,
        activity.id,
      ]) ?? [],
  );
  const discoveryActivityIdsByDiscipline = new Map(
    (discoveryPackActivities ?? []).map((activity) => [
      activity.discipline,
      activity,
    ]),
  );

  const activityIds = [...activityIdsByName.values()];
  const sessionsByActivityId = new Map<
    string,
    { start_ts: string; end_ts: string }[]
  >();

  if (activityIds.length > 0) {
    const { data: sessions, error: sessionsError } = await supabase
      .from("session")
      .select("activity_id, start_ts, end_ts")
      .in("activity_id", activityIds)
      .gte("end_ts", new Date().toISOString())
      .order("start_ts", { ascending: true });

    if (sessionsError) {
      console.error("Error fetching practice sessions", sessionsError);
    }

    for (const session of sessions ?? []) {
      const existing = sessionsByActivityId.get(session.activity_id) ?? [];
      existing.push({
        start_ts: session.start_ts,
        end_ts: session.end_ts,
      });
      sessionsByActivityId.set(session.activity_id, existing);
    }
  }

  const withActivityIds = (offers: PracticeOfferInput[]) =>
    offers.map((offer) => {
      const activityId = activityIdsByName.get(offer.activityName);
      const activitySessions = activityId
        ? (sessionsByActivityId.get(activityId) ?? [])
        : [];

      const activity = activities?.find((row) => row.id === activityId);

      return {
        ...offer,
        detail:
          typeof offer.detail === "string"
            ? stripPracticeScheduleFromDetail(offer.detail)
            : offer.detail,
        activityId,
        activityCredits: activity?.nb_credits ?? null,
        reservable: offer.reservable !== false,
        schedule:
          offer.reservable === false
            ? null
            : formatPracticeScheduleFromSessions(activitySessions),
      };
    });

  return (
    <MarketingPageContainer className="pb-20 md:pb-[140px]">
      <DetailsHashOpener />
      <MarketingPageHeader title="la pratique libre" className="max-w-[1180px]">
        <p>
          Manufacto est un atelier partagé, ouvert à toutes et tous.
          <br />
          La pratique libre vous permet d&apos;avoir{" "}
          <strong>accès à un espace de travail selon votre besoin</strong>, et
          pour la durée que vous souhaitez (dans la limite de nos heures
          d&apos;ouvertures). Vous y êtes maître de votre projet pour le temps de
          votre réservation, et aurez{" "}
          <strong>accès aux machines et équipements de l&apos;atelier.</strong>
        </p>
        <p>
          Notre offre varie selon les univers techniques.
        </p>
      </MarketingPageHeader>

      <section className="relative right-1/2 left-1/2 -mr-[50vw] -ml-[50vw] mt-10 w-screen bg-[#fff8f0]">
        <div className="mx-auto max-w-[1274px] px-5 py-5 md:py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-6 md:max-w-[55%]">
              <h2 className="shrink-0 text-[30px] font-bold leading-none tracking-[-0.6px] text-[#f56800]">
                pack <br />
                découverte
              </h2>
              <div className="min-w-0">
                <p className="text-xl leading-normal text-black/75">
                  Une première venue pour tester l&apos;atelier.
                </p>
                <p className="mt-2 text-xs leading-tight text-black/65">
                  limitée à un achat par personne
                </p>
              </div>
            </div>
            <div className="grid w-full max-w-[440px] shrink-0 grid-cols-2 gap-3 md:w-auto">
              {discoveryPacks.map((pack) => {
                const activity = discoveryActivityIdsByDiscipline.get(pack.discipline);
                const squareProductId = activity?.square_product_id ?? null;

                return (
                  <div
                    key={pack.discipline}
                    className={`flex flex-col items-center justify-center rounded-[14px] border px-4 py-3 text-center ${pack.borderClass} ${pack.cardClass}`}
                  >
                    <p className={`text-[34px] leading-none ${pack.priceClass}`}>
                      {pack.price}
                    </p>
                    <p className="mt-1 text-lg font-semibold leading-tight text-black/80">
                      {pack.line1}
                    </p>
                    <p className="text-lg leading-tight text-black/75">
                      {pack.line2}
                    </p>
                    {activity && squareProductId ? (
                      <DiscoveryPackReservationButton
                        activityId={activity.id}
                        activityTitle={pack.title}
                        squareProductId={squareProductId}
                        isLoggedIn={!!user}
                        label="Réserver"
                        className={`mt-2 text-lg font-semibold underline underline-offset-2 ${pack.linkClass}`}
                      />
                    ) : (
                      <p className="mt-2 text-xs text-black/60">
                        {activity ? "Produit Square manquant" : "Créneaux indisponibles"}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <div>
          {disciplineRows.map(([label, color, id]) => (
            <details
              key={label}
              id={id}
              className="group scroll-mt-28 border-b border-black/45"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-[30px] font-bold leading-tight [&::-webkit-details-marker]:hidden">
                <span className={color}>{label}</span>
                <AccordionChevron />
              </summary>
              {label === "menuiserie" ? (
                <div className="pb-10 pt-8">
                  <div className="grid gap-10 lg:grid-cols-[1fr_520px]">
                    <div>
                      <p className="max-w-[690px] text-xl leading-normal text-black/75">
                        L&apos;espace menuiserie est organisé autour de plusieurs
                        postes de travail et établis, que chacun peut réserver
                        pour la durée et l&apos;usage de son choix, ainsi que
                        d&apos;un espace réservé aux machines stationnaires.
                      </p>

                      <h3 className="mt-10 text-[28px] font-bold leading-tight text-black">
                        Outils &amp; machines à disposition :
                      </h3>
                      <div className="mt-6 grid max-w-[690px] gap-x-12 gap-y-1 text-xl leading-normal text-black/75 sm:grid-cols-2">
                        <ul className="list-disc space-y-1 pl-5">
                          <li>dégau / rabo</li>
                          <li>scie à format</li>
                          <li>scie à ruban</li>
                          <li>perceuse à colonne</li>
                          <li>mortaiseuse à bédane</li>
                          <li>tour à bois</li>
                          <li>défonceuse sous table</li>
                          <li>scie à onglet</li>
                        </ul>
                        <ul className="list-disc space-y-1 pl-5">
                          <li>défonceuses</li>
                          <li>affleureuses</li>
                          <li>perceuses &amp; visseuses</li>
                          <li>lamello</li>
                          <li>ponceuses (orbitales, à bandes)</li>
                          <li>outillage à main classique</li>
                        </ul>
                      </div>

                      <p className="mt-10 max-w-[690px] text-xl leading-normal text-black/75">
                        Nous vendons sur place les consommables de base si
                        nécessaire (papier à poncer, vis...) mais nous vous
                        recommandons fortement de venir avec ce dont vous aurez
                        besoin pour votre projet.
                      </p>
                    </div>

                    <ImageTile
                      src={ASSETS.menuiserie}
                      alt="Perçage d'une pièce de bois"
                      className="min-h-[560px] rounded-[18px]"
                    />
                  </div>

                  <section className="mt-10">
                    <h3 className="text-[28px] font-bold leading-tight text-black">
                      Notre offre :
                    </h3>
                    <OfferCardTabs
                      offers={withActivityIds(menuiserieOffers)}
                      columns={3}
                      isLoggedIn={!!user}
                    />
                  </section>
                </div>
              ) : null}
              {label === "couture" ? (
                <div className="pb-10 pt-8">
                  <div className="grid gap-10 lg:grid-cols-[1fr_520px]">
                    <div>
                      <p className="max-w-[690px] text-xl leading-normal text-black/75">
                        L&apos;espace couture est organisé autour de plusieurs
                        tables de travail et tables de coupe, que chacun peut
                        réserver pour la durée et l&apos;usage de son choix.
                      </p>

                      <h3 className="mt-10 text-[28px] font-bold leading-tight text-black">
                        Machines à disposition :
                      </h3>
                      <ul className="mt-6 max-w-[690px] list-disc space-y-1 pl-5 text-xl leading-normal text-black/75">
                        <li>piqueuse industrielle (PFAFF 463)</li>
                        <li>machines à coudre familiales</li>
                        <li>surjeteuse</li>
                      </ul>

                      <p className="mt-10 max-w-[690px] text-xl leading-normal text-black/75">
                        Nous vendons sur place les consommables de base si
                        nécessaire (fils, thermocollant...) mais nous vous
                        recommandons fortement de venir avec ce dont vous aurez
                        besoin pour votre projet.
                      </p>
                    </div>

                    <ImageTile
                      src={ASSETS.couture}
                      alt="Traçage sur tissu"
                      className="min-h-[560px] rounded-[18px]"
                    />
                  </div>

                  <section className="mt-10">
                    <h3 className="text-[28px] font-bold leading-tight text-black">
                      Notre offre :
                    </h3>
                    <OfferCardTabs
                      offers={withActivityIds(coutureOffers)}
                      columns={2}
                      isLoggedIn={!!user}
                    />
                  </section>
                </div>
              ) : null}
              {label === "céramique" ? (
                <div className="pb-10 pt-8">
                  <div className="grid gap-10 lg:grid-cols-[1fr_520px]">
                    <div>
                      <p className="max-w-[690px] text-xl leading-normal text-black/75">
                        L&apos;espace céramique est organisé autour de plusieurs
                        tables de travail et tours, que chacun peut réserver
                        pour la durée et l&apos;usage de son choix.
                      </p>

                      <h3 className="mt-10 text-[28px] font-bold leading-tight text-black">
                        Outils à disposition :
                      </h3>
                      <ul className="mt-6 max-w-[690px] list-disc space-y-1 pl-5 text-xl leading-normal text-black/75">
                        <li>
                          petit outillage à main (ébauchoirs, estèques,
                          rouleaux, mirettes, tournassins, poires à engobe,
                          etc.)
                        </li>
                        <li>
                          tables de travail pour le modelage et l’assemblage
                        </li>
                        <li>four</li>
                      </ul>
                    </div>

                    <ImageTile
                      src={ASSETS.ceramique}
                      alt="Blocs de terre pour la céramique"
                      className="min-h-[560px] rounded-[18px]"
                    />
                  </div>

                  <section className="mt-10">
                    <h3 className="text-[28px] font-bold leading-tight text-black">
                      Notre offre :
                    </h3>
                    <OfferCardTabs
                      offers={withActivityIds(ceramiqueOffers)}
                      columns={2}
                      isLoggedIn={!!user}
                    />
                  </section>
                </div>
              ) : null}
              {label === "électronique" ? (
                <div className="pb-10 pt-8">
                  <div className="grid gap-10 lg:grid-cols-[1fr_520px]">
                    <div>
                      <p className="max-w-[690px] text-xl leading-normal text-black/75">
                        L&apos;espace électronique est organisé autour de
                        plusieurs tables de travail, que chacun peut réserver
                        pour la durée et l&apos;usage de son choix.
                      </p>

                      <h3 className="mt-10 text-[28px] font-bold leading-tight text-black">
                        Outils à disposition :
                      </h3>
                      <ul className="mt-6 max-w-[690px] list-disc space-y-1 pl-5 text-xl leading-normal text-black/75">
                        <li>Caisse à outils de précisions</li>
                        <li>Fer à souder</li>
                        <li>Station à air chaud</li>
                        <li>Multimètre</li>
                        <li>
                          Consommables courants (gaine thermorétractable,
                          câble,…)
                        </li>
                      </ul>
                    </div>

                    <ImageTile
                      src={ASSETS.electronique}
                      alt="Réparation électronique sur carte"
                      className="min-h-[560px] rounded-[18px]"
                    />
                  </div>

                  <section className="mt-10">
                    <h3 className="text-[28px] font-bold leading-tight text-black">
                      Notre offre :
                    </h3>
                    <OfferCardTabs
                      offers={withActivityIds(electroniqueOffers)}
                      columns={2}
                      isLoggedIn={!!user}
                    />
                  </section>
                </div>
              ) : null}
            </details>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <MarketingSectionTitle className="mb-8 text-black">
          fonctionnement
        </MarketingSectionTitle>
        <div className="grid gap-5 md:grid-cols-3">
          {stepCards.map((card) => (
            <article
              key={card.number}
              className="min-h-[286px] rounded-[28px] bg-[#fff8f0] px-8 py-10"
            >
              <p className="text-[72px] font-normal leading-none text-[#f56800]">
                {card.number}
              </p>
              <p className="mt-6 text-xl leading-normal text-black/75">
                <strong className="text-black/80">{card.title}</strong>
                {card.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <div className="grid gap-10 md:grid-cols-[380px_1fr] md:items-center">
          <div>
            <h3 className="text-[28px] font-bold leading-tight text-[#f56800]">
              les packs de crédits
            </h3>
            <p className="mt-6 text-lg leading-normal text-black/75">
              Les crédits sont <strong>valables un an</strong> à partir de leur
              date d&apos;achat.
            </p>
            <p className="mt-6 text-lg leading-normal text-black/75">
              Ces recharges sont créditées directement sur votre compte
              personnel. S&apos;il vous reste des crédits au moment de votre
              achat, ils s&apos;ajoutent à ceux que vous venez d&apos;acheter.
            </p>
          </div>
          <AtelierCreditPackGrid returnPath="/pratique-libre" />
        </div>
      </section>

      <section className="mt-20">
        <div className="grid gap-10 md:grid-cols-[470px_1fr] md:items-start">
          <div>
            <h3 className="text-[28px] font-bold leading-tight text-[#f56800]">
              les abonnements
            </h3>
            <div className="mt-6 space-y-5 text-lg leading-normal text-black/75">
              <p>
                Les abonnements vous permettent d&apos;avoir un volume de crédit
                mensuel à utiliser à l&apos;atelier, à tarif préférentiel.
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
              rentrez dans aucune de ces cases mais que nos tarifs sont à freins
              à votre venue, venez nous rencontrer et discutons en.
            </p>
          </div>
          <AtelierSubscriptionList returnPath="/pratique-libre" />
        </div>
      </section>

      <section className="mt-20">
        <h2 className="mb-9 text-[30px] font-bold leading-tight text-[#f56800]">
          ce qu&apos;il faut savoir avant de venir à l&apos;atelier :
        </h2>

        <InfoSection title="la gestion du temps" star={ASSETS.starGreen}>
          <p>
            La durée minimale de réservation en pratique libre est de{" "}
            <strong>deux heures consécutives.</strong>
            <br />
            Vous pouvez ensuite, <strong>par palier d&apos;une heure</strong>,
            rester aussi longtemps que nos horaires le permettent.
          </p>
          <p>
            Le temps de rangement et de nettoyage de votre espace est compris
            dans cette durée. Votre poste de travail doit être rendu propre et
            rangé, outils inclus, afin de le laisser propre et dégagé pour la
            personne suivante.
          </p>
        </InfoSection>

        <InfoSection title="la sécurité" star={ASSETS.starRed}>
          <p>
            <strong>
              La sécurité est un point essentiel du fonctionnement de l&apos;atelier.
            </strong>
          </p>
          <p>
            Pour venir pratiquer, vous devez avoir{" "}
            <strong>une assurance responsabilité civile à jour.</strong>
            <br />
            Des EPI sont disponibles sur place (casque anti-bruit, lunette et
            embout de chaussure de sécurité). Toutefois, si vous êtes un
            pratiquant régulier, nous vous invitons à venir avec votre
            équipement.
          </p>
          <p>
            Certaines machines en menuiserie notamment, ne sont accessibles
            qu&apos;après avoir réalisé la formation les concernant, ou être
            capable de justifier de la capacité à les utiliser.
          </p>
          <p>
            Pour les autres, il est primordial de{" "}
            <strong>ne pas utiliser des machines que l&apos;on ne maîtrise pas</strong>,
            et dans tous les cas, d&apos;être très vigilant lors de leur
            utilisation.
          </p>
        </InfoSection>

        <InfoSection title="les matières premières" star={ASSETS.starYellow}>
          <p>
            <strong>Bois &amp; textile :</strong> manufacto met à disposition des
            matières premières de réemploi, selon les arrivages et stocks de
            nos recycleries partenaires. Une fois à l&apos;atelier, vous pouvez
            utiliser ce que vous souhaitez parmi les stocks mis à disposition.
            Aucune réservation ne pourra être prise en amont, et nous ne
            pouvons pas garantir la présence de pièces spécifiques.
          </p>
          <p>
            <strong>Terre :</strong> vous pouvez acheter de la terre chez nous
            directement, tout comme vos émaux.
            <br />
            DÉTAIL DES TERRES &amp; ÉMAUX VENDUS
            <br />
            Si vous voulez retrouver le détail des terres que vous pouvez cuire
            à l&apos;atelier, vous pouvez consulter notre page cuisson.
          </p>
        </InfoSection>
      </section>

      <section className="mt-10">
        <h2 className="mb-6 text-[30px] font-bold leading-tight text-[#f56800]">
          les questions fréquentes
        </h2>

        <div className="border-t border-black/45">
          <details className="group border-b border-black/45 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xl font-bold leading-tight [&::-webkit-details-marker]:hidden">
              Est-ce que je peux stocker des pièces à l&apos;atelier ?
              <span className="text-2xl font-normal group-open:rotate-180">⌃</span>
            </summary>
            <div className="mt-5 max-w-[1120px] space-y-4 text-base leading-normal text-black/75">
              <p>
                Les abonnés disposent d&apos;un espace de stockage pour la durée de
                leur abonnement.
              </p>
              <p>
                Pour les pratiquants plus ponctuels, vous pouvez disposer
                d&apos;un espace de stockage en cas de réservation sur plusieurs
                jours consécutifs (dans la limite d&apos;une semaine d&apos;écart entre
                deux réservations).
              </p>
              <p>
                Passé ce délai, le stockage sera facturé à hauteur de :
                <br />
                8€ / semaine pour un casier étagère &amp; 15€ / semaine dans
                l&apos;espace 3D. Le stockage s&apos;achète uniquement sur place.
              </p>
            </div>
          </details>

          <details className="group border-b border-black/45 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xl font-bold leading-tight [&::-webkit-details-marker]:hidden">
              Est-ce que je peux annuler ma réservation ?
              <span className="text-2xl font-normal group-open:rotate-180">⌃</span>
            </summary>
            <div className="mt-5 max-w-[1120px] text-base leading-normal text-black/75">
              <p>
                Vous pouvez annuler votre réservation jusqu&apos;à 24h avant. Passé
                ce délai, 50% de vos crédits seront débités.
              </p>
            </div>
          </details>

          <details className="group border-b border-black/45 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xl font-bold leading-tight [&::-webkit-details-marker]:hidden">
              Je ne sais pas exactement quel espace réserver pour mon projet,
              que faire ?
              <span className="text-2xl font-normal group-open:rotate-180">⌃</span>
            </summary>
            <div className="mt-5 max-w-[1120px] space-y-4 text-base leading-normal text-black/75">
              <p>
                Tout dépend des machines que vous allez utiliser. Tout ce qui
                est propre et silencieux peut être fait dans l&apos;espace
                couture. Dès lors que votre projet, ou étape de projet,
                nécessite une machine bruyante qui fait de la poussière, alors
                réservez plutôt en menuiserie.
              </p>
              <p>
                Si vous avez un doute, passez sur place ou envoyez-nous un mail
                pour que l&apos;on en discute !
              </p>
            </div>
          </details>
        </div>
      </section>
    </MarketingPageContainer>
  );
}

export default function PratiqueLibrePage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-black">
      <Suspense
        fallback={
          <div className="mx-auto max-w-[1274px] px-5 py-16 text-center text-black/70">
            Chargement…
          </div>
        }
      >
        <PratiqueLibreContent />
      </Suspense>
    </main>
  );
}
