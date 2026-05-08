import { createClient } from "@/lib/supabase/server";
import { unstable_noStore } from "next/cache";
import { Suspense } from "react";
import {
  MARKETING_LINK_CLASS,
  MarketingPageContainer,
  MarketingPageHeader,
  MarketingSectionTitle,
} from "@/components/marketing";
import { CourseFooter, CourseGrid } from "./course-layout";
import { getCoursesFromDb } from "./course-data";

async function CoursContent() {
  unstable_noStore();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activity")
    .select("id, name, description, image_url, nb_credits, price")
    .eq("type", "atelier");

  if (error) {
    console.error("Error fetching activities", error);
  }

  const courses = getCoursesFromDb(data);

  return (
    <MarketingPageContainer className="pb-[360px] md:pb-[760px]">
      <MarketingPageHeader title="Les cours">
        <p>
          Chez nous, pas de cours à l&apos;année, mais des ateliers ponctuels de
          montée en compétences, à choisir selon vos envies, besoins et
          ambitions. Que vous souhaitiez découvrir de nouvelles techniques, se
          former à l&apos;utilisation d&apos;un outil spécifique, réaliser un objet
          avec lequel vous repartirez, apprendre à réaliser un projet donné,
          notre offre de cours permet à chacun de progresser à son rythme.
        </p>
      </MarketingPageHeader>

      <section className="mt-[92px]">
        <div className="mb-9 flex items-end justify-between gap-4">
          <MarketingSectionTitle>
            Découvrir nos offres
          </MarketingSectionTitle>
          <button
            type="button"
            className={MARKETING_LINK_CLASS}
          >
            filtrer
          </button>
        </div>
        <CourseGrid courses={courses} />
      </section>
    </MarketingPageContainer>
  );
}

export default function CoursPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-black">
      <Suspense fallback={null}>
        <CoursContent />
      </Suspense>
      <CourseFooter />
    </main>
  );
}

