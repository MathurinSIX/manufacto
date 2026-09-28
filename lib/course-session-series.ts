import type { SupabaseClient } from "@supabase/supabase-js";

import { formatSessionDate, formatSessionTime } from "@/lib/email/format-session";

/** Sibling dates of a multi-part course. Occupies the seat without charging again. */
export const INCLUDED_SERIES_PAYMENT = "included";

export type SeriesSession = {
  id: string;
  start_ts: string;
  end_ts: string;
  max_registrations: number | null;
  session_group_id: string | null;
};

const BOOKING_GRACE_MS = 15 * 60 * 1000;

export async function listSeriesSessions(
  supabase: SupabaseClient,
  sessionGroupId: string,
): Promise<{ sessions: SeriesSession[]; error: string | null }> {
  const { data, error } = await supabase
    .from("session")
    .select("id, start_ts, end_ts, max_registrations, session_group_id")
    .eq("session_group_id", sessionGroupId)
    .order("start_ts", { ascending: true });

  if (error) {
    return { sessions: [], error: error.message };
  }

  return {
    sessions: (data ?? []).map((row) => ({
      id: row.id,
      start_ts: row.start_ts,
      end_ts: row.end_ts,
      max_registrations: row.max_registrations,
      session_group_id: row.session_group_id ?? null,
    })),
    error: null,
  };
}

/** Future parts of a series, including the date the client chose. */
export function bookableSeriesParts(
  sessions: SeriesSession[],
  anchorId: string,
  now = Date.now(),
) {
  const parts = sessions.filter(
    (session) =>
      new Date(session.start_ts).getTime() > now - BOOKING_GRACE_MS,
  );
  if (!parts.some((session) => session.id === anchorId)) {
    return {
      error: "Cette session n'est plus réservable" as const,
      parts: [] as SeriesSession[],
    };
  }
  return { error: null, parts };
}

export function formatSeriesSchedule(
  sessions: Array<{ start_ts: string; end_ts: string | null }>,
) {
  return [...sessions]
    .sort(
      (left, right) =>
        new Date(left.start_ts).getTime() - new Date(right.start_ts).getTime(),
    )
    .map((session, index) => {
      const end = session.end_ts
        ? `–${formatSessionTime(session.end_ts)}`
        : "";
      return `Partie ${index + 1} : ${formatSessionDate(session.start_ts)}, ${formatSessionTime(session.start_ts)}${end}`;
    })
    .join(" · ");
}
