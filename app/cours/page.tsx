import { createClient } from "@/lib/supabase/server";
import { unstable_noStore } from "next/cache";
import { CourseFooter, CourseGrid, CourseNav } from "./course-layout";
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
    <div className="mx-auto w-full max-w-[1280px] px-6 pb-[360px] pt-24 md:px-10 md:pb-[760px] md:pt-[115px]">
      <section className="max-w-[1190px]">
        <h1 className="text-[34px] font-bold leading-none tracking-[-0.04em] md:text-[46px]">
          les cours
        </h1>
        <p className="mt-8 max-w-[1048px] text-[12px] font-medium leading-[1.35] tracking-[-0.01em] text-black/75 md:text-[14px]">
          Chez nous, pas de cours à l&apos;année, mais des ateliers ponctuels de
          montée en compétences, à choisir selon vos envies, besoins et
          ambitions. Que vous souhaitiez découvrir de nouvelles techniques, se
          former à l&apos;utilisation d&apos;un outil spécifique, réaliser un objet
          avec lequel vous repartirez, apprendre à réaliser un projet donné,
          notre offre de cours permet à chacun de progresser à son rythme.
        </p>
      </section>

      <section className="mt-[92px]">
        <div className="mb-9 flex items-end justify-between gap-4">
          <h2 className="text-[29px] font-bold leading-none tracking-[-0.04em] md:text-[36px]">
            découvrir nos offres
          </h2>
          <button
            type="button"
            className="text-[12px] font-medium text-[#4a56dd] underline underline-offset-2"
          >
            filtrer
          </button>
        </div>
        <CourseGrid courses={courses} />
      </section>
    </div>
  );
}

export default async function CoursPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-black">
      <CourseNav />
      <CoursContent />
      <CourseFooter />
    </main>
  );
}

