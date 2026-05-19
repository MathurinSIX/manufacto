import { createClient } from "@/lib/supabase/server";
import { inferPracticeDiscipline } from "@/lib/course-disciplines";
import type { CalendarSessionItem } from "@/components/monthly-calendar";
import { PARIS_TIMEZONE } from "@/lib/paris-calendar";

type ActivityRow = {
  id: string;
  name: string;
  type: string | null;
  deleted_at: string | null;
  discipline: string | null;
  nb_credits: number | null;
  price: number | null;
  square_product_id: string | null;
};

type SessionRow = {
  id: string;
  start_ts: string;
  end_ts: string;
  activity_id: string;
  activity: ActivityRow | ActivityRow[] | null;
};

function activityFromRow(row: SessionRow) {
  const a = row.activity;
  if (Array.isArray(a)) return a[0] ?? null;
  return a;
}

export async function fetchCourseSessionsByDate(
  rangeStart: Date,
  rangeEnd: Date,
): Promise<Record<string, CalendarSessionItem[]>> {
  const supabase = await createClient();

  const { data: sessions, error: sessionsError } = await supabase
    .from("session")
    .select(
      `
      id,
      start_ts,
      end_ts,
      activity_id,
      activity:activity_id (
        id,
        name,
        type,
        deleted_at,
        discipline,
        nb_credits,
        price,
        square_product_id
      )
    `,
    )
    .gte("start_ts", rangeStart.toISOString())
    .lt("start_ts", rangeEnd.toISOString())
    .order("start_ts", { ascending: true });

  if (sessionsError) {
    console.error("Error fetching sessions:", sessionsError);
  }

  const rows = (sessions ?? []) as SessionRow[];
  const courseSessions = rows.filter((row) => {
    const act = activityFromRow(row);
    return !act?.deleted_at && act?.type === "cours";
  });

  const dayKeyFormatter = new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: PARIS_TIMEZONE,
  });

  const sessionsByDate: Record<string, CalendarSessionItem[]> = {};

  for (const session of courseSessions) {
    const act = activityFromRow(session);
    const dateKey = dayKeyFormatter.format(new Date(session.start_ts));
    const activityName = act?.name ?? "Cours";
    const discipline = inferPracticeDiscipline(activityName, act?.discipline);
    const item: CalendarSessionItem = {
      id: session.id,
      activityId: session.activity_id,
      start_ts: session.start_ts,
      end_ts: session.end_ts,
      activityName,
      discipline,
      nbCredits: act?.nb_credits ?? null,
      price: act?.price ?? null,
      squareProductId: act?.square_product_id ?? null,
    };
    if (!sessionsByDate[dateKey]) {
      sessionsByDate[dateKey] = [];
    }
    sessionsByDate[dateKey].push(item);
  }

  for (const key of Object.keys(sessionsByDate)) {
    sessionsByDate[key].sort((a, b) => a.start_ts.localeCompare(b.start_ts));
  }

  return sessionsByDate;
}
