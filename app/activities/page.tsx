import Image from "next/image";
import { Suspense } from "react";
import { unstable_noStore } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ActivitySessionPicker } from "@/components/activity-session-picker";

const activityContent = {
  couture_autonomie: {
    title: "Couture en Autonomie",
    description:
      "Accédez à l'atelier en libre-service pour travailler sur vos projets personnels avec l'assistance de notre équipe si nécessaire.",
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
  },
  couture_atelier_1: {
    title: "Atelier Couture Niveau 1",
    description:
      "Apprenez les bases de la machine à coudre, réalisez vos premières pièces et repartez avec les fondamentaux indispensables.",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80",
  },
} satisfies Record<
  string,
  { title: string; description: string; image: string }
>;

async function ActivitiesList() {
  unstable_noStore();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activity")
    .select("id, name, nb_credits");

  if (error) {
    console.error("Error fetching activities", error);
  }

  const entries = Object.entries(activityContent).map(
    ([name, content]) => {
      const dbActivity = data?.find((activity) => activity.name === name);
      return {
        ...content,
        id: dbActivity?.id ?? name,
        credits: dbActivity?.nb_credits ?? null,
      };
    },
  );

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
      <Navigation />
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
            Chaque activité dispose d'un nombre de crédits requis qui se met à
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


