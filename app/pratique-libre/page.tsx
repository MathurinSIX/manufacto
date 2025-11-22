import Image from "next/image";

import { createClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ActivityReservationButtons } from "@/components/activity-reservation-buttons";

export default async function PratiqueLibrePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("activity")
    .select("id, name, description, image_url, nb_credits, price")
    .eq("type", "autonomie");

  if (error) {
    console.error("Error fetching activities", error);
  }

  const entries =
    data?.map((activity) => ({
      id: activity.id,
      name: activity.name || "Activité",
      description: activity.description || "",
      image: activity.image_url || "",
      credits: activity.nb_credits ?? null,
      price: activity.price ?? null,
    })) || [];

  return (
    <main className="min-h-screen flex flex-col items-center">
      <Navigation />
      <div className="flex-1 w-full flex flex-col items-center px-5 py-16">
        <div className="w-full max-w-6xl space-y-10">
          <div className="text-center space-y-3">
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              Pratique Libre Manufacto
            </p>
            <h1 className="text-4xl md:text-5xl font-bold">
              Pratique libre à l&apos;atelier
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Accédez à l&apos;atelier en libre-service pour travailler sur vos
              projets personnels. Chaque session dispose d&apos;un nombre de crédits
              requis qui se met à jour automatiquement depuis Supabase.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {entries.map((activity) => (
              <Card key={activity.id} className="overflow-hidden">
                {activity.image && (
                  <div className="relative h-56 w-full">
                    <Image
                      src={activity.image}
                      alt={activity.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{activity.name}</CardTitle>
                  {activity.description && (
                    <CardDescription>{activity.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Crédits requis</p>
                      <p className="text-2xl font-semibold">
                        {activity.credits !== null ? (
                          <span>{activity.credits}</span>
                        ) : (
                          <span className="text-base text-muted-foreground">
                            À définir
                          </span>
                        )}
                      </p>
                    </div>
                    {activity.price !== null && (
                      <div>
                        <p className="text-sm text-muted-foreground">Prix</p>
                        <p className="text-2xl font-semibold">
                          {activity.price.toFixed(2)} €
                        </p>
                      </div>
                    )}
                  </div>
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
                    isLoggedIn={!!user}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

