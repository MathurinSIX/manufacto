/** Minimum consecutive hours for a standard pratique libre reservation. */
export const MIN_PRACTICE_RESERVATION_HOURS = 2;

export const ACCOMPAGNEMENT_ACTIVITY_TYPE = "accompagnement";

export function getMinPracticeReservationHours(
  activityType?: string | null,
  fixedHourCount?: number,
): number {
  if (fixedHourCount != null) {
    return fixedHourCount;
  }
  if (activityType === ACCOMPAGNEMENT_ACTIVITY_TYPE) {
    return 1;
  }
  return MIN_PRACTICE_RESERVATION_HOURS;
}
