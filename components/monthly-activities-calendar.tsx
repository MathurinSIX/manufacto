import { fetchCourseSessionsForCalendarMonth } from "@/lib/fetch-course-sessions";
import { parisMonthAnchorIso, parisYearMonthDay } from "@/lib/paris-calendar";
import { connection } from "next/server";
import { MonthlyCalendar } from "./monthly-calendar";

/** Course sessions for the visible calendar month, loaded without row caps. */
export async function MonthlyActivitiesCalendar({
  compact = false,
  dense = false,
}: {
  compact?: boolean;
  dense?: boolean;
} = {}) {
  await connection();
  const now = new Date();
  const { year, month } = parisYearMonthDay(now);
  const sessionsByDate = await fetchCourseSessionsForCalendarMonth(year, month);
  const currentMonthIso = parisMonthAnchorIso(year, month);

  return (
    <MonthlyCalendar
      sessionsByDate={sessionsByDate}
      currentMonthIso={currentMonthIso}
      compact={compact}
      dense={dense}
    />
  );
}
