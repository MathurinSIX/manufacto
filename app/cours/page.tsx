import { createClient } from "@/lib/supabase/server";
import { unstable_noStore } from "next/cache";
import { Suspense } from "react";
import {
  MarketingPageContainer,
  MarketingPageHeader,
  MarketingSectionTitle,
} from "@/components/marketing";
import { CourseGrid } from "./course-layout";
import {
  buildCourseDurationMinutesByActivityId,
  enrichCoursesWithSessionAvailability,
  getCoursesFromDb,
  sortCoursesForListing,
} from "./course-data";

async function CoursContent() {
  unstable_noStore();
  const supabase = await createClient();

  const [
    { data: activities, error },
    { data: futureSessions, error: sessionsError },
    { data: sessionsForDuration, error: durationSessionsError },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase
      .from("activity")
      .select(
        "id, name, description, image_url, image_urls, nb_credits, price, square_product_id, created_at, level, audience, discipline",
      )
      .eq("type", "cours")
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("session")
      .select("activity_id, start_ts, end_ts")
      .gte("start_ts", new Date().toISOString())
      .order("start_ts", { ascending: true }),
    supabase
      .from("session")
      .select("activity_id, start_ts, end_ts")
      .order("start_ts", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  if (error) {
    console.error("Error fetching activities", error);
  }

  if (sessionsError) {
    console.error("Error fetching future course sessions", sessionsError);
  }

  if (durationSessionsError) {
    console.error("Error fetching course session durations", durationSessionsError);
  }

  const activityIdsWithUpcomingSessions = new Set(
    futureSessions?.map((session) => session.activity_id) ?? [],
  );

  const durationByActivityId = buildCourseDurationMinutesByActivityId(
    sessionsForDuration ?? [],
  );

  const courses = sortCoursesForListing(
    enrichCoursesWithSessionAvailability(
      getCoursesFromDb(
        activities?.map((activity) => ({
          ...activity,
          durationMinutes: durationByActivityId.get(activity.id) ?? null,
        })),
      ),
      activityIdsWithUpcomingSessions,
    ),
  );

  let interestedActivityIds: string[] = [];

  if (user) {
    const { data: interests, error: interestsError } = await supabase
      .from("activity_interest")
      .select("activity_id")
      .eq("user_id", user.id);

    if (interestsError) {
      console.error("Error fetching course interests", interestsError);
    } else {
      interestedActivityIds = interests?.map((interest) => interest.activity_id) ?? [];
    }
  }

  return (
    <MarketingPageContainer className="pb-[360px] md:pb-[760px]">
      <MarketingPageHeader title="les cours">
        <p>
          Chez nous, pas de cours à l&apos;année, mais des ateliers ponctuels de
          montée en compétences, à choisir selon vos envies, besoins et
          ambitions. Que vous souhaitiez découvrir de nouvelles techniques, se
          former à l&apos;utilisation d&apos;un outil spécifique, réaliser un objet
          avec lequel vous repartirez, apprendre à réaliser un projet donné,
          notre offre de cours permet à chacun de progresser à son rythme.
        </p>
      </MarketingPageHeader>

      <section id="offres" className="mt-[92px] scroll-mt-28">
        <div className="mb-9">
          <MarketingSectionTitle>
            découvrir nos offres
          </MarketingSectionTitle>
        </div>
        <CourseGrid
          courses={courses}
          isLoggedIn={!!user}
          interestedActivityIds={interestedActivityIds}
        />
      </section>
    </MarketingPageContainer>
  );
}

export default function CoursPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-black">
      <Suspense fallback={null}>
        <CoursContent />
      </Suspense>
    </main>
  );
}
