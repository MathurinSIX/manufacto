import Image from "next/image";
import Link from "next/link";
import { unstable_noStore } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  MARKETING_LINK_CLASS,
  MarketingBody,
  MarketingPageContainer,
  MarketingSectionTitle,
} from "@/components/marketing";
import { CourseFooter } from "../course-layout";
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

  return (
    <main className="flex min-h-screen flex-col bg-white text-black">
      <MarketingPageContainer className="pb-[170px]">
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
              <MarketingSectionTitle>
                Prochaines dates disponibles
              </MarketingSectionTitle>
              <div className="mt-9 space-y-7">
                {course.sessions.map((session, index) => (
                  <div
                    key={`${session}-${index}`}
                    className="flex items-center justify-between gap-4 text-xl leading-normal text-black/75"
                  >
                    <p>{session}</p>
                    <Link
                      href="/activities"
                      className={MARKETING_LINK_CLASS}
                    >
                      réserver
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <article className="max-w-[470px] pt-2">
            <h1 className="text-[34px] font-bold leading-tight tracking-[-0.02em] md:text-[46px]">
              {course.title}
            </h1>
            <p className="mt-8 text-2xl font-bold leading-normal">
              {formatPrice(course.price)}
              <br />
              / {course.credits ?? 10} crédits*
            </p>
            <p className="mt-8 max-w-[404px] text-xl leading-normal text-black/75">
              *Si vous avez déjà un pass avec des crédits, vous pouvez choisir,
              au moment du règlement, de régler avec vos crédits directement.
            </p>

            <MarketingBody className="mt-9 text-black/75">
              <section>
                <h2 className={MARKETING_LINK_CLASS}>
                  En résumé
                </h2>
                <p className="mt-7 text-black/70">{course.description}</p>
              </section>

              <section>
                <h2 className={MARKETING_LINK_CLASS}>
                  Contenu &amp; Objectifs
                </h2>
                <div className="mt-7 space-y-7">
                  <p>
                    Cet atelier vous accompagne dans la découverte des gestes,
                    des outils et des méthodes nécessaires pour progresser en
                    sécurité. Vous repartez avec des repères concrets pour
                    reproduire la technique et l&apos;adapter à vos projets.
                  </p>
                  <p>
                    Le contenu alterne démonstrations, pratique guidée et temps
                    d&apos;échange. L&apos;objectif est de comprendre les étapes clés,
                    d&apos;identifier les bons gestes, et de gagner en autonomie dans
                    l&apos;univers concerné.
                  </p>
                </div>
              </section>
            </MarketingBody>
          </article>
        </section>
      </MarketingPageContainer>

      <CourseFooter />
    </main>
  );
}
