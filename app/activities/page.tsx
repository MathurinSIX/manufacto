import Image from "next/image";
import { Suspense } from "react";
import { unstable_noStore } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ActivitySessionPicker } from "@/components/activity-session-picker";

const DEFAULT_ACTIVITY_IMAGE = "/assets/homepage/Frame 42.jpg";
const DEFAULT_ACTIVITY_DESCRIPTION =
  "Les informations détaillées de cette activité seront bientôt disponibles.";

function splitActivityTitle(name: string | null) {
  if (!name) return "Activité";
  const parts = name.split("/");
  if (parts.length <= 1) return name.trim();
  return parts.slice(1).join("/").trim() || name.trim();
}

async function ActivitiesList() {
  unstable_noStore();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activity")
    .select("id, name, description, image_url, nb_credits")
    .is("deleted_at", null)
    .order("name");

  if (error) {
    console.error("Error fetching activities", error);
  }

  const entries =
    data?.map((activity) => ({
      id: activity.id,
      title: splitActivityTitle(activity.name),
      description: activity.description || DEFAULT_ACTIVITY_DESCRIPTION,
      image: activity.image_url || DEFAULT_ACTIVITY_IMAGE,
      credits: activity.nb_credits ?? null,
    })) ?? [];

  if (!entries.length) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        Aucune activité disponible pour le moment.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {entries.map((activity) => (
        <Card key={activity.id} className="overflow-hidden">
          <div className="relative h-56 w-full">
            <Image
              src={activity.image}
              alt={activity.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <CardHeader>
            <CardTitle>{activity.title}</CardTitle>
            <CardDescription>{activity.description}</CardDescription>
          </CardHeader>
          <CardContent>
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
            <ActivitySessionPicker
              activityId={
                activity.id &&
                typeof activity.id === "string" &&
                activity.id.length === 36
                  ? activity.id
                  : undefined
              }
              activityTitle={activity.title}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function ActivitiesPage() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center px-5 py-16">
      <div className="w-full max-w-6xl space-y-10">
        <div className="text-center space-y-3">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            Activités Manufacto
          </p>
          <h1 className="text-4xl md:text-5xl font-bold">
            Découvrez nos ateliers couture
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Chaque activité dispose d&apos;un nombre de crédits requis qui se met à
            jour automatiquement depuis Supabase. Choisissez celle qui
            correspond le mieux à vos envies créatives.
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-8">Chargement des activités...</div>}>
          <ActivitiesList />
        </Suspense>
        </div>
      </div>
    </main>
  );
}


