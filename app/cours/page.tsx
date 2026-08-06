import { createClient } from "@/lib/supabase/server";
import { unstable_noStore } from "next/cache";
import { Suspense } from "react";

import { CourseCalendarPanel } from "@/components/course-calendar-panel";
import { CoursePageTabs } from "@/components/course-page-tabs";
import {
  MarketingPageContainer,
  MarketingPageHeader,
} from "@/components/marketing";
import {
  enrichCoursesForListing,
  getCoursesFromDb,
  sortCoursesForListing,
} from "./course-data";

const SESSIONS_PAGE_SIZE = 1000;

async function fetchAllFutureCourseSessions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courseActivityIds: string[],
) {
  if (courseActivityIds.length === 0) {
    return [] as { activity_id: string; start_ts: string; end_ts: string }[];
  }

  const nowIso = new Date().toISOString();
  const allRows: { activity_id: string; start_ts: string; end_ts: string }[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("session")
      .select("activity_id, start_ts, end_ts")
      .in("activity_id", courseActivityIds)
      .gte("start_ts", nowIso)
      .order("start_ts", { ascending: true })
      .range(offset, offset + SESSIONS_PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching future course sessions", error);
      break;
    }

    if (!data?.length) {
      break;
    }

    allRows.push(...data);

    if (data.length < SESSIONS_PAGE_SIZE) {
      break;
    }

    offset += SESSIONS_PAGE_SIZE;
  }

  return allRows;
}

async function fetchAllCourseSessionsForDuration(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courseActivityIds: string[],
) {
  if (courseActivityIds.length === 0) {
    return [] as { activity_id: string; start_ts: string; end_ts: string }[];
  }

  const allRows: { activity_id: string; start_ts: string; end_ts: string }[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("session")
      .select("activity_id, start_ts, end_ts")
      .in("activity_id", courseActivityIds)
      .order("start_ts", { ascending: false })
      .range(offset, offset + SESSIONS_PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching course session durations", error);
      break;
    }

    if (!data?.length) {
      break;
    }

    allRows.push(...data);

    if (data.length < SESSIONS_PAGE_SIZE) {
      break;
    }

    offset += SESSIONS_PAGE_SIZE;
  }

  return allRows;
}

async function CoursContent() {
  unstable_noStore();
  const supabase = await createClient();

  const [
    { data: activities, error },
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
    supabase.auth.getUser(),
  ]);

  if (error) {
    console.error("Error fetching activities", error);
  }

  const courseActivityIds = (activities ?? []).map((activity) => activity.id);
  const [futureSessions, sessionsForDuration] = await Promise.all([
    fetchAllFutureCourseSessions(supabase, courseActivityIds),
    fetchAllCourseSessionsForDuration(supabase, courseActivityIds),
  ]);

  const courses = sortCoursesForListing(
    enrichCoursesForListing(
      getCoursesFromDb(
        activities?.map((activity) => ({
          ...activity,
          durationMinutes: null,
        })),
      ),
      futureSessions,
      sessionsForDuration,
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

      <CoursePageTabs
        courses={courses}
        isLoggedIn={!!user}
        interestedActivityIds={interestedActivityIds}
        calendarPanel={<CourseCalendarPanel />}
      />
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
