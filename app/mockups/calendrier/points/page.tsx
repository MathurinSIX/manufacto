import { Suspense } from "react";
import { connection } from "next/server";
import {
  CalendarPointsMock,
  CalendarSwitcher,
} from "@/components/mockups/calendar-proposals";
import { fetchCourseSessionsForCalendarMonth } from "@/lib/fetch-course-sessions";
import { parisMonthAnchorIso, parisYearMonthDay } from "@/lib/paris-calendar";

async function PointsContent() {
  await connection();
  const now = new Date();
  const { year, month } = parisYearMonthDay(now);
  const sessionsByDate = await fetchCourseSessionsForCalendarMonth(year, month);
  const currentMonthIso = parisMonthAnchorIso(year, month);

  return (
    <>
      <CalendarSwitcher active="points" />
      <CalendarPointsMock
        sessionsByDate={sessionsByDate}
        currentMonthIso={currentMonthIso}
      />
    </>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen bg-white text-black">
      <Suspense fallback={<p className="p-8 text-black/60">Chargement…</p>}>
        <PointsContent />
      </Suspense>
    </main>
  );
}
