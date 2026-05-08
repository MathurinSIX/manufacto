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
import { unstable_noStore } from "next/cache";
import { Suspense } from "react";

const panelClassName =
  "rounded-[19px] border border-black/10 bg-white shadow-sm ring-1 ring-black/5";

const subscriptionPlans = [
  {
    label: "Formule 01",
    price: "90€",
    credits: "20 crédits / mois",
    description:
      "Idéal si vous utilisez l'espace couture ou électronique régulièrement.",
  },
  {
    label: "Formule 02",
    price: "170€",
    credits: "40 crédits / mois",
    description:
      "Pour une pratique intermédiaire dans plusieurs espaces de l'atelier.",
  },
  {
    label: "Formule 03",
    price: "240€",
    credits: "60 crédits / mois",
    description:
      "Pour une pratique intensive, notamment en menuiserie ou céramique.",
  },
] as const;

const creditPacks = [
  { price: "15€", credits: "2 crédits" },
  { price: "36€", credits: "6 crédits" },
  { price: "66€", credits: "12 crédits" },
  { price: "100€", credits: "20 crédits" },
  { price: "270€", credits: "60 crédits" },
] as const;

const discoveryPacks = [
  {
    price: "15€",
    title: "2h de couture",
    description: "en autonomie encadrée",
  },
  {
    price: "30€",
    title: "2h de menuiserie",
    description: "en autonomie encadrée",
  },
] as const;

type Activity = {
  id: string;
  name: string;
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

async function AccountContent() {
  unstable_noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const now = new Date().toISOString();

  // Fetch registrations with session and activity details
  const { data: registrations, error: registrationsError } = await supabase
    .from("registration")
    .select(`
      id,
      payment_type,
      session_id,
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
      
      return session.start_ts >= now;
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
      
      return session.start_ts < now;
    }) || [];

  const cancelledRegistrations =
    sortedRegistrations.filter((reg) => {
      const latestStatus = registrationStatusMap[reg.id];
      return latestStatus && latestStatus.status === "CANCELLED";
    }) || [];

  // Fetch credit history
  const { data: creditHistory, error: creditError } = await supabase
    .from("credit")
    .select("id, amount, created_at")
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
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#f56800]">
              Espace membre
            </p>
            <h1 className="text-[34px] font-bold leading-tight tracking-[-0.02em] md:text-[46px]">
              Mon compte
            </h1>
            <p className="mt-5 text-xl leading-normal text-black/75 md:text-[22px]">
              Gérez vos réservations, suivez vos crédits et retrouvez votre
              historique d&apos;atelier.
            </p>
            <div className="mt-6">
              <LogoutButton className="shadow-sm" />
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
                Mes réservations
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
                Mon abonnement
              </CardTitle>
              <CardDescription className="mt-3 text-base leading-normal text-black/65">
                Retrouvez les formules mensuelles et les démarches pour gérer
                votre abonnement
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {subscriptionPlans.map((plan) => (
                      <div
                        key={plan.label}
                        className="rounded-[14px] border border-[#f56800]/60 bg-[#fff8f0] p-5"
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
                        <p className="mt-4 text-sm leading-snug text-black/65">
                          {plan.description}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 text-sm leading-normal text-black/60">
                    Les abonnements ont une durée d&apos;engagement de 3 mois,
                    puis peuvent être résiliés chaque mois. Les crédits non
                    utilisés restent disponibles et se cumulent.
                  </p>
                </div>
                <div className="rounded-[14px] bg-[#f2f2f2] p-6">
                  <p className="text-xl font-semibold leading-tight text-black/80">
                    Gestion de l&apos;abonnement
                  </p>
                  <p className="mt-4 text-base leading-normal text-black/65">
                    L&apos;espace de gestion en ligne n&apos;est pas encore relié
                    au paiement. Pour souscrire, modifier ou résilier une
                    formule, contactez-nous.
                  </p>
                  <div className="mt-6 flex flex-col gap-3">
                    <Link
                      href="/atelier#tarifs"
                      className="inline-flex justify-center rounded-[14px] bg-[#4a56dd] px-5 py-3 text-center text-base font-semibold text-white transition hover:bg-[#3844c8]"
                    >
                      Voir les tarifs
                    </Link>
                    <Link
                      href="mailto:contact@manufacto-marseille.com?subject=Abonnement%20Manufacto"
                      className="inline-flex justify-center rounded-[14px] border border-[#4a56dd] px-5 py-3 text-center text-base font-semibold text-[#4a56dd] transition hover:bg-[#4a56dd]/10"
                    >
                      Contacter l&apos;atelier
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader className="border-b border-black/10 p-6 md:p-8">
              <CardTitle className="text-[30px] font-semibold leading-tight text-black/80">
                Acheter des crédits
              </CardTitle>
              <CardDescription className="mt-3 text-base leading-normal text-black/65">
                Rechargez votre compte pour réserver vos prochains créneaux
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div>
                  <div>
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#4a56dd]">
                      Packs découverte
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {discoveryPacks.map((pack) => (
                        <div
                          key={`${pack.price}-${pack.title}`}
                          className="rounded-[14px] border border-[#4a56dd]/70 bg-[#fff8f0] p-5"
                        >
                          <p className="text-[34px] font-semibold leading-none text-black">
                            {pack.price}
                          </p>
                          <p className="mt-3 text-lg font-semibold leading-tight text-black/80">
                            {pack.title}
                          </p>
                          <p className="text-base leading-tight text-black/65">
                            {pack.description}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-normal text-black/60">
                      Offre limitée à un achat par personne, pour tester et
                      découvrir l&apos;atelier sans engagement.
                    </p>
                  </div>

                  <div className="mt-8">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#f56800]">
                      Packs de crédits
                    </p>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                    {creditPacks.map((pack) => (
                      <div
                        key={pack.price}
                        className="flex min-h-[132px] flex-col items-center justify-center rounded-[14px] border border-[#f56800]/70 bg-[#fff8f0] p-4 text-center"
                      >
                        <p className="text-[34px] font-semibold leading-none text-black">
                          {pack.price}
                        </p>
                        <p className="mt-2 text-lg font-semibold leading-tight text-black/75">
                          {pack.credits}
                        </p>
                      </div>
                    ))}
                  </div>
                  </div>
                  <p className="mt-5 text-sm leading-normal text-black/60">
                    Les crédits sont valables un an à partir de leur date
                    d&apos;achat. Ils s&apos;ajoutent au solde déjà disponible sur
                    votre compte.
                  </p>
                </div>
                <div className="rounded-[14px] bg-[#f2f2f2] p-6">
                  <p className="text-xl font-semibold leading-tight text-black/80">
                    Votre solde actuel
                  </p>
                  <p className="mt-3 text-[46px] font-bold leading-none text-[#4a56dd]">
                    {Math.round(totalCredits)}
                  </p>
                  <p className="mt-4 text-base leading-normal text-black/65">
                    Le paiement en ligne n&apos;est pas encore branché ici. Pour
                    acheter un pack de crédits, contactez-nous en indiquant le
                    pack souhaité.
                  </p>
                  <div className="mt-6 flex flex-col gap-3">
                    <Link
                      href="/atelier#tarifs"
                      className="inline-flex justify-center rounded-[14px] bg-[#4a56dd] px-5 py-3 text-center text-base font-semibold text-white transition hover:bg-[#3844c8]"
                    >
                      Voir les packs
                    </Link>
                    <Link
                      href="mailto:contact@manufacto-marseille.com?subject=Achat%20de%20cr%C3%A9dits%20Manufacto"
                      className="inline-flex justify-center rounded-[14px] border border-[#4a56dd] px-5 py-3 text-center text-base font-semibold text-[#4a56dd] transition hover:bg-[#4a56dd]/10"
                    >
                      Acheter par contact
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit History */}
          <Card className={panelClassName}>
            <CardHeader className="border-b border-black/10 p-6 md:p-8">
              <CardTitle className="text-[30px] font-semibold leading-tight text-black/80">
                Historique des crédits
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

