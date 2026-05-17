const PARIS_TIMEZONE = "Europe/Paris";

export const PRACTICE_SCHEDULE_MARKER = "Créneaux disponibles :";

export type PracticeSessionInterval = {
  start_ts: string;
  end_ts: string;
};

const FRENCH_WEEKDAY_BY_ISO: Record<number, string> = {
  1: "lundi",
  2: "mardi",
  3: "mercredi",
  4: "jeudi",
  5: "vendredi",
  6: "samedi",
  7: "dimanche",
};

const WEEKDAY_DISPLAY_ORDER = [2, 3, 4, 5, 6, 7, 1] as const;

const timePartsFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: PARIS_TIMEZONE,
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});

const weekdayFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: PARIS_TIMEZONE,
  weekday: "long",
});

type MinuteInterval = { start: number; end: number };

function getIsoWeekdayInParis(isoTimestamp: string): number {
  const weekday = weekdayFormatter.format(new Date(isoTimestamp)).toLowerCase();
  const entry = Object.entries(FRENCH_WEEKDAY_BY_ISO).find(
    ([, label]) => label === weekday,
  );
  return entry ? Number(entry[0]) : 0;
}

function getMinutesInParis(isoTimestamp: string): number {
  const parts = timePartsFormatter.formatToParts(new Date(isoTimestamp));
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? 0,
  );
  return hour * 60 + minute;
}

function formatMinutes(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  if (minute === 0) {
    return `${hour}h`;
  }
  return `${hour}h${String(minute).padStart(2, "0")}`;
}

function mergeMinuteIntervals(intervals: MinuteInterval[]): MinuteInterval[] {
  if (intervals.length === 0) {
    return [];
  }

  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: MinuteInterval[] = [{ ...sorted[0] }];

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
      continue;
    }

    merged.push({ ...current });
  }

  return merged;
}

function formatDayLine(isoWeekday: number, intervals: MinuteInterval[]): string {
  const weekday = FRENCH_WEEKDAY_BY_ISO[isoWeekday];
  const ranges = intervals
    .map(
      (interval) =>
        `de ${formatMinutes(interval.start)} à ${formatMinutes(interval.end)}`,
    )
    .join(" et ");

  return `${weekday}, ${ranges}`;
}

/** Builds the recurring weekly pattern from future session rows. */
export function formatPracticeScheduleFromSessions(
  sessions: PracticeSessionInterval[],
): string | null {
  if (sessions.length === 0) {
    return null;
  }

  const intervalsByWeekday = new Map<number, MinuteInterval[]>();

  for (const session of sessions) {
    const isoWeekday = getIsoWeekdayInParis(session.start_ts);
    if (!isoWeekday) {
      continue;
    }

    const start = getMinutesInParis(session.start_ts);
    const end = getMinutesInParis(session.end_ts);
    if (end <= start) {
      continue;
    }

    const dayIntervals = intervalsByWeekday.get(isoWeekday) ?? [];
    dayIntervals.push({ start, end });
    intervalsByWeekday.set(isoWeekday, dayIntervals);
  }

  const lines = WEEKDAY_DISPLAY_ORDER.flatMap((isoWeekday) => {
    const dayIntervals = intervalsByWeekday.get(isoWeekday);
    if (!dayIntervals?.length) {
      return [];
    }

    return [formatDayLine(isoWeekday, mergeMinuteIntervals(dayIntervals))];
  });

  if (lines.length === 0) {
    return null;
  }

  return `${PRACTICE_SCHEDULE_MARKER}\n${lines.join("\n")}`;
}

/** Removes a hardcoded schedule block from marketing copy. */
export function stripPracticeScheduleFromDetail(detail: string): string {
  const markerIndex = detail.indexOf(PRACTICE_SCHEDULE_MARKER);
  if (markerIndex === -1) {
    return detail;
  }

  return detail.slice(0, markerIndex).trimEnd();
}
