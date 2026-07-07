export const MAX_PARTICIPANTS = 5;

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
