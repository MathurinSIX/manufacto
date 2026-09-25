import { Suspense } from "react";

import { MonthlyActivitiesCalendar } from "@/components/monthly-activities-calendar";
import { MockupPointsCalendar } from "@/components/mockups/mockup-points-calendar";
import { EXPERIMENTS } from "@/lib/posthog/experiments";
import { getExperimentVariant } from "@/lib/posthog/variant";

export function CourseCalendarFallback() {
  return (
    <div
      className="min-h-[380px] rounded-[19px] border border-black/10 bg-[#f2f2f2] md:min-h-[520px]"
      aria-hidden
    />
  );
}

async function CourseCalendarVariant() {
  const variant = await getExperimentVariant(EXPERIMENTS.calendarImages, undefined, {
    fallback: "control",
  });

  return (
    <div className="rounded-[19px] border border-black/10 bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-8">
      {variant === "test" ? <MockupPointsCalendar /> : <MonthlyActivitiesCalendar />}
    </div>
  );
}

/** Same calendar on the homepage and the cours page.
 * control = month cells without photos, test = day images.
 * The flag read has to sit inside Suspense — several pages render this in a fallback.
 */
export function CourseCalendarPanel() {
  return (
    <Suspense fallback={<CourseCalendarFallback />}>
      <CourseCalendarVariant />
    </Suspense>
  );
}
