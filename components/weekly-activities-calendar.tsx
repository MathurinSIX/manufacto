import { fetchCourseSessionsByDate } from "@/lib/fetch-course-sessions";
import {
  addUtcDays,
  buildNextParisWeekStarts,
} from "@/lib/paris-calendar";
import { connection } from "next/server";
import { WeeklyCalendar } from "./weekly-calendar";

const UPCOMING_WEEKS = 3;

export async function WeeklyActivitiesCalendar() {
  await connection();
  const now = new Date();
  const weekStarts = buildNextParisWeekStarts(now, UPCOMING_WEEKS);
  const rangeStart = weekStarts[0]!;
  const rangeEnd = addUtcDays(rangeStart, UPCOMING_WEEKS * 7);

  const sessionsByDate = await fetchCourseSessionsByDate(rangeStart, rangeEnd);

  return (
    <WeeklyCalendar
      sessionsByDate={sessionsByDate}
      weekStarts={weekStarts.map((week) => week.toISOString())}
      compact
    />
  );
}
