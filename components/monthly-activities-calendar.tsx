import { createClient } from "@/lib/supabase/server";
import { inferPracticeDiscipline } from "@/lib/course-disciplines";
import {
  MonthlyCalendar,
  type CalendarSessionItem,
} from "./monthly-calendar";

const PARIS_TIMEZONE = "Europe/Paris";

function parisYearMonthDay(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const year = Number(parts.find((p) => p.type === "year")!.value);
  const month = Number(parts.find((p) => p.type === "month")!.value);
  const day = Number(parts.find((p) => p.type === "day")!.value);
  return { year, month, day };
}

/** Anchor for calendar month (UTC noon 1st) from Paris calendar year/month. */
function parisMonthAnchorIso(year: number, month1Based: number) {
  return new Date(
    Date.UTC(year, month1Based - 1, 1, 12, 0, 0),
  ).toISOString();
}

type ActivityRow = {
  id: string;
  name: string;
  type: string | null;
  deleted_at: string | null;
  discipline: string | null;
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

/** Course sessions in a date range, grouped by Paris calendar day. */
export async function MonthlyActivitiesCalendar() {
  const supabase = await createClient();
  const now = new Date();
  const { year: py, month: pm } = parisYearMonthDay(now);

  const rangeStart = new Date(Date.now() - 45 * 86400000);
  const rangeEnd = new Date(Date.now() + 150 * 86400000);

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
        discipline
      )
    `,
    )
    .gte("start_ts", rangeStart.toISOString())
    .lte("start_ts", rangeEnd.toISOString())
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
    };
    if (!sessionsByDate[dateKey]) {
      sessionsByDate[dateKey] = [];
    }
    sessionsByDate[dateKey].push(item);
  }

  for (const key of Object.keys(sessionsByDate)) {
    sessionsByDate[key].sort((a, b) =>
      a.start_ts.localeCompare(b.start_ts),
    );
  }

  const currentMonthIso = parisMonthAnchorIso(py, pm);

  return (
    <MonthlyCalendar
      sessionsByDate={sessionsByDate}
      currentMonthIso={currentMonthIso}
    />
  );
}
