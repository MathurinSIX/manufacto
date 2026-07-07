import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UpcomingReservationsList } from "@/components/upcoming-reservations-list";
import { PastReservationsList } from "@/components/past-reservations-list";
import { CancelledReservationsList } from "@/components/cancelled-reservations-list";
import { CreditHistoryList } from "@/components/credit-history-list";
import { SquareCheckoutButton } from "@/components/square-checkout-button";
import { loadSquareProducts } from "@/lib/square/load-products";
import { getSquareEnvironment } from "@/lib/square/environment";
import { CancelSubscriptionButton } from "@/components/cancel-subscription-button";
import { WeeklyActivitiesCalendar } from "@/components/weekly-activities-calendar";
import { unstable_noStore } from "next/cache";
import { Suspense } from "react";

const panelClassName =
  "rounded-[19px] border border-black/10 bg-white shadow-sm ring-1 ring-black/5";
const PARIS_TIMEZONE = "Europe/Paris";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: PARIS_TIMEZONE,
});

const subscriptionPlans = [
  {
    id: "formule-01",
    label: "Abonnement 01",
    price: "90€",
    credits: "20 crédits / mois",
    description:
      "Idéal si vous utilisez l'espace couture ou électronique régulièrement.",
  },
  {
    id: "formule-02",
    label: "Abonnement 02",
    price: "170€",
    credits: "40 crédits / mois",
    description:
      "Pour une pratique intermédiaire dans plusieurs espaces de l'atelier.",
  },
  {
    id: "formule-03",
    label: "Abonnement 03",
    price: "240€",
    credits: "60 crédits / mois",
    description:
      "Pour une pratique intensive, notamment en menuiserie ou céramique.",
  },
] as const;

const creditPackPriceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const PRACTICE_ACTIVITY_TYPES = new Set([
  "autonomie",
  "autonomie_encadree",
  "accompagnement",
  "cuisson",
]);

function subscriptionStatusLabel(status: string) {
  switch (status) {
    case "completed":
      return {
        label: "Confirmé",
        className: "bg-emerald-100 text-emerald-900",
      };
    case "processing":
      return { label: "Traitement", className: "bg-amber-100 text-amber-900" };
    case "pending":
      return { label: "En attente", className: "bg-zinc-200 text-zinc-800" };
    case "failed":
      return { label: "Échoué", className: "bg-red-100 text-red-800" };
    case "cancelled":
      return { label: "Résilié", className: "bg-zinc-200 text-zinc-800" };
    default:
      return { label: status, className: "bg-zinc-200 text-zinc-800" };
  }
}

type Activity = {
  id: string;
  name: string;
};

type QuickReservationActivity = {
  id: string;
  name: string;
  type: string | null;
  nb_credits: number | null;
};

type Session = {
  id: string;
  start_ts: string;
  end_ts: string;
  activity_id: string;
  activity?: Activity | Activity[] | null;
};

type RegistrationStatus = {
  status: string;
  created_at: string;
};

type RegistrationStatusRow = RegistrationStatus & {
  id?: string;
  credit_id?: string | null;
  registration_id?: string | null;
  registration?: CreditSessionRegistration | CreditSessionRegistration[] | null;
};

type CreditSessionRegistration = {
  id: string;
  credit_id: string;
  session_id: string | null;
  payment_type: string | null;
  reserved_start_ts?: string | null;
  reserved_end_ts?: string | null;
  status?: RegistrationStatus | null;
  session?: Session | Session[] | null;
};

function getSession(
  session: Session | Session[] | null | undefined,
): Session | null {
  if (Array.isArray(session)) {
    return session[0] ?? null;
  }

  return session ?? null;
}

function splitActivityTitle(name: string | null) {
  if (!name) return "Atelier";
  const parts = name.split("/");
  if (parts.length <= 1) return name.trim();
  return parts.slice(1).join("/").trim() || name.trim();
}

function getPracticeReservationHref(activityId: string) {
  return `/reserver?${new URLSearchParams({ activity: activityId }).toString()}`;
}

async function AccountContent() {
  unstable_noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const squareProducts = await loadSquareProducts(supabase);
  const squareProductsById = new Map(
    squareProducts.map((product) => [product.id, product]),
  );
  const creditPackProducts = squareProducts
    .filter((product) => product.kind === "credit_pack")
    .sort((a, b) => a.amountCents - b.amountCents);
  const isSquareSandbox = getSquareEnvironment() === "sandbox";

  const now = new Date().toISOString();

  // Fetch registrations with session and activity details
  const { data: registrations, error: registrationsError } = await supabase
    .from("registration")
    .select(`
      id,
      payment_type,
      session_id,
      reserved_start_ts,
      reserved_end_ts,
      participant_count,
      session:session_id (
        id,
        start_ts,
        end_ts,
        activity_id,
        activity:activity_id (
          id,
          name
        )
      )
    `)
    .eq("user_id", user.id);

  // Fetch latest registration_status for each registration
  const registrationIds = registrations?.map((reg) => reg.id) || [];
  const registrationStatusMap: Record<string, RegistrationStatus> = {};
  
  if (registrationIds.length > 0) {
    // Get the latest status for each registration
    const { data: statuses } = await supabase
      .from("registration_status")
      .select("registration_id, status, created_at")
      .in("registration_id", registrationIds)
      .order("created_at", { ascending: false });

    if (statuses) {
      // Create an object with the latest status for each registration
      const seenRegistrations = new Set<string>();
      statuses.forEach((status) => {
        if (!seenRegistrations.has(status.registration_id)) {
          registrationStatusMap[status.registration_id] = {
            status: status.status,
            created_at: status.created_at,
          };
          seenRegistrations.add(status.registration_id);
        }
      });
    }
  }

  // Sort registrations by latest registration_status created_at (or registration id as fallback)
  const sortedRegistrations = registrations?.sort((a, b) => {
    const statusA = registrationStatusMap[a.id];
    const statusB = registrationStatusMap[b.id];
    const dateA = statusA?.created_at ? new Date(statusA.created_at).getTime() : 0;
    const dateB = statusB?.created_at ? new Date(statusB.created_at).getTime() : 0;
    // If both have no status, maintain original order (by id)
    if (dateA === 0 && dateB === 0) {
      return a.id.localeCompare(b.id);
    }
    return dateB - dateA; // Descending order (newest first)
  }) || [];

  if (registrationsError) {
    console.error("Error fetching registrations:", registrationsError);
  }

  // Separate upcoming and past registrations
  // First, let's try to fetch sessions separately if nested query fails
  const sessionsMap: Record<string, Session> = {};
  if (registrations && registrations.length > 0) {
    const sessionIds = registrations
      .map((reg) => reg.session_id)
      .filter((id): id is string => !!id);
    
    if (sessionIds.length > 0) {
      const { data: sessionsData } = await supabase
        .from("session")
        .select(`
          id,
          start_ts,
          end_ts,
          activity_id,
          activity:activity_id (
            id,
            name
          )
        `)
        .in("id", sessionIds);
      
      if (sessionsData) {
        (sessionsData as Session[]).forEach((session) => {
          sessionsMap[session.id] = session;
        });
      }
    }
  }

  const upcomingRegistrations =
    sortedRegistrations.filter((reg) => {
      // Try to get session from nested query first, then from separate query
      let session: Session | null = getSession(reg.session);
      
      // Fallback to separate query result
      if (!session && reg.session_id) {
        session = sessionsMap[reg.session_id] ?? null;
      }
      
      if (!session || !session.start_ts) {
        return false;
      }
      
      // Exclude cancelled registrations from upcoming registrations
      const latestStatus = registrationStatusMap[reg.id];
      if (latestStatus && latestStatus.status === "CANCELLED") {
        return false;
      }
      
      return (reg.reserved_end_ts ?? session.end_ts) >= now;
    }) || [];

  const pastRegistrations =
    sortedRegistrations.filter((reg) => {
      // Try to get session from nested query first, then from separate query
      let session: Session | null = getSession(reg.session);
      
      // Fallback to separate query result
      if (!session && reg.session_id) {
        session = sessionsMap[reg.session_id] ?? null;
      }
      
      if (!session || !session.start_ts) {
        return false;
      }
      
      // Exclude cancelled registrations from past registrations
      const latestStatus = registrationStatusMap[reg.id];
      if (latestStatus && latestStatus.status === "CANCELLED") {
        return false;
      }
      
      return (reg.reserved_end_ts ?? session.end_ts) < now;
    }) || [];

  const cancelledRegistrations =
    sortedRegistrations.filter((reg) => {
      const latestStatus = registrationStatusMap[reg.id];
      return latestStatus && latestStatus.status === "CANCELLED";
    }) || [];

  // Fetch credit history
  const { data: creditHistory, error: creditError } = await supabase
    .from("credit")
    .select("id, amount, payment_type, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch registration_status linked to these credits
  const creditIds = creditHistory?.map((c) => c.id) || [];
  const { data: registrationStatusesWithCredits } = creditIds.length > 0
    ? await supabase
        .from("registration_status")
        .select(`
          id,
          credit_id,
          registration_id,
          status,
          created_at,
          registration:registration_id (
            id,
            session_id,
            payment_type,
            reserved_start_ts,
            reserved_end_ts,
            session:session_id (
              id,
              start_ts,
              end_ts,
              activity_id,
              activity:activity_id (
                id,
                name
              )
            )
          )
        `)
        .in("credit_id", creditIds)
        .order("created_at", { ascending: false })
    : { data: null };

  // Create an object of credit_id to registration/session info with status
  // Only use the latest registration_status for each credit (already ordered by created_at desc)
  const creditSessionMap: Record<string, CreditSessionRegistration> = {};
  if (registrationStatusesWithCredits) {
    const seenCredits = new Set<string>();
    (registrationStatusesWithCredits as RegistrationStatusRow[]).forEach((regStatus) => {
      if (regStatus.credit_id && regStatus.registration && !seenCredits.has(regStatus.credit_id)) {
        // Handle nested registration data (could be array or object)
        const registration = Array.isArray(regStatus.registration)
          ? regStatus.registration[0]
          : regStatus.registration;

        if (registration) {
          // Handle nested session data
          let session = null;
          if (registration.session) {
            if (Array.isArray(registration.session)) {
              session = registration.session[0] || null;
            } else if (typeof registration.session === "object") {
              session = registration.session;
            }
          }

          creditSessionMap[regStatus.credit_id] = {
            ...registration,
            credit_id: regStatus.credit_id,
            session: session,
            status: {
              status: regStatus.status,
              created_at: regStatus.created_at,
            },
          };
          seenCredits.add(regStatus.credit_id);
        }
      }
    });
  }

  if (creditError) {
    console.error("Error fetching credit history:", creditError);
  }

  const { data: subscriptionPurchases } = await supabase
    .from("square_purchase")
    .select(
      "id, product_id, status, credits, fulfilled_at, created_at, amount_cents",
    )
    .eq("user_id", user.id)
    .eq("product_kind", "subscription")
    .neq("status", "pending")
    .order("created_at", { ascending: false });

  const { data: practiceActivities, error: practiceActivitiesError } =
    await supabase
      .from("activity")
      .select("id, name, type, nb_credits")
      .in("type", Array.from(PRACTICE_ACTIVITY_TYPES))
      .is("deleted_at", null)
      .order("name", { ascending: true });

  if (practiceActivitiesError) {
    console.error(
      "Error fetching practice reservation activities:",
      practiceActivitiesError,
    );
  }

  const quickPracticeItems = (practiceActivities ?? []) as QuickReservationActivity[];

  // Calculate total credits
  const totalCredits =
    creditHistory?.reduce((sum, credit) => {
      const amount =
        typeof credit.amount === "number"
          ? credit.amount
          : parseFloat(String(credit.amount)) || 0;
      return sum + amount;
    }, 0) || 0;

  return (
    <div className="flex-1 w-full bg-[#fff8f0] text-black">
      <div className="mx-auto w-full max-w-[1274px] px-5 pb-20 pt-16 md:pb-[140px] md:pt-[86px]">
        <div className="mb-10 grid gap-6 md:mb-14 md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-[860px]">
            <h1 className="text-[34px] font-bold leading-tight tracking-[-0.02em] md:text-[46px]">
              mon compte
            </h1>
            <p className="mt-5 text-xl leading-normal text-black/75 md:text-[22px]">
              Gérez vos réservations, suivez vos crédits et retrouvez votre
              historique d&apos;atelier.
            </p>
            <div className="mt-6">
              <LogoutButton />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
            <div className="rounded-[19px] bg-white px-8 py-5 shadow-sm ring-1 ring-black/10">
              <span className="block text-sm font-medium uppercase tracking-[0.14em] text-black/55">
                Crédits
              </span>
              <span className="mt-2 block text-[38px] font-bold leading-none text-[#4a56dd]">
                {Math.round(totalCredits)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-8 md:space-y-10">
          {/* Reservations with Tabs */}
          <Card className={panelClassName}>
            <CardHeader className="border-b border-black/10 p-6 md:p-8">
              <CardTitle className="text-[30px] font-semibold leading-tight text-black/80">
                mes réservations
              </CardTitle>
              <CardDescription className="mt-3 text-base leading-normal text-black/65">
                Gérez vos réservations à venir, passées et annulées
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid h-auto w-full grid-cols-3 rounded-[14px] bg-[#f2f2f2] p-1 text-black/60">
                  <TabsTrigger
                    value="upcoming"
                    className="rounded-[11px] py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#4a56dd] data-[state=active]:shadow-sm"
                  >
                    À venir
                  </TabsTrigger>
                  <TabsTrigger
                    value="past"
                    className="rounded-[11px] py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#4a56dd] data-[state=active]:shadow-sm"
                  >
                    Passées
                  </TabsTrigger>
                  <TabsTrigger
                    value="cancelled"
                    className="rounded-[11px] py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#4a56dd] data-[state=active]:shadow-sm"
                  >
                    Annulées
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming" className="mt-6">
                  <UpcomingReservationsList
                    registrations={upcomingRegistrations}
                    sessionsMap={sessionsMap}
                    registrationStatusMap={registrationStatusMap}
                    error={registrationsError?.message}
                  />
                </TabsContent>
                <TabsContent value="past" className="mt-6">
                  <PastReservationsList
                    registrations={pastRegistrations}
                    sessionsMap={sessionsMap}
                    error={registrationsError?.message}
                  />
                </TabsContent>
                <TabsContent value="cancelled" className="mt-6">
                  <CancelledReservationsList
                    registrations={cancelledRegistrations}
                    sessionsMap={sessionsMap}
                    registrationStatusMap={registrationStatusMap}
                    error={registrationsError?.message}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader className="border-b border-black/10 p-6 md:p-8">
              <CardTitle className="text-[30px] font-semibold leading-tight text-black/80">
                réservation rapide
              </CardTitle>
              <CardDescription className="mt-3 text-base leading-normal text-black/65">
                Choisissez un cours ou un créneau de pratique libre disponible
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <Tabs defaultValue="cours" className="w-full">
                <TabsList className="grid h-auto w-full grid-cols-2 rounded-[14px] bg-[#f2f2f2] p-1 text-black/60">
                  <TabsTrigger
                    value="cours"
                    className="rounded-[11px] py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#4a56dd] data-[state=active]:shadow-sm"
                  >
                    Cours
                  </TabsTrigger>
                  <TabsTrigger
                    value="pratique"
                    className="rounded-[11px] py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#f56800] data-[state=active]:shadow-sm"
                  >
                    Pratique libre
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="cours" className="mt-6">
                  <div className="rounded-[14px] border border-black/10 bg-[#fff8f0] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm leading-normal text-black/60">
                        Consultez les prochaines semaines.
                      </p>
                      <Link
                        href="/cours"
                        className="shrink-0 text-sm font-semibold text-[#4a56dd] underline underline-offset-2"
                      >
                        tout voir
                      </Link>
                    </div>
                    <div className="mt-5 rounded-[14px] border border-black/10 bg-white p-3 md:p-4">
                      <Suspense
                        fallback={
                          <div
                            className="min-h-[200px] rounded-[14px] bg-[#f2f2f2] md:min-h-[280px]"
                            aria-hidden
                          />
                        }
                      >
                        <WeeklyActivitiesCalendar />
                      </Suspense>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pratique" className="mt-6">
                  <div className="rounded-[14px] border border-black/10 bg-[#fff8f0] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm leading-normal text-black/60">
                        Choisissez ensuite l&apos;heure d&apos;arrivée et la durée.
                      </p>
                      <Link
                        href="/pratique-libre"
                        className="shrink-0 text-sm font-semibold text-[#4a56dd] underline underline-offset-2"
                      >
                        tout voir
                      </Link>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {quickPracticeItems.length ? (
                        quickPracticeItems.map((activity) => (
                          <Link
                            key={activity.id}
                            href={getPracticeReservationHref(activity.id)}
                            scroll={false}
                            className="block rounded-[12px] border border-black/10 bg-white p-4 transition hover:border-[#f56800]/60 hover:bg-[#f56800]/5"
                          >
                            <span className="block font-semibold text-black">
                              {splitActivityTitle(activity.name)}
                            </span>
                            <span className="mt-1 block text-sm text-black/60">
                              {activity.nb_credits ?? 0} crédit
                              {activity.nb_credits === 1 ? "" : "s"} / heure
                            </span>
                          </Link>
                        ))
                      ) : (
                        <p className="text-sm text-black/60">
                          Aucun créneau de pratique libre n&apos;est disponible
                          pour le moment.
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader className="border-b border-black/10 p-6 md:p-8">
              <CardTitle className="text-[30px] font-semibold leading-tight text-black/80">
                mes formules
              </CardTitle>
              <CardDescription className="mt-3 text-base leading-normal text-black/65">
                Souscriptions liées à votre compte
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              {!subscriptionPurchases?.length ? (
                <p className="text-base leading-normal text-black/60">
                  Aucune formule Square enregistrée pour le moment. Les achats
                  réalisés depuis cette page apparaîtront ici après paiement.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-[14px] border border-black/10">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="border-b border-black/10 bg-[#f2f2f2] text-black/70">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Formule</th>
                        <th className="px-4 py-3 font-semibold">Crédits</th>
                        <th className="px-4 py-3 font-semibold">Statut</th>
                        <th className="px-4 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/10 bg-white">
                      {subscriptionPurchases.map((row) => {
                        const product = squareProductsById.get(row.product_id);
                        const name =
                          product?.name ?? row.product_id ?? "Formule inconnue";
                        const status = subscriptionStatusLabel(row.status);
                        const when = row.fulfilled_at ?? row.created_at;
                        const whenDate = when ? new Date(when) : null;
                        return (
                          <tr key={row.id}>
                            <td className="px-4 py-3 font-medium text-black">
                              {name}
                            </td>
                            <td className="px-4 py-3 text-black/80">
                              {Number(row.credits)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}
                              >
                                {status.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-black/70">
                              {whenDate
                                ? dateFormatter.format(whenDate)
                                : "—"}
                            </td>
                            <td className="px-4 py-3">
                              {row.status === "completed" ? (
                                <CancelSubscriptionButton purchaseId={row.id} />
                              ) : (
                                <span className="text-xs text-black/45">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader className="border-b border-black/10 p-6 md:p-8">
              <CardTitle className="text-[30px] font-semibold leading-tight text-black/80">
                mon abonnement
              </CardTitle>
              <CardDescription className="mt-3 text-base leading-normal text-black/65">
                Retrouvez les formules mensuelles et les démarches pour gérer
                votre abonnement
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <div className="grid gap-3 md:grid-cols-3">
                {subscriptionPlans.map((plan) => (
                  <div
                    key={plan.label}
                    className="flex h-full flex-col rounded-[14px] border border-[#f56800]/60 bg-[#fff8f0] p-5"
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#c97a25]">
                      {plan.label}
                    </p>
                    <p className="mt-3 text-[34px] font-semibold leading-none text-black">
                      {plan.price}
                    </p>
                    <p className="mt-1 text-lg font-semibold leading-tight text-black/80">
                      {plan.credits}
                    </p>
                    <p className="mt-4 flex-1 text-sm leading-snug text-black/65">
                      {plan.description}
                    </p>
                    <SquareCheckoutButton
                      productId={plan.id}
                      className="mt-5 inline-flex w-full shrink-0 justify-center rounded-[14px] bg-[#f56800] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#d95700] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Souscrire
                    </SquareCheckoutButton>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-normal text-black/60">
                Les abonnements ont une durée d&apos;engagement de 3 mois, puis
                peuvent être résiliés chaque mois. Les crédits non utilisés
                restent disponibles et se cumulent.
              </p>
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader className="border-b border-black/10 p-6 md:p-8">
              <CardTitle className="text-[30px] font-semibold leading-tight text-black/80">
                acheter des crédits
              </CardTitle>
              <CardDescription className="mt-3 text-base leading-normal text-black/65">
                Rechargez votre compte pour réserver vos prochains créneaux
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#f56800]">
                Packs de crédits
              </p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {creditPackProducts.map((pack) => (
                  <div
                    key={pack.id}
                    className="flex min-h-[180px] flex-col items-center justify-center rounded-[14px] border border-[#f56800]/70 bg-[#fff8f0] p-4 text-center"
                  >
                    <p className="text-[34px] font-semibold leading-none text-black">
                      {creditPackPriceFormatter.format(pack.amountCents / 100)}
                    </p>
                    <p className="mt-2 text-lg font-semibold leading-tight text-black/75">
                      {pack.credits} crédit{pack.credits > 1 ? "s" : ""}
                    </p>
                    {pack.catalogObjectId ? (
                      <SquareCheckoutButton
                        productId={pack.id}
                        className="mt-4 inline-flex w-full justify-center rounded-[12px] bg-[#f56800] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#d95700] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Acheter
                      </SquareCheckoutButton>
                    ) : (
                      <p className="mt-4 text-xs leading-snug text-black/50">
                        Paiement indisponible
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-normal text-black/60">
                Les crédits sont valables un an à partir de leur date
                d&apos;achat. Ils s&apos;ajoutent au solde déjà disponible sur votre
                compte.
              </p>
            </CardContent>
          </Card>

          {/* Credit History */}
          <Card className={panelClassName}>
            <CardHeader className="border-b border-black/10 p-6 md:p-8">
              <CardTitle className="text-[30px] font-semibold leading-tight text-black/80">
                historique des crédits
              </CardTitle>
              <CardDescription className="mt-3 text-base leading-normal text-black/65">
                Détail de vos crédits ajoutés
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <CreditHistoryList
                creditHistory={creditHistory || []}
                creditSessionMap={creditSessionMap}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <main className="min-h-screen bg-[#fff8f0] text-black">
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] w-full items-center justify-center px-5 text-xl text-black/75">
            Chargement...
          </div>
        }
      >
        <AccountContent />
      </Suspense>
    </main>
  );
}

