"use server";

import {
  fetchCourseSessionsForCalendarMonth,
  type CourseSessionsByDate,
} from "@/lib/fetch-course-sessions";
import {
  fetchPracticeSessionsForCalendarMonth,
  type PracticeSessionsByDate,
} from "@/lib/fetch-practice-sessions";

export async function loadCalendarMonthSessions(
  year: number,
  month: number,
): Promise<CourseSessionsByDate> {
  return fetchCourseSessionsForCalendarMonth(year, month);
}

export async function loadPracticeCalendarMonthSessions(
  year: number,
  month: number,
): Promise<PracticeSessionsByDate> {
  return fetchPracticeSessionsForCalendarMonth(year, month);
}
