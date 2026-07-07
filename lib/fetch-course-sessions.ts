import { createClient } from "@/lib/supabase/server";
import { inferPracticeDiscipline } from "@/lib/course-disciplines";
import type { CalendarSessionItem } from "@/components/monthly-calendar";
import {
  getCalendarMonthFetchRange,
  PARIS_TIMEZONE,
  parisMonthAnchorIso,
} from "@/lib/paris-calendar";

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

export type CourseSessionsByDate = Record<string, CalendarSessionItem[]>;

const SESSIONS_PAGE_SIZE = 1000;

function activityFromRow(row: SessionRow) {
  const a = row.activity;
  if (Array.isArray(a)) return a[0] ?? null;
  return a;
}

function groupSessionsByParisDay(rows: SessionRow[]): CourseSessionsByDate {
  const dayKeyFormatter = new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: PARIS_TIMEZONE,
  });

  const sessionsByDate: CourseSessionsByDate = {};

  for (const session of rows) {
    const act = activityFromRow(session);
    if (act?.deleted_at || act?.type !== "cours") {
      continue;
    }

    const dateKey = dayKeyFormatter.format(new Date(session.start_ts));
    const activityName = act.name ?? "Cours";
    const discipline = inferPracticeDiscipline(activityName, act.discipline);
    const item: CalendarSessionItem = {
      id: session.id,
      activityId: session.activity_id,
      start_ts: session.start_ts,
      end_ts: session.end_ts,
      activityName,
      discipline,
      nbCredits: act.nb_credits ?? null,
      price: act.price ?? null,
      squareProductId: act.square_product_id ?? null,
    };

    if (!sessionsByDate[dateKey]) {
      sessionsByDate[dateKey] = [];
    }
    sessionsByDate[dateKey].push(item);
  }

  for (const key of Object.keys(sessionsByDate)) {
    sessionsByDate[key].sort((left, right) => left.start_ts.localeCompare(right.start_ts));
  }

  return sessionsByDate;
}

async function fetchAllCourseSessionRows(
  rangeStart: Date,
  rangeEnd: Date,
): Promise<SessionRow[]> {
  const supabase = await createClient();
  const allRows: SessionRow[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
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
      .order("start_ts", { ascending: true })
      .range(offset, offset + SESSIONS_PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching sessions:", error);
      break;
    }

    if (!data?.length) {
      break;
    }

    allRows.push(...(data as SessionRow[]));

    if (data.length < SESSIONS_PAGE_SIZE) {
      break;
    }

    offset += SESSIONS_PAGE_SIZE;
  }

  return allRows;
}

export async function fetchCourseSessionsByDate(
  rangeStart: Date,
  rangeEnd: Date,
): Promise<CourseSessionsByDate> {
  const rows = await fetchAllCourseSessionRows(rangeStart, rangeEnd);
  return groupSessionsByParisDay(rows);
}

export async function fetchCourseSessionsForCalendarMonth(
  year: number,
  month: number,
): Promise<CourseSessionsByDate> {
  const monthAnchor = new Date(parisMonthAnchorIso(year, month));
  const { rangeStart, rangeEnd } = getCalendarMonthFetchRange(monthAnchor);
  return fetchCourseSessionsByDate(rangeStart, rangeEnd);
}
