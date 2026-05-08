import Image from "next/image";
import Link from "next/link";
import { unstable_noStore } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { CourseFooter, CourseGrid, CourseNav } from "../course-layout";
import { formatPrice, getCourseBySlug, getCoursesFromDb } from "../course-data";

type CourseDetailPageProps = {
  params: Promise<{ slug: string }>;
};

async function getCourses() {
  unstable_noStore();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activity")
    .select("id, name, description, image_url, nb_credits, price")
    .eq("type", "atelier");

  if (error) {
    console.error("Error fetching activities", error);
  }

  return getCoursesFromDb(data);
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const courses = await getCourses();
  const course = getCourseBySlug(slug, courses);
  const relatedCourses = courses.filter((item) => item.slug !== course.slug);
  const visibleRelated = relatedCourses.length >= 6 ? relatedCourses : courses;

  return (
    <main className="flex min-h-screen flex-col bg-white text-black">
      <CourseNav />

      <div className="mx-auto w-full max-w-[1280px] px-6 pb-[170px] pt-[78px] md:px-10">
        <section className="grid gap-10 lg:grid-cols-[594px_1fr] lg:gap-[82px]">
          <div>
            <div className="relative h-[332px] w-full overflow-hidden rounded-[6px] bg-[#d9d9d9] md:h-[495px]">
              <Image
                src={course.image}
                alt={course.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 594px"
              />
            </div>

            <div className="mt-14 max-w-[560px]">
              <h2 className="text-[30px] font-bold leading-none tracking-[-0.04em] md:text-[36px]">
                prochaines dates disponibles
              </h2>
              <div className="mt-9 space-y-7">
                {course.sessions.map((session, index) => (
                  <div
                    key={`${session}-${index}`}
                    className="flex items-center justify-between gap-4 text-[13px] font-medium leading-none md:text-[14px]"
                  >
                    <p>{session}</p>
                    <Link
                      href="/activities"
                      className="text-[#4a56dd] underline underline-offset-2"
                    >
                      réserver
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <article className="max-w-[470px] pt-2">
            <h1 className="text-[38px] font-bold leading-[0.98] tracking-[-0.04em] md:text-[55px]">
              {course.title}
            </h1>
            <p className="mt-8 text-[17px] font-bold leading-none">
              {formatPrice(course.price)}
              <br />
              {course.credits ?? 10} crédits*
            </p>
            <p className="mt-8 max-w-[404px] text-[13px] font-medium leading-[1.35] text-black/45">
              *Si vous avez déjà un pass avec des crédits, vous pouvez choisir,
              au moment du règlement, de régler avec vos crédits directement.
            </p>

            <div className="mt-9 space-y-7 text-[13px] leading-[1.35] text-black/50">
              <section>
                <h2 className="mb-4 font-medium text-[#4a56dd] underline underline-offset-2">
                  En résumé
                </h2>
                <p className="text-black/70">{course.description}</p>
              </section>

              <section>
                <h2 className="mb-4 font-medium text-[#4a56dd] underline underline-offset-2">
                  Contenu &amp; Objectifs
                </h2>
                <div className="space-y-5">
                  <p>
                    Subheading that sets up context, shares more info about the
                    website, or generally gets people psyched to keep scrolling.
                    Subheading that sets up context, shares more info about the
                    website, or generally gets people psyched to keep scrolling.
                  </p>
                  <p>
                    Subheading that sets up context, shares more info about the
                    website, or generally gets people psyched to keep scrolling.
                    Subheading that sets up context, shares more info about the
                    website, or generally gets people psyched to keep scrolling.
                  </p>
                </div>
              </section>
            </div>
          </article>
        </section>

        <section className="mt-[118px]">
          <h2 className="mb-9 text-[30px] font-bold leading-none tracking-[-0.04em] md:text-[36px]">
            à découvrir autour du travail du bois
          </h2>
          <CourseGrid courses={visibleRelated.slice(0, 6)} />
        </section>
      </div>

      <CourseFooter />
    </main>
  );
}
