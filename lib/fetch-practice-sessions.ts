import { createClient } from "@/lib/supabase/server";
import { inferPracticeDiscipline } from "@/lib/course-disciplines";
import type { CalendarSessionItem } from "@/components/monthly-calendar";
import {
  getCalendarMonthFetchRange,
  PARIS_TIMEZONE,
  parisMonthAnchorIso,
} from "@/lib/paris-calendar";

const PRACTICE_ACTIVITY_TYPES = [
  "autonomie",
  "autonomie_encadree",
  "accompagnement",
  "cuisson",
] as const;

type ActivityRow = {
  id: string;
  name: string;
  type: string | null;
  deleted_at: string | null;
  discipline: string | null;
  nb_credits: number | null;
  price: number | null;
  square_product_id: string | null;
  image_url: string | null;
  image_urls: string[] | null;
};

type SessionRow = {
  id: string;
  start_ts: string;
  end_ts: string;
  activity_id: string;
  activity: ActivityRow | ActivityRow[] | null;
};

export type PracticeSessionsByDate = Record<string, CalendarSessionItem[]>;

const SESSIONS_PAGE_SIZE = 1000;

function activityFromRow(row: SessionRow) {
  const a = row.activity;
  if (Array.isArray(a)) return a[0] ?? null;
  return a;
}

function isPracticeType(type: string | null | undefined): boolean {
  return (
    !!type &&
    (PRACTICE_ACTIVITY_TYPES as readonly string[]).includes(type)
  );
}

function groupSessionsByParisDay(rows: SessionRow[]): PracticeSessionsByDate {
  const dayKeyFormatter = new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: PARIS_TIMEZONE,
  });

  const sessionsByDate: PracticeSessionsByDate = {};

  for (const session of rows) {
    const act = activityFromRow(session);
    if (act?.deleted_at || !isPracticeType(act.type)) {
      continue;
    }

    const dateKey = dayKeyFormatter.format(new Date(session.start_ts));
    const activityName = act.name ?? "Pratique libre";
    const discipline = inferPracticeDiscipline(activityName, act.discipline);
    const imageUrl =
      (act.image_urls ?? []).map((u) => u?.trim()).find(Boolean) ||
      act.image_url?.trim() ||
      null;
    const item: CalendarSessionItem = {
      id: session.id,
      activityId: session.activity_id,
      start_ts: session.start_ts,
      end_ts: session.end_ts,
      activityName,
      discipline,
      activityType: act.type,
      nbCredits: act.nb_credits ?? null,
      price: act.price ?? null,
      squareProductId: act.square_product_id ?? null,
      imageUrl,
    };

    if (!sessionsByDate[dateKey]) {
      sessionsByDate[dateKey] = [];
    }
    sessionsByDate[dateKey].push(item);
  }

  for (const key of Object.keys(sessionsByDate)) {
    sessionsByDate[key].sort((left, right) =>
      left.start_ts.localeCompare(right.start_ts),
    );
  }

  return sessionsByDate;
}

async function fetchAllPracticeSessionRows(
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
          square_product_id,
          image_url,
          image_urls
        )
      `,
      )
      .gte("start_ts", rangeStart.toISOString())
      .lt("start_ts", rangeEnd.toISOString())
      .order("start_ts", { ascending: true })
      .range(offset, offset + SESSIONS_PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching practice sessions:", error);
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

export async function fetchPracticeSessionsByDate(
  rangeStart: Date,
  rangeEnd: Date,
): Promise<PracticeSessionsByDate> {
  const rows = await fetchAllPracticeSessionRows(rangeStart, rangeEnd);
  return groupSessionsByParisDay(rows);
}

export async function fetchPracticeSessionsForCalendarMonth(
  year: number,
  month: number,
): Promise<PracticeSessionsByDate> {
  const monthAnchor = new Date(parisMonthAnchorIso(year, month));
  const { rangeStart, rangeEnd } = getCalendarMonthFetchRange(monthAnchor);
  return fetchPracticeSessionsByDate(rangeStart, rangeEnd);
}
