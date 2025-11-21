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
import { ActivitySessionPicker } from "@/components/activity-session-picker";

const activityContent = {
  couture_autonomie: {
    title: "Couture en Autonomie",
    description:
      "Accédez à l&apos;atelier en libre-service pour travailler sur vos projets personnels avec l&apos;assistance de notre équipe si nécessaire.",
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
  },
} satisfies Record<
  string,
  { title: string; description: string; image: string }
>;

export default async function PratiqueLibrePage() {
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
        </div>
      </div>
    </main>
  );
}

