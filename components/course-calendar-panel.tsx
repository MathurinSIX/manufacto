import { Suspense } from "react";

import { MonthlyActivitiesCalendar } from "@/components/monthly-activities-calendar";

export function CourseCalendarFallback() {
  return (
    <div
      className="min-h-[380px] rounded-[19px] border border-black/10 bg-[#f2f2f2] md:min-h-[520px]"
      aria-hidden
    />
  );
}

export function CourseCalendarPanel() {
  return (
    <Suspense fallback={<CourseCalendarFallback />}>
      <div className="rounded-[19px] border border-black/10 bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-8">
        <MonthlyActivitiesCalendar />
      </div>
    </Suspense>
  );
}
