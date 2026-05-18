import { fetchCourseSessionsByDate } from "@/lib/fetch-course-sessions";
import { parisYearMonthDay, parisMonthAnchorIso } from "@/lib/paris-calendar";
import { MonthlyCalendar } from "./monthly-calendar";

/** Course sessions in a date range, grouped by Paris calendar day. */
export async function MonthlyActivitiesCalendar({
  compact = false,
}: {
  compact?: boolean;
} = {}) {
  const now = new Date();
  const { year: py, month: pm } = parisYearMonthDay(now);

  const rangeStart = new Date(Date.now() - 45 * 86400000);
  const rangeEnd = new Date(Date.now() + 150 * 86400000);

  const sessionsByDate = await fetchCourseSessionsByDate(rangeStart, rangeEnd);
  const currentMonthIso = parisMonthAnchorIso(py, pm);

  return (
    <MonthlyCalendar
      sessionsByDate={sessionsByDate}
      currentMonthIso={currentMonthIso}
      compact={compact}
    />
  );
}
