import { createClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/navigation";
import { LogoutButton } from "@/components/logout-button";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PARIS_TIMEZONE = "Europe/Paris";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: PARIS_TIMEZONE,
});

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: PARIS_TIMEZONE,
});

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const now = new Date().toISOString();

  // Fetch registrations with session and activity details
  const { data: registrations, error: registrationsError } = await supabase
    .from("registrations")
    .select(`
      id,
      created_at,
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
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (registrationsError) {
    console.error("Error fetching registrations:", registrationsError);
  }

  // Separate upcoming and past registrations
  const upcomingRegistrations =
    registrations?.filter((reg) => {
      if (!reg.session || typeof reg.session !== "object") return false;
      const session = reg.session as any;
      return session.start_ts && session.start_ts >= now;
    }) || [];

  const pastRegistrations =
    registrations?.filter((reg) => {
      if (!reg.session || typeof reg.session !== "object") return false;
      const session = reg.session as any;
      return session.start_ts && session.start_ts < now;
    }) || [];

  // Fetch credit history
  const { data: creditHistory, error: creditError } = await supabase
    .from("credit")
    .select("id, amount, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

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
    <main className="min-h-screen flex flex-col items-center">
      <Navigation />
      <div className="flex-1 w-full flex flex-col items-center px-5 py-16">
        <div className="w-full max-w-6xl space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">Mon Compte</h1>
              <p className="text-lg text-muted-foreground mt-2">
                Gérez vos inscriptions et consultez votre historique
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-background">
                <span className="text-sm font-medium">Crédits :</span>
                <span className="text-sm font-bold">{Math.round(totalCredits)}</span>
              </div>
              <LogoutButton />
            </div>
          </div>

          {/* Upcoming Registrations */}
          <Card>
            <CardHeader>
              <CardTitle>Mes inscriptions à venir</CardTitle>
              <CardDescription>
                Vos prochaines sessions programmées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingRegistrations.length === 0 ? (
                <p className="text-muted-foreground">
                  Aucune inscription à venir
                </p>
              ) : (
                <div className="space-y-4">
                  {upcomingRegistrations.map((reg) => {
                    const session = reg.session as any;
                    const activity =
                      session.activity && typeof session.activity === "object"
                        ? session.activity
                        : null;
                    const activityName = activity?.name || "Activité inconnue";
                    const startDate = new Date(session.start_ts);
                    const endDate = new Date(session.end_ts);

                    return (
                      <div
                        key={reg.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{activityName}</p>
                          <p className="text-sm text-muted-foreground">
                            {dateFormatter.format(startDate)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {timeFormatter.format(startDate)} -{" "}
                            {timeFormatter.format(endDate)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past Registrations */}
          <Card>
            <CardHeader>
              <CardTitle>Mes inscriptions passées</CardTitle>
              <CardDescription>
                Historique de vos participations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pastRegistrations.length === 0 ? (
                <p className="text-muted-foreground">
                  Aucune inscription passée
                </p>
              ) : (
                <div className="space-y-4">
                  {pastRegistrations.map((reg) => {
                    const session = reg.session as any;
                    const activity =
                      session.activity && typeof session.activity === "object"
                        ? session.activity
                        : null;
                    const activityName = activity?.name || "Activité inconnue";
                    const startDate = new Date(session.start_ts);
                    const endDate = new Date(session.end_ts);

                    return (
                      <div
                        key={reg.id}
                        className="flex items-center justify-between p-4 border rounded-lg opacity-75"
                      >
                        <div>
                          <p className="font-medium">{activityName}</p>
                          <p className="text-sm text-muted-foreground">
                            {dateFormatter.format(startDate)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {timeFormatter.format(startDate)} -{" "}
                            {timeFormatter.format(endDate)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credit History */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des crédits</CardTitle>
              <CardDescription>
                Détail de vos crédits ajoutés
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!creditHistory || creditHistory.length === 0 ? (
                <p className="text-muted-foreground">
                  Aucun historique de crédits
                </p>
              ) : (
                <div className="space-y-4">
                  {creditHistory.map((credit) => {
                    const amount =
                      typeof credit.amount === "number"
                        ? credit.amount
                        : parseFloat(String(credit.amount)) || 0;
                    const date = new Date(credit.created_at);

                    return (
                      <div
                        key={credit.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            +{Math.round(amount)} crédit{amount !== 1 ? "s" : ""}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {dateFormatter.format(date)} à{" "}
                            {timeFormatter.format(date)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

