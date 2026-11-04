import { createClient } from "@/lib/supabase/server";
import {
  enrichCoursesForListing,
  getCoursesFromDb,
  sortCoursesForListing,
  type Course,
} from "@/app/cours/course-data";

const SESSIONS_PAGE_SIZE = 1000;

const COURSE_ACTIVITY_COLUMNS =
  "id, name, description, image_url, image_urls, nb_credits, price, square_product_id, level, audience, discipline, disciplines";

type ActivityQueryError = { message?: string; code?: string } | null;

/** Production may not have the migration that adds this column yet. */
export function isMissingDurationMinutesColumn(error: ActivityQueryError) {
  if (!error) return false;
  return (
    error.code === "42703" || /duration_minutes/.test(error.message ?? "")
  );
}

export function durationMinutesFromActivity(activity: {
  duration_minutes?: number | null;
}) {
  return typeof activity.duration_minutes === "number" &&
    activity.duration_minutes > 0
    ? activity.duration_minutes
    : null;
}

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

/** Courses enriched for catalogue / calendar listing (upcoming first). */
export async function fetchCoursesForListing(): Promise<Course[]> {
  const supabase = await createClient();

  const activitySelect = `${COURSE_ACTIVITY_COLUMNS}, created_at, duration_minutes`;
  let { data: activities, error } = await supabase
    .from("activity")
    .select(activitySelect)
    .eq("type", "cours")
    .is("deleted_at", null)
    .order("name");

  if (isMissingDurationMinutesColumn(error)) {
    ({ data: activities, error } = await supabase
      .from("activity")
      .select(`${COURSE_ACTIVITY_COLUMNS}, created_at`)
      .eq("type", "cours")
      .is("deleted_at", null)
      .order("name"));
  }

  if (error) {
    console.error("Error fetching activities", error);
  }

  const courseActivityIds = (activities ?? []).map((activity) => activity.id);
  const [futureSessions, sessionsForDuration] = await Promise.all([
    fetchAllFutureCourseSessions(supabase, courseActivityIds),
    fetchAllCourseSessionsForDuration(supabase, courseActivityIds),
  ]);

  return sortCoursesForListing(
    enrichCoursesForListing(
      getCoursesFromDb(
        activities?.map((activity) => ({
          ...activity,
          durationMinutes: durationMinutesFromActivity(activity),
        })),
      ),
      futureSessions,
      sessionsForDuration,
    ),
  );
}
