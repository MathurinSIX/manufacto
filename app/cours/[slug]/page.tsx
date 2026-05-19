import Image from "next/image";
import { notFound } from "next/navigation";
import { unstable_noStore } from "next/cache";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import { ActivitySessionReserveTrigger } from "@/components/activity-session-reserve-trigger";
import {
  MARKETING_LINK_CLASS,
  MarketingBody,
  MarketingPageContainer,
  MarketingSectionTitle,
} from "@/components/marketing";
import { MarkdownContent } from "@/components/markdown-content";
import {
  formatCredits,
  formatPrice,
  getCourseBySlug,
  getCoursesFromDb,
} from "../course-data";

type CourseDetailPageProps = {
  params: Promise<{ slug: string }>;
};

type CourseSession = {
  id: string;
  start_ts: string;
  end_ts: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PARIS_TIMEZONE = "Europe/Paris";

const sessionDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: PARIS_TIMEZONE,
});

const sessionTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  hour: "numeric",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: PARIS_TIMEZONE,
});

function formatSession(session: CourseSession) {
  const start = new Date(session.start_ts);
  const end = new Date(session.end_ts);

  return `${sessionDateFormatter.format(start)} - ${sessionTimeFormatter.format(start)} / ${sessionTimeFormatter.format(end)}`;
}

async function getCourses() {
  unstable_noStore();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activity")
    .select("id, name, description, image_url, nb_credits, price, square_product_id, level, audience, discipline")
    .eq("type", "cours")
    .is("deleted_at", null)
    .order("name");

  if (error) {
    console.error("Error fetching activities", error);
  }

  return getCoursesFromDb(data);
}

async function getUpcomingSessions(activityId: string): Promise<CourseSession[]> {
  if (!UUID_RE.test(activityId)) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session")
    .select("id, start_ts, end_ts")
    .eq("activity_id", activityId)
    .gte("start_ts", new Date().toISOString())
    .order("start_ts", { ascending: true })
    .limit(3);

  if (error) {
    console.error("Error fetching course sessions", error);
    return [];
  }

  return data ?? [];
}

async function CourseDetailContent({ params }: CourseDetailPageProps) {
  unstable_noStore();
  const { slug } = await params;
  const courses = await getCourses();
  const course = getCourseBySlug(slug, courses);
  if (!course) {
    notFound();
  }
  const sessions = await getUpcomingSessions(course.id);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const priceLabel = formatPrice(course.price);
  const creditsLabel = formatCredits(course.credits);

  return (
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

          {priceLabel || creditsLabel || course.level || course.audience ? (
            <aside className="mt-8 w-full max-w-[404px] shrink-0">
              {priceLabel || creditsLabel ? (
                <p className="text-2xl font-bold leading-normal">
                  {priceLabel ? (
                    <>
                      {priceLabel}
                      <br />
                    </>
                  ) : null}
                  {creditsLabel
                    ? priceLabel
                      ? ` / ${creditsLabel}*`
                      : `${creditsLabel}*`
                    : null}
                </p>
              ) : null}
              {creditsLabel ? (
                <p className="mt-8 text-xl leading-normal text-black/75">
                  *Si vous avez déjà un pass avec des crédits, vous pouvez choisir,
                  au moment du règlement, de régler avec vos crédits directement.
                </p>
              ) : null}
              {(course.level || course.audience) && (
                <dl className="mt-8 grid gap-4 text-xl leading-normal text-black/75 sm:grid-cols-2 lg:grid-cols-1">
                  {course.level && (
                    <div>
                      <dt className="font-bold text-black">Niveau</dt>
                      <dd>{course.level}</dd>
                    </div>
                  )}
                  {course.audience && (
                    <div>
                      <dt className="font-bold text-black">Public</dt>
                      <dd>{course.audience}</dd>
                    </div>
                  )}
                </dl>
              )}
            </aside>
          ) : null}

          <div className="mt-14 max-w-[560px]">
            <MarketingSectionTitle>
              Prochaines dates disponibles
            </MarketingSectionTitle>
            <div className="mt-9 space-y-7">
              {sessions.length ? (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between gap-4 text-xl leading-normal text-black/75"
                  >
                    <p className="capitalize">{formatSession(session)}</p>
                    <ActivitySessionReserveTrigger
                      activityId={course.id}
                      activityTitle={course.title}
                      activityType="cours"
                      sessionId={session.id}
                      credits={course.credits}
                      price={course.price}
                      squareProductId={course.squareProductId}
                      isLoggedIn={!!user}
                      className={`${MARKETING_LINK_CLASS} cursor-pointer bg-transparent p-0 text-left`}
                    >
                      réserver
                    </ActivitySessionReserveTrigger>
                  </div>
                ))
              ) : (
                <p className="text-xl leading-normal text-black/75">
                  Aucune date n&apos;est disponible pour le moment.
                </p>
              )}
            </div>
          </div>
        </div>

        <article className="w-full pt-2">
          <div className="min-w-0 max-w-[470px]">
            <h1 className="text-[34px] font-bold leading-tight tracking-[-0.02em] md:text-[46px]">
              {course.title}
            </h1>

            <MarketingBody className="mt-9 text-black/75">
              <MarkdownContent
                content={course.description}
                className="space-y-4 text-black/70 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:font-bold [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5"
              />
            </MarketingBody>
          </div>
        </article>
      </section>
    </MarketingPageContainer>
  );
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  return (
    <main className="flex min-h-screen flex-col bg-white text-black">
      <Suspense fallback={null}>
        <CourseDetailContent params={params} />
      </Suspense>
    </main>
  );
}
