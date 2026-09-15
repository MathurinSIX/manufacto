import { unstable_noStore } from "next/cache";
import { Suspense } from "react";

import { CoursePageTabs } from "@/components/course-page-tabs";
import { MockupPointsCalendar } from "@/components/mockups/mockup-points-calendar";
import { P, PrimaryCta } from "@/components/mockups/shared";
import { PageHero } from "@/components/mockups/site-pages";
import { fetchCoursesForListing } from "@/lib/fetch-courses-listing";

function CalendarFallback() {
  return (
    <div
      className="min-h-[380px] rounded-[19px] border border-black/10 bg-[#f2f2f2] md:min-h-[520px]"
      aria-hidden
    />
  );
}

async function CoursContent() {
  unstable_noStore();
  const courses = await fetchCoursesForListing();

  return (
    <>
      <PageHero
        title="Cours ponctuels"
        lead="Apprenez à utiliser une machine, fabriquer un objet ou vous perfectionner. Débutant·e ou plus avancé·e : il y a une session pour vous."
        image={P.cours}
      >
        <PrimaryCta href="/offrir">Offrir un cours</PrimaryCta>
      </PageHero>

      <div className="mx-auto w-full max-w-[1274px] px-5 pb-24 md:pb-32">
        <CoursePageTabs
          courses={courses}
          calendarPanel={
            <Suspense fallback={<CalendarFallback />}>
              <div className="rounded-[19px] border border-black/10 bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-8">
                <MockupPointsCalendar />
              </div>
            </Suspense>
          }
        />
      </div>
    </>
  );
}

export default function CoursPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-black">
      <Suspense fallback={null}>
        <CoursContent />
      </Suspense>
    </main>
  );
}
