"use server";

import {
  fetchCourseSessionsForCalendarMonth,
  type CourseSessionsByDate,
} from "@/lib/fetch-course-sessions";

export async function loadCalendarMonthSessions(
  year: number,
  month: number,
): Promise<CourseSessionsByDate> {
  return fetchCourseSessionsForCalendarMonth(year, month);
}
