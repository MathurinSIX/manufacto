import { connection } from "next/server";
import {
  CalendarFiltersMock,
  CalendarSwitcher,
} from "@/components/mockups/calendar-proposals";
import { fetchCourseSessionsForCalendarMonth } from "@/lib/fetch-course-sessions";
import { parisMonthAnchorIso, parisYearMonthDay } from "@/lib/paris-calendar";

export default async function Page() {
  await connection();
  const now = new Date();
  const { year, month } = parisYearMonthDay(now);
  const sessionsByDate = await fetchCourseSessionsForCalendarMonth(year, month);
  const currentMonthIso = parisMonthAnchorIso(year, month);

  return (
    <main className="min-h-screen bg-white text-black">
      <CalendarSwitcher active="filtres" />
      <CalendarFiltersMock
        sessionsByDate={sessionsByDate}
        currentMonthIso={currentMonthIso}
      />
    </main>
  );
}
