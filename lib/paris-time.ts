export const PARIS_TIMEZONE = "Europe/Paris";

const HOUR_MS = 60 * 60 * 1000;

const parisPartsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: PARIS_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export const parisDayKeyFormatter = new Intl.DateTimeFormat("fr-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: PARIS_TIMEZONE,
});

export type ParisParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export function getParisParts(date: Date): ParisParts {
  const parts = parisPartsFormatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

export function getParisHour(date: Date): number {
  return getParisParts(date).hour;
}

export function formatParisDate(date: Date): string {
  const { year, month, day } = getParisParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatParisTime(date: Date): string {
  const { hour, minute } = getParisParts(date);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function toParisDayKey(date: Date): string {
  return parisDayKeyFormatter.format(date);
}

/** Interprets a calendar date and clock time as Europe/Paris wall time. */
export function parseParisDateTime(date: string, time: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const timeParts = time.split(":").map(Number);
  const hour = timeParts[0] ?? 0;
  const minute = timeParts[1] ?? 0;
  const second = timeParts[2] ?? 0;

  let utcMs = Date.UTC(year, month - 1, day, hour, minute, second);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = getParisParts(new Date(utcMs));
    const diffMs =
      Date.UTC(year, month - 1, day, hour, minute, second) -
      Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second,
      );

    if (diffMs === 0) {
      break;
    }

    utcMs += diffMs;
  }

  return new Date(utcMs);
}

export function parseParisDatetimeLocal(value: string): Date {
  const [date, time] = value.split("T");
  return parseParisDateTime(date, time);
}

export function formatParisDatetimeLocal(date: Date): string {
  return `${formatParisDate(date)}T${formatParisTime(date)}`;
}

/** 0 = Monday, 6 = Sunday (Paris calendar). */
export function getParisWeekdayIndex(date: Date): number {
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone: PARIS_TIMEZONE,
    weekday: "short",
  }).format(date);

  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };

  return map[short] ?? 0;
}

export function addParisCalendarDays(date: string, days: number): string {
  const anchor = parseParisDateTime(date, "12:00");
  return formatParisDate(new Date(anchor.getTime() + days * 24 * HOUR_MS));
}

export function getParisMondayDate(anchor: Date = new Date()): string {
  const today = formatParisDate(anchor);
  const weekday = getParisWeekdayIndex(parseParisDateTime(today, "12:00"));
  return addParisCalendarDays(today, -weekday);
}

export function buildParisHourSlots(startTs: string, endTs: string): Date[] {
  const start = new Date(startTs);
  const end = new Date(endTs);
  const hours: Date[] = [];
  const cursor = new Date(start);

  while (cursor.getTime() + HOUR_MS <= end.getTime()) {
    hours.push(new Date(cursor));
    cursor.setTime(cursor.getTime() + HOUR_MS);
  }

  return hours;
}
