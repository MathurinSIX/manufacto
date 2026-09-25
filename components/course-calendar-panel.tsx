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

/** Same calendar on the homepage and the cours page.
 * control = month cells without photos, test = day images.
 */
export async function CourseCalendarPanel() {
  const variant = await getExperimentVariant(EXPERIMENTS.calendarImages, undefined, {
    fallback: "control",
  });

  return (
    <Suspense fallback={<CourseCalendarFallback />}>
      <div className="rounded-[19px] border border-black/10 bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-8">
        {variant === "test" ? <MockupPointsCalendar /> : <MonthlyActivitiesCalendar />}
      </div>
    </Suspense>
  );
}
