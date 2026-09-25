import Image from "next/image";
import Link from "next/link";

import { ExpertEquipmentDetails } from "@/components/expert-equipment-details";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { P } from "@/components/mockups/shared";
import {
  inferPracticeDiscipline,
  type CourseDiscipline,
} from "@/lib/course-disciplines";

export type PracticeActivityItem = {
  id: string;
  name: string;
  type: string | null;
  nb_credits: number | null;
};

const panelClassName =
  "rounded-[19px] border border-black/10 bg-white shadow-sm ring-1 ring-black/5";

const DISCIPLINE_META: Record<
  "menuiserie" | "couture" | "ceramique",
  {
    label: string;
    color: string;
    tint: string;
    word: string;
    wordW: number;
    wordH: number;
    wordClassName: string;
    intro: string;
  }
> = {
  menuiserie: {
    label: "Menuiserie",
    color: "#f56800",
    tint: "#fff3e8",
    word: P.wordMenuiserie,
    wordW: 496,
    wordH: 90,
    wordClassName: "h-8 w-auto object-contain object-left sm:h-10",
    intro:
      "Établis, outillage à main, outillage portatifs, machines stationnaires. Des matières et consommables de réemploi sont à votre disposition, sans garantie de stock spécifique. Venez avec des chaussures fermées et la matière dont vous avez besoin. Les consommables de base (papier à poncer, vis…) sont vendus sur place si besoin.",
  },
  couture: {
    label: "Couture",
    color: "#4a56dd",
    tint: "#f0f1ff",
    word: P.wordCouture,
    wordW: 279,
    wordH: 63,
    wordClassName: "h-8 w-auto object-contain object-left sm:h-10",
    intro:
      "Tables de travail et de coupe, machines familiales et industrielles. Apportez votre tissu et ce dont vous aurez besoin. Des matières et consommables de réemploi sont à votre disposition, sans garantie de stock spécifique.",
  },
  ceramique: {
    label: "Céramique",
    color: "#d73459",
    tint: "#fff0f3",
    word: P.wordCeramique,
    wordW: 428,
    wordH: 130,
    wordClassName: "h-8 w-auto object-contain object-left sm:h-10",
    intro:
      "Modelage et tour. La terre, les émaux et les cuissons sont incluses pour les pièces réalisées à l'atelier.",
  },
};

const TYPE_ORDER = [
  "accompagnement",
  "autonomie",
  "autonomie_encadree",
  "cuisson",
] as const;

const TYPE_COPY: Record<string, { title: string; summary: string }> = {
  accompagnement: {
    title: "Accompagnement au projet",
    summary:
      "Un entretien d'une heure avec un professionnel pour peaufiner plans, assemblages et fiches de débit avant de passer à la réalisation.",
  },
  autonomie: {
    title: "Autonomie complète",
    summary:
      "À vous de juger si vous êtes suffisamment compétent par rapport à votre objectif. Vous pouvez alterner autonomie complète et encadrée selon les étapes de votre projet.",
  },
  autonomie_encadree: {
    title: "Autonomie encadrée",
    summary:
      "Une personne encadrante est présente. Vous pouvez la solliciter pour des conseils liés à votre projet, mais elle ne fera pas le projet à votre place.",
  },
  cuisson: {
    title: "Cuissons",
    summary:
      "Cuisez des pièces réalisées hors de Manufacto (grès uniquement, four complet).",
  },
};

function splitActivityTitle(name: string) {
  const parts = name.split("/");
  if (parts.length <= 1) return name.trim();
  return parts.slice(1).join("/").trim() || name.trim();
}

function reservationHref(activityId: string) {
  return `/reserver?${new URLSearchParams({ activity: activityId }).toString()}`;
}

function rateLabel(activity: PracticeActivityItem) {
  if (activity.type === "cuisson") {
    return "60 € / four";
  }
  const credits = activity.nb_credits ?? 0;
  return `${credits} crédit${credits === 1 ? "" : "s"} / h`;
}

function groupByDiscipline(activities: PracticeActivityItem[]) {
  const groups: Record<
    "menuiserie" | "couture" | "ceramique",
    PracticeActivityItem[]
  > = {
    menuiserie: [],
    couture: [],
    ceramique: [],
  };

  for (const activity of activities) {
    const discipline = inferPracticeDiscipline(activity.name) as
      | CourseDiscipline
      | null;
    if (
      discipline === "menuiserie" ||
      discipline === "couture" ||
      discipline === "ceramique"
    ) {
      groups[discipline].push(activity);
    }
  }

  for (const key of Object.keys(groups) as Array<keyof typeof groups>) {
    groups[key].sort((a, b) => {
      const ai = TYPE_ORDER.indexOf(
        (a.type ?? "") as (typeof TYPE_ORDER)[number],
      );
      const bi = TYPE_ORDER.indexOf(
        (b.type ?? "") as (typeof TYPE_ORDER)[number],
      );
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }

  return groups;
}

/** Compact pratique libre for mon compte — one card like the Cours tab. */
export function AccountPratiquePanel({
  activities,
}: {
  activities: PracticeActivityItem[];
}) {
  const groups = groupByDiscipline(activities);
  const hasAny = activities.length > 0;

  return (
    <Card className={panelClassName}>
      <CardHeader className="border-b border-black/10 p-5 md:p-7">
        <CardTitle className="text-[24px] font-semibold leading-tight text-black/80 md:text-[28px]">
          Pratique libre
        </CardTitle>
        <CardDescription className="mt-2 text-sm leading-normal text-black/65 md:text-base">
          Menuiserie, couture ou céramique — réservez un espace de travail, en
          autonomie complète ou encadrée. Les créneaux encadrés ne remplacent pas
          un cours.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 md:p-7">
        {!hasAny ? (
          <div className="rounded-[14px] border border-dashed border-black/15 px-5 py-10 text-center text-base text-black/60">
            Aucun créneau de pratique libre n&apos;est disponible pour le moment.
          </div>
        ) : (
          <div className="space-y-10">
            {(["menuiserie", "couture", "ceramique"] as const).map(
              (discipline) => {
                const meta = DISCIPLINE_META[discipline];
                const offers = groups[discipline];
                if (!offers.length) return null;

                return (
                  <section
                    key={discipline}
                    className="border-t border-black/10 pt-10 first:border-t-0 first:pt-0"
                  >
                    <Image
                      src={meta.word}
                      alt={meta.label}
                      width={meta.wordW}
                      height={meta.wordH}
                      className={meta.wordClassName}
                    />
                    <p className="mt-3 max-w-2xl text-base leading-relaxed text-black/70">
                      {meta.intro}
                    </p>
                    <ExpertEquipmentDetails
                      kind={discipline}
                      accent={meta.color}
                    />

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {offers.map((activity) => {
                        const copy = activity.type
                          ? TYPE_COPY[activity.type]
                          : undefined;
                        const title =
                          copy?.title ?? splitActivityTitle(activity.name);
                        const summary =
                          copy?.summary ??
                          "Réservez un créneau pour travailler sur votre projet.";

                        return (
                          <article
                            key={activity.id}
                            className="flex flex-col rounded-[16px] border border-black/8 p-5"
                            style={{ backgroundColor: meta.tint }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="text-lg font-bold text-black/90">
                                {title}
                              </h3>
                              <span
                                className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold"
                                style={{ color: meta.color }}
                              >
                                {rateLabel(activity)}
                              </span>
                            </div>
                            <p className="mt-2 flex-1 text-sm leading-snug text-black/70">
                              {summary}
                            </p>
                            {activity.type === "cuisson" ? (
                              <ExpertEquipmentDetails
                                kind="cuisson"
                                accent={meta.color}
                              />
                            ) : null}
                            <Link
                              href={reservationHref(activity.id)}
                              scroll={false}
                              className="mt-4 inline-flex items-center justify-center rounded-[12px] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
                              style={{ backgroundColor: meta.color }}
                            >
                              Réserver
                            </Link>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              },
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
