import { connection } from "next/server";
import { CalendarPointsMock } from "@/components/mockups/calendar-proposals";
import { fetchCourseSessionsForCalendarMonth } from "@/lib/fetch-course-sessions";
import { parisMonthAnchorIso, parisYearMonthDay } from "@/lib/paris-calendar";

/** Proposition B calendar for site mockups (filters + month detail). */
export async function MockupPointsCalendar() {
  await connection();
  const now = new Date();
  const { year, month } = parisYearMonthDay(now);
  const sessionsByDate = await fetchCourseSessionsForCalendarMonth(year, month);
  const currentMonthIso = parisMonthAnchorIso(year, month);

  return (
    <CalendarPointsMock
      sessionsByDate={sessionsByDate}
      currentMonthIso={currentMonthIso}
      embedded
    />
  );
}
