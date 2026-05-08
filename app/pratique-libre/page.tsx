import Image from "next/image";

import { createClient } from "@/lib/supabase/server";
import { unstable_noStore } from "next/cache";

import { ActivityReservationButtons } from "@/components/activity-reservation-buttons";
import { CourseFooter, CourseNav } from "../cours/course-layout";

type ActivityEntry = {
  id: string;
  name: string;
  description: string;
  credits: number | null;
  price: number | null;
};

const disciplineLinks = [
  {
    label: "menuiserie",
    color: "#d98338",
    icon: "/assets/picto/menuiserie/menuiserie.png",
    open: true,
  },
  {
    label: "couture",
    color: "#6b63d9",
    icon: "/assets/picto/couture/couture.png",
  },
  {
    label: "céramique",
    color: "#e25f70",
    icon: "/assets/picto/ceramique/ceramique.png",
  },
  {
    label: "électronique",
    color: "#1eb66a",
    icon: "/assets/picto/electronique/electronique.png",
  },
];

const accessCards = [
  {
    title: "accès à la menuiserie",
    text: "Un créneau pour avancer en autonomie sur vos projets bois, avec l'espace et les machines déjà prises en main.",
    symbol: "/assets/symboles/menuiserie_symbole.png",
  },
  {
    title: "abonnement aux ateliers",
    text: "Une formule souple pour revenir régulièrement et installer votre pratique dans le temps.",
    symbol: "/assets/stars/star_orange.png",
  },
  {
    title: "coaching projet",
    text: "Un accompagnement ponctuel pour cadrer une idée, débloquer une étape technique ou choisir les bons gestes.",
    symbol: "/assets/fleches/orange/curved_arrow_top_left.png",
  },
];

const ASSETS = {
  workshopImage: "/assets/pictures/c684ad317993704862dcfcc1d97400638b639f66.png",
  detailImage: "/assets/figma-landing/hero-wood.png",
  arrow: "/assets/fleches/orange/arrow_down_right.png",
  star: "/assets/stars/star_orange.png",
} as const;

const formationItems = [
  "prise en main des machines stationnaires",
  "lecture des consignes et règles de sécurité",
  "choix des outils adaptés à votre projet",
  "préparation, débit et assemblage des pièces",
  "organisation du poste de travail partagé",
];

function formatPrice(price: number | null) {
  if (price === null) {
    return "à définir";
  }

  return `${Number.isInteger(price) ? price : price.toFixed(2)}€`;
}

function formatCredits(credits: number | null) {
  if (credits === null) {
    return "crédits à définir";
  }

  return `${credits} crédits`;
}

function ActivityBooking({
  activity,
  isLoggedIn,
}: {
  activity: ActivityEntry;
  isLoggedIn: boolean;
}) {
  return (
    <div className="border-t border-black/20 py-4 text-[12px] font-medium leading-tight md:grid md:grid-cols-[1fr_100px_100px_150px] md:items-start md:gap-4">
      <div>
        <p className="font-bold">{activity.name}</p>
        {activity.description && (
          <p className="mt-2 max-w-[360px] text-black/55">{activity.description}</p>
        )}
      </div>
      <p className="mt-3 md:mt-0">{formatPrice(activity.price)}</p>
      <p className="mt-1 text-black/55 md:mt-0">{formatCredits(activity.credits)}</p>
      <ActivityReservationButtons
        activityId={
          activity.id &&
          typeof activity.id === "string" &&
          activity.id.length === 36
            ? activity.id
            : undefined
        }
        activityTitle={activity.name}
        credits={activity.credits}
        price={activity.price}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}

async function PratiqueLibreContent() {
  unstable_noStore();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("activity")
    .select("id, name, description, image_url, nb_credits, price")
    .in("type", ["autonomie", "autonomie_encadree", "accompagnement"]);

  if (error) {
    console.error("Error fetching activities", error);
  }

  const entries: ActivityEntry[] =
    data?.map((activity) => ({
      id: activity.id,
      name: activity.name || "Activité",
      description: activity.description || "",
      credits: activity.nb_credits ?? null,
      price: activity.price ?? null,
    })) || [];

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 pb-[360px] pt-24 md:px-10 md:pb-[760px] md:pt-[115px]">
      <section className="max-w-[1180px]">
        <h1 className="text-[34px] font-bold leading-none tracking-[-0.04em] md:text-[46px]">
          La pratique libre
        </h1>
        <div className="mt-8 max-w-[1080px] space-y-4 text-[12px] font-medium leading-[1.35] tracking-[-0.01em] text-black/75 md:text-[14px]">
          <p>
            Vous êtes déjà à l&apos;aise avec les outils et vous souhaitez avancer
            sur un projet personnel ? La pratique libre vous permet d&apos;accéder à
            l&apos;atelier, aux machines et aux établis sur des créneaux dédiés.
          </p>
          <p>
            Après une initiation ou une validation par l&apos;équipe, vous réservez
            votre place selon l&apos;univers qui vous intéresse et vous travaillez à
            votre rythme.
          </p>
        </div>
      </section>

      <section className="mt-[72px]">
        {disciplineLinks.map((discipline) => (
          <details
            key={discipline.label}
            open={discipline.open}
            className="group border-b border-black/35 first:border-t"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-[21px] font-bold leading-none tracking-[-0.04em] [&::-webkit-details-marker]:hidden md:text-[29px]">
              <span className="flex items-center gap-4" style={{ color: discipline.color }}>
                <span>{discipline.label}</span>
                <Image
                  src={discipline.icon}
                  alt=""
                  width={92}
                  height={55}
                  className="hidden h-8 w-auto object-contain opacity-90 md:block"
                  aria-hidden
                />
              </span>
              <Image
                src={ASSETS.arrow}
                alt=""
                width={18}
                height={54}
                className="h-6 w-auto transition group-open:rotate-180"
                aria-hidden
              />
            </summary>

            {discipline.open && (
              <div className="pb-16 pt-5">
                <div className="grid gap-8 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px]">
                  <div>
                    <div className="max-w-[660px] text-[12px] font-medium leading-[1.35] text-black/75 md:text-[14px]">
                      <p>
                        Pour réserver un créneau en pratique libre en menuiserie,
                        vous devez avoir suivi une formation d&apos;accès ou avoir
                        validé votre autonomie avec l&apos;équipe Manufacto.
                      </p>
                      <p className="mt-5">
                        L&apos;atelier est ouvert sur des plages horaires encadrées :
                        vous êtes autonome sur votre projet, mais l&apos;équipe reste
                        présente pour garantir le bon usage des espaces partagés.
                      </p>
                    </div>

                    <section className="mt-7">
                      <h2 className="text-[16px] font-bold leading-none tracking-[-0.03em]">
                        quelles machines à disposition ?
                      </h2>
                      <ul className="mt-4 grid max-w-[560px] grid-cols-2 gap-x-7 gap-y-1 text-[12px] font-medium leading-[1.35] text-black/70 md:text-[13px]">
                        {formationItems.map((item) => (
                          <li key={item}>- {item}</li>
                        ))}
                      </ul>
                    </section>
                  </div>

                  <div className="relative min-h-[245px] overflow-hidden rounded-[4px] bg-[#d9d9d9]">
                    <Image
                      src={ASSETS.workshopImage}
                      alt="Main traçant une pièce de bois dans l'atelier"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 420px"
                    />
                  </div>
                </div>

                <section className="mt-10">
                  <h2 className="text-[16px] font-bold leading-none tracking-[-0.03em]">
                    notre offre
                  </h2>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    {accessCards.map((card) => (
                      <article
                        key={card.title}
                        className="relative flex min-h-[132px] flex-col justify-end overflow-hidden bg-[#f1eee8] p-4 text-[12px] font-medium leading-[1.18]"
                      >
                        <Image
                          src={card.symbol}
                          alt=""
                          width={86}
                          height={86}
                          className="absolute right-3 top-3 h-12 w-auto object-contain"
                          aria-hidden
                        />
                        <h3 className="font-bold">{card.title}</h3>
                        <p className="mt-2 text-black/70">{card.text}</p>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px]">
                  <div className="text-[12px] font-medium leading-[1.35] text-black/70 md:text-[13px]">
                    <h2 className="text-[16px] font-bold leading-none tracking-[-0.03em] text-black">
                      accès à la menuiserie
                    </h2>
                    <p className="mt-4">
                      Réservez un poste pour réaliser vos découpes, assemblages,
                      ponçages et finitions. Les consommables spécifiques et les
                      matériaux restent à prévoir selon votre projet.
                    </p>
                    <p className="mt-5">
                      Si vous hésitez sur la faisabilité, passez d&apos;abord par un
                      coaching projet : nous vérifions ensemble les étapes, les
                      machines nécessaires et le temps à réserver.
                    </p>

                    <div className="mt-8">
                      <h3 className="mb-4 text-[16px] font-bold leading-none tracking-[-0.03em] text-black">
                        réserver
                      </h3>
                      {entries.length > 0 ? (
                        <div>
                          {entries.map((activity) => (
                            <ActivityBooking
                              key={activity.id}
                              activity={activity}
                              isLoggedIn={!!user}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="border-t border-black/20 py-4 text-[12px] font-medium">
                          Les créneaux seront bientôt disponibles.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative min-h-[460px] overflow-hidden rounded-[4px] bg-[#d9d9d9]">
                    <Image
                      src={ASSETS.detailImage}
                      alt="Atelier de menuiserie"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 420px"
                    />
                    <Image
                      src={ASSETS.star}
                      alt=""
                      width={84}
                      height={84}
                      className="absolute right-5 top-5 h-16 w-auto"
                      aria-hidden
                    />
                  </div>
                </section>
              </div>
            )}
          </details>
        ))}
      </section>
    </div>
  );
}

export default function PratiqueLibrePage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-black">
      <CourseNav />
      <PratiqueLibreContent />
      <CourseFooter />
    </main>
  );
}
