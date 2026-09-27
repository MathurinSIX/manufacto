import { Suspense } from "react";

import { CourseCalendarPanel } from "@/components/course-calendar-panel";
import { CoursePageTabs } from "@/components/course-page-tabs";
import { P, PrimaryCta } from "@/components/mockups/shared";
import { PageHero } from "@/components/mockups/site-pages";
import { fetchCoursesForListing } from "@/lib/fetch-courses-listing";
import { unstable_noStore } from "next/cache";

async function CoursContent() {
  unstable_noStore();
  const courses = await fetchCoursesForListing();

  return (
    <main className="flex min-h-screen flex-col bg-white text-black">
      <PageHero
        title="Nos cours"
        lead="Des ateliers ponctuels de montée en compétences, à choisir selon vos envies et besoins. Adultes ou enfants, apprenez à utiliser une machine, fabriquer un objet, initiez vous ou perfectionnez-vous."
        image={P.cours}
      >
        <PrimaryCta href="/offrir">Offrir un cours</PrimaryCta>
      </PageHero>

      <div className="mx-auto w-full max-w-[1274px] px-5 pb-24 md:pb-32">
        <CoursePageTabs
          courses={courses}
          calendarPanel={<CourseCalendarPanel />}
        />
      </div>
    </main>
  );
}

export default function CoursPage() {
  return (
    <Suspense fallback={null}>
      <CoursContent />
    </Suspense>
  );
}
