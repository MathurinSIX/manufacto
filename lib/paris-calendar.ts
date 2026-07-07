export const PARIS_TIMEZONE = "Europe/Paris";

export function getParisDateParts(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: PARIS_TIMEZONE,
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

/** Paris calendar day as UTC noon (stable for weekday math). */
export function getParisCalendarDate(value: string | Date) {
  const { year, month, day } = getParisDateParts(value);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export function startOfParisWeek(value: string | Date) {
  const date = getParisCalendarDate(value);
  const dayIndex = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayIndex);
  return date;
}

export function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function calendarDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function buildNextParisWeekStarts(
  from: string | Date,
  count: number,
): Date[] {
  const first = startOfParisWeek(from);
  return Array.from({ length: count }, (_, index) =>
    addUtcDays(first, index * 7),
  );
}

export function parisYearMonthDay(d: Date) {
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
export function parisMonthAnchorIso(year: number, month1Based: number) {
  return new Date(Date.UTC(year, month1Based - 1, 1, 12, 0, 0)).toISOString();
}

/** UTC noon dates for the 6-week grid that contains the given month. */
export function getCalendarGridUtcBounds(monthAnchor: Date) {
  const firstOfMonth = new Date(
    Date.UTC(monthAnchor.getUTCFullYear(), monthAnchor.getUTCMonth(), 1, 12, 0, 0),
  );
  const weekday = (firstOfMonth.getUTCDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setUTCDate(firstOfMonth.getUTCDate() - weekday);
  const gridEnd = new Date(gridStart);
  gridEnd.setUTCDate(gridStart.getUTCDate() + 42);
  return { gridStart, gridEnd };
}

export function getCalendarMonthFetchRange(monthAnchor: Date) {
  const { gridStart, gridEnd } = getCalendarGridUtcBounds(monthAnchor);
  const rangeStart = new Date(gridStart);
  rangeStart.setUTCDate(gridStart.getUTCDate() - 1);
  const rangeEnd = new Date(gridEnd);
  rangeEnd.setUTCDate(gridEnd.getUTCDate() + 1);
  return { rangeStart, rangeEnd };
}

export function getCalendarMonthKey(monthAnchor: Date) {
  return `${monthAnchor.getUTCFullYear()}-${monthAnchor.getUTCMonth() + 1}`;
}
