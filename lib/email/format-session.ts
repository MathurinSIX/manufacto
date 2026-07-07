import { PARIS_TIMEZONE } from "@/lib/paris-time";

const sessionDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: PARIS_TIMEZONE,
});

const sessionTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: PARIS_TIMEZONE,
});

export function formatSessionDate(startTs: string | Date): string {
  const date = typeof startTs === "string" ? new Date(startTs) : startTs;
  return sessionDateFormatter.format(date);
}

export function formatSessionTime(startTs: string | Date): string {
  const date = typeof startTs === "string" ? new Date(startTs) : startTs;
  return sessionTimeFormatter.format(date);
}
