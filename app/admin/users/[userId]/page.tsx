import { createClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/navigation";
import { redirect } from "next/navigation";
import { unstable_noStore } from "next/cache";
import { Suspense } from "react";
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
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Get admin client for admin operations
function getAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

async function UserAccountContent({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  unstable_noStore();
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // Check if current user is admin
  if (!currentUser || currentUser.app_metadata?.role !== "admin") {
    redirect("/account");
  }

  const { userId } = await params;

  // Get the target user's information using admin client
  const adminClient = getAdminClient();
  const { data: { user: targetUser }, error: userError } = await adminClient.auth.admin.getUserById(userId);

  if (userError || !targetUser) {
    redirect("/admin");
  }

  const now = new Date().toISOString();

  // Fetch registrations with session and activity details for the target user
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
    .eq("user_id", userId);

  // Fetch latest registration_status for each registration
  const registrationIds = registrations?.map((reg) => reg.id) || [];
  let registrationStatusMap: Record<string, { status: string; created_at: string }> = {};
  
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
  let sessionsMap: Record<string, any> = {};
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
        sessionsData.forEach((session: any) => {
          sessionsMap[session.id] = session;
        });
      }
    }
  }

  const upcomingRegistrations =
    sortedRegistrations.filter((reg) => {
      // Try to get session from nested query first, then from separate query
      let session = Array.isArray(reg.session) 
        ? reg.session[0] 
        : (reg.session && typeof reg.session === "object" ? reg.session : null);
      
      // Fallback to separate query result
      if (!session && reg.session_id) {
        session = sessionsMap[reg.session_id];
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
      let session = Array.isArray(reg.session) 
        ? reg.session[0] 
        : (reg.session && typeof reg.session === "object" ? reg.session : null);
      
      // Fallback to separate query result
      if (!session && reg.session_id) {
        session = sessionsMap[reg.session_id];
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
    .eq("user_id", userId)
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
  const creditSessionMap: Record<string, any> = {};
  if (registrationStatusesWithCredits) {
    const seenCredits = new Set<string>();
    registrationStatusesWithCredits.forEach((regStatus: any) => {
      if (regStatus.credit_id && regStatus.registration && !seenCredits.has(regStatus.credit_id)) {
        // Handle nested registration data (could be array or object)
        let registration = Array.isArray(regStatus.registration)
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

  // Get user display name
  const userName = targetUser.user_metadata?.first_name && targetUser.user_metadata?.last_name
    ? `${targetUser.user_metadata.first_name} ${targetUser.user_metadata.last_name}`
    : targetUser.user_metadata?.first_name || targetUser.user_metadata?.last_name || targetUser.email;

  return (
    <div className="flex-1 w-full flex flex-col items-center px-5 py-16">
        <div className="w-full max-w-6xl space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">Compte de {userName}</h1>
              <p className="text-lg text-muted-foreground mt-2">
                {targetUser.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-background">
                <span className="text-sm font-medium">Crédits :</span>
                <span className="text-sm font-bold">{Math.round(totalCredits)}</span>
              </div>
            </div>
          </div>

          {/* Reservations with Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Réservations</CardTitle>
              <CardDescription>
                Réservations à venir, passées et annulées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upcoming">À venir</TabsTrigger>
                  <TabsTrigger value="past">Passées</TabsTrigger>
                  <TabsTrigger value="cancelled">Annulées</TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming" className="mt-4">
                  <UpcomingReservationsList
                    registrations={upcomingRegistrations}
                    sessionsMap={sessionsMap}
                    registrationStatusMap={registrationStatusMap}
                    error={registrationsError?.message}
                  />
                </TabsContent>
                <TabsContent value="past" className="mt-4">
                  <PastReservationsList
                    registrations={pastRegistrations}
                    sessionsMap={sessionsMap}
                    error={registrationsError?.message}
                  />
                </TabsContent>
                <TabsContent value="cancelled" className="mt-4">
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

          {/* Credit History */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des crédits</CardTitle>
              <CardDescription>
                Détail des crédits ajoutés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreditHistoryList
                creditHistory={creditHistory || []}
                creditSessionMap={creditSessionMap}
              />
            </CardContent>
          </Card>
        </div>
      </div>
  );
}

export default async function UserAccountPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <Suspense fallback={<nav className="w-full h-16" />}>
        <Navigation />
      </Suspense>
      <Suspense fallback={<div className="flex-1 w-full flex items-center justify-center">Chargement...</div>}>
        <UserAccountContent params={params} />
      </Suspense>
    </main>
  );
}

