export const USER_CANCELLATION_MIN_HOURS_BEFORE = 48;

const HOUR_MS = 60 * 60 * 1000;

export function getRegistrationStartTime(
  reservedStartTs: string | null | undefined,
  sessionStartTs: string | null | undefined,
): Date | null {
  const start = reservedStartTs ?? sessionStartTs ?? null;
  if (!start) return null;
  const date = new Date(start);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function canUserCancelRegistration(
  startTs: string | Date | null | undefined,
  now = Date.now(),
): boolean {
  if (!startTs) return false;
  const start = startTs instanceof Date ? startTs : new Date(startTs);
  if (Number.isNaN(start.getTime())) return false;
  return start.getTime() - now > USER_CANCELLATION_MIN_HOURS_BEFORE * HOUR_MS;
}

export const USER_CANCELLATION_DEADLINE_ERROR =
  "L'annulation n'est possible que plus de 48 heures avant le début de la session.";
