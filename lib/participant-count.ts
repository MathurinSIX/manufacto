/** Safety ceiling when a session does not publish a seat limit. */
export const MAX_PARTICIPANTS = 30;

export type BookingParticipant = {
  name: string;
  email: string;
};

export function isOptionalBookingEmail(value: string): boolean {
  const email = value.trim();
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeBookingParticipants(
  participants: BookingParticipant[],
): BookingParticipant[] {
  return participants.map((participant) => ({
    name: participant.name.trim(),
    email: participant.email.trim().toLowerCase(),
  }));
}

export function bookingParticipantsAreValid(
  participants: BookingParticipant[],
): boolean {
  const normalized = normalizeBookingParticipants(participants);
  if (normalized.length < 1) return false;
  return normalized.every(
    (participant) => participant.name.length > 0 && isOptionalBookingEmail(participant.email),
  );
}

export function clampParticipantCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(MAX_PARTICIPANTS, Math.max(1, Math.trunc(value)));
}

export function getParticipantCount(
  row: { participant_count?: number | null },
): number {
  return clampParticipantCount(row.participant_count ?? 1);
}

export function sumParticipantCount(
  rows: { participant_count?: number | null }[],
): number {
  return rows.reduce((total, row) => total + getParticipantCount(row), 0);
}

export function maxSelectableCount(availableSpots: number | null): number {
  if (availableSpots === null) {
    return MAX_PARTICIPANTS;
  }

  return Math.min(MAX_PARTICIPANTS, Math.max(0, availableSpots));
}
