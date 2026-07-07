import { getParticipantCount, sumParticipantCount } from "@/lib/participant-count";

const HOUR_MS = 60 * 60 * 1000;

export type PracticeReservationSlot = {
  reservedStartTs?: string | null;
  reservedEndTs?: string | null;
  participantCount?: number | null;
};

export function getPracticeHourStarts(sessionStart: Date, sessionEnd: Date): number[] {
  const keys: number[] = [];
  let cursor = sessionStart.getTime();
  const endMs = sessionEnd.getTime();

  while (cursor < endMs) {
    keys.push(cursor);
    cursor += HOUR_MS;
  }

  return keys;
}

export function countRegistrationsOverlappingHour(
  registrations: PracticeReservationSlot[],
  hourStartMs: number,
): number {
  const hourEndMs = hourStartMs + HOUR_MS;

  return registrations.reduce((count, registration) => {
    if (!registration.reservedStartTs || !registration.reservedEndTs) {
      return count;
    }

    const reservationStart = new Date(registration.reservedStartTs).getTime();
    const reservationEnd = new Date(registration.reservedEndTs).getTime();
    return reservationStart < hourEndMs && reservationEnd > hourStartMs
      ? count + getParticipantCount({ participant_count: registration.participantCount })
      : count;
  }, 0);
}

export function getPracticeHourlyCounts(
  sessionStart: Date,
  sessionEnd: Date,
  registrations: PracticeReservationSlot[],
): Map<number, number> {
  const counts = new Map<number, number>();

  for (const hourStartMs of getPracticeHourStarts(sessionStart, sessionEnd)) {
    counts.set(
      hourStartMs,
      countRegistrationsOverlappingHour(registrations, hourStartMs),
    );
  }

  return counts;
}

export function getPracticeCapacitySummary(
  sessionStart: Date,
  sessionEnd: Date,
  registrations: PracticeReservationSlot[],
  maxPerHour: number | null,
) {
  const hourlyCounts = getPracticeHourlyCounts(
    sessionStart,
    sessionEnd,
    registrations,
  );
  const hourCounts = Array.from(hourlyCounts.values());
  const peakHourCount = hourCounts.length ? Math.max(...hourCounts) : 0;
  const isAnyHourFull =
    maxPerHour !== null &&
    hourCounts.some((count) => count >= maxPerHour);
  const areAllHoursFull =
    maxPerHour !== null &&
    hourCounts.length > 0 &&
    hourCounts.every((count) => count >= maxPerHour);

  return {
    hourlyCounts,
    peakHourCount,
    isAnyHourFull,
    areAllHoursFull,
    totalReservations: sumParticipantCount(
      registrations.map((registration) => ({
        participant_count: registration.participantCount,
      })),
    ),
  };
}
