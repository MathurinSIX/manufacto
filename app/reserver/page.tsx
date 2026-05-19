import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { unstable_noStore } from "next/cache";

import { ActivitySessionPicker } from "@/components/activity-session-picker";
import { PracticeReservationPicker } from "@/components/practice-reservation-picker";
import { VisitSessionList } from "@/components/visit-session-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MarketingPageContainer,
  MarketingPageHeader,
} from "@/components/marketing";
import { createClient } from "@/lib/supabase/server";
import { createSessionSubscription } from "./actions";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RESERVABLE_ACTIVITY_TYPES = new Set([
  "cours",
  "autonomie",
  "autonomie_encadree",
  "accompagnement",
  "cuisson",
]);
const PRACTICE_ACTIVITY_TYPES = new Set([
  "autonomie",
  "autonomie_encadree",
  "accompagnement",
  "cuisson",
]);

function splitActivityTitle(name: string | null) {
  if (!name) return "Atelier";
  const parts = name.split("/");
  if (parts.length <= 1) return name.trim();
  return parts.slice(1).join("/").trim() || name.trim();
}

type Search = { activity?: string; session?: string };

type SimpleSessionRow = {
  id: string;
  start_ts: string;
  end_ts: string;
  max_registrations: number | null;
  activity:
    | { name: string; type: string | null; deleted_at: string | null }
    | { name: string; type: string | null; deleted_at: string | null }[]
    | null;
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Europe/Paris",
});

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Europe/Paris",
});

function activityFromRow(row: SimpleSessionRow) {
  const activity = row.activity;
  if (Array.isArray(activity)) return activity[0] ?? null;
  return activity;
}

function errorMessage(code?: string) {
  switch (code) {
    case "required":
      return "Merci d'indiquer votre nom.";
    case "session":
      return "Ce créneau n'est plus disponible.";
    case "server":
      return "Votre inscription n'a pas pu être enregistrée. Réessayez dans un instant.";
    default:
      return null;
  }
}

async function SimpleReservationPanel({
  searchParams,
  isModal = false,
}: {
  searchParams: Promise<Search & { error?: string; success?: string }>;
  isModal?: boolean;
}) {
  unstable_noStore();
  const sp = await searchParams;
  const selectedSessionId = sp.session?.trim();
  const message = errorMessage(sp.error);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("session")
    .select(
      `
      id,
      start_ts,
      end_ts,
      max_registrations,
      activity:activity_id (
        name,
        type,
        deleted_at
      )
    `,
    )
    .gte("start_ts", new Date().toISOString())
    .order("start_ts", { ascending: true });

  if (error) {
    console.error("Error fetching public reservation sessions:", error);
  }

  const sessions = ((data ?? []) as SimpleSessionRow[]).filter((row) => {
    const activity = activityFromRow(row);
    return activity?.type === "visite" && !activity.deleted_at;
  });
  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? sessions[0];

  return (
    <MarketingPageContainer className={isModal ? "px-0 pb-0 pt-0 md:pb-0 md:pt-0" : "pb-24"}>
      {!isModal ? (
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-semibold text-[#4a56dd] underline underline-offset-2"
          >
            ← retour à l&apos;accueil
          </Link>
        </div>
      ) : null}
      <MarketingPageHeader title="réserver une visite">
        <p>
          Inscrivez-vous en laissant votre nom (et éventuellement votre numéro
          de téléphone). Nous vous attendons à l&apos;atelier.
        </p>
      </MarketingPageHeader>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="rounded-[19px] border border-black/10 bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-xl font-semibold text-black/85">
            choisir un créneau
          </h2>
          <div className="mt-5 space-y-3">
            {sessions.length ? (
              <VisitSessionList
                sessions={sessions.map((session) => {
                  const activity = activityFromRow(session);
                  const start = new Date(session.start_ts);
                  const end = new Date(session.end_ts);

                  return {
                    id: session.id,
                    title: activity?.name ?? "Visite de l'atelier",
                    scheduleLabel: `${dateFormatter.format(start)} · ${timeFormatter.format(start)} - ${timeFormatter.format(end)}`,
                  };
                })}
                selectedSessionId={selectedSession?.id}
              />
            ) : (
              <p className="text-sm text-black/60">
                Aucun créneau n&apos;est disponible pour le moment.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[19px] border border-black/10 bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-xl font-semibold text-black/85">
            vos informations
          </h2>
          {sp.success ? (
            <p className="mt-5 rounded-[14px] bg-green-50 p-4 text-sm font-medium text-green-700">
              Votre inscription est enregistrée. Merci !
            </p>
          ) : null}
          {!sp.success && message ? (
            <p className="mt-5 rounded-[14px] bg-red-50 p-4 text-sm font-medium text-red-700">
              {message}
            </p>
          ) : null}

          {!sp.success ? (
            <form action={createSessionSubscription} className="mt-5 space-y-4">
              <input
                type="hidden"
                name="session_id"
                value={selectedSession?.id ?? ""}
              />
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input id="name" name="name" autoComplete="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!selectedSession}
              >
                Confirmer l&apos;inscription
              </Button>
            </form>
          ) : null}
        </div>
      </div>
    </MarketingPageContainer>
  );
}

export async function ReserverPanel({
  searchParams,
  isModal = false,
  pickerBackOnClose = false,
  pickerOnly = false,
}: {
  searchParams: Promise<Search>;
  isModal?: boolean;
  pickerBackOnClose?: boolean;
  pickerOnly?: boolean;
}) {
  unstable_noStore();
  const sp = await searchParams;
  const activityId = sp.activity?.trim() ?? "";

  if (!activityId) {
    return (
      <SimpleReservationPanel searchParams={searchParams} isModal={isModal} />
    );
  }

  if (!UUID_RE.test(activityId)) {
    redirect("/reserver");
  }

  const sessionId = sp.session?.trim();
  if (sessionId && !UUID_RE.test(sessionId)) {
    redirect(`/reserver?activity=${encodeURIComponent(activityId)}`);
  }

  const supabase = await createClient();
  const { data: activity, error } = await supabase
    .from("activity")
    .select("id, name, nb_credits, price, square_product_id, type")
    .eq("id", activityId)
    .is("deleted_at", null)
    .maybeSingle();

  if (
    error ||
    !activity ||
    !activity.type ||
    !RESERVABLE_ACTIVITY_TYPES.has(activity.type)
  ) {
    redirect("/cours");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const activityTitle = splitActivityTitle(activity.name);

  if (pickerOnly && !PRACTICE_ACTIVITY_TYPES.has(activity.type)) {
    return (
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}
      >
        <ActivitySessionPicker
          activityId={activity.id}
          activityTitle={activityTitle}
          activityType={activity.type}
          initialSessionId={sessionId}
          defaultOpen
          backOnClose={pickerBackOnClose}
          credits={activity.nb_credits}
          price={activity.price}
          squareProductId={activity.square_product_id}
          isLoggedIn={!!user}
        />
      </Suspense>
    );
  }

  const isPractice = PRACTICE_ACTIVITY_TYPES.has(activity.type);

  if (isPractice && isModal) {
    return (
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Chargement…</p>
        }
      >
        <p className="text-sm leading-normal text-black/65">
          Choisissez votre créneau et votre durée pour{" "}
          <span className="font-semibold text-black">{activityTitle}</span>.
        </p>
        <div className="mt-6">
          <PracticeReservationPicker
            activityId={activity.id}
            activityTitle={activityTitle}
            activityType={activity.type}
            credits={activity.nb_credits}
            isLoggedIn={!!user}
            inModal
          />
        </div>
      </Suspense>
    );
  }

  return (
    <MarketingPageContainer className={isModal ? "px-0 pb-0 pt-0 md:pb-0 md:pt-0" : "pb-24"}>
      {!isModal ? (
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-semibold text-[#4a56dd] underline underline-offset-2"
          >
            ← retour à l&apos;accueil
          </Link>
        </div>
      ) : null}
      <MarketingPageHeader
        title={isPractice ? "réserver en pratique libre" : "réserver une session"}
      >
        <p>
          {isPractice
            ? "Choisissez votre créneau et votre durée pour "
            : "Choisissez un créneau pour "}
          <span className="font-semibold text-black">{activityTitle}</span>.
        </p>
      </MarketingPageHeader>

      <div className="mt-10 max-w-xl rounded-[19px] border border-black/10 bg-white p-6 shadow-sm ring-1 ring-black/5">
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">Chargement…</p>
          }
        >
          {isPractice ? (
            <PracticeReservationPicker
              activityId={activity.id}
              activityTitle={activityTitle}
              activityType={activity.type}
              credits={activity.nb_credits}
              isLoggedIn={!!user}
            />
          ) : (
            <ActivitySessionPicker
              activityId={activity.id}
              activityTitle={activityTitle}
              activityType={activity.type}
              initialSessionId={sessionId}
              defaultOpen
              backOnClose={pickerBackOnClose}
              credits={activity.nb_credits}
              price={activity.price}
              squareProductId={activity.square_product_id}
              isLoggedIn={!!user}
            />
          )}
        </Suspense>
      </div>
    </MarketingPageContainer>
  );
}

export default function ReserverPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  return (
    <main className="min-h-screen bg-white text-black">
      <Suspense
        fallback={
          <div className="mx-auto max-w-[1274px] px-5 py-16 text-center text-black/70">
            Chargement…
          </div>
        }
      >
        <ReserverPanel searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
