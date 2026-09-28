import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_noStore } from "next/cache";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import { resolveAccountUserId } from "@/lib/account-share";
import { ActivitySessionReserveTrigger } from "@/components/activity-session-reserve-trigger";
import { CourseImageCarousel } from "@/components/course-image-carousel";
import { CourseInterestButton } from "@/components/course-interest-button";
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
  enrichCoursesForListing,
} from "../course-data";

type CourseDetailPageProps = {
  params: Promise<{ slug: string }>;
};

type CourseSession = {
  id: string;
  start_ts: string;
  end_ts: string;
  session_group_id: string | null;
};

type CourseSessionOffer = {
  key: string;
  label: string;
  /** Session used as the booking entry point (first date of the group). */
  primarySessionId: string;
  dates: CourseSession[];
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

  const formatHour = (date: Date) => {
    const parts = sessionTimeFormatter.formatToParts(date);
    const hour = parts.find((part) => part.type === "hour")?.value ?? "0";
    const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
    return minute === "00" ? `${Number(hour)}h` : `${Number(hour)}h${minute}`;
  };

  return `${sessionDateFormatter.format(start)} - ${formatHour(start)} / ${formatHour(end)}`;
}

function groupSessionsIntoOffers(sessions: CourseSession[]): CourseSessionOffer[] {
  const groups = new Map<string, CourseSession[]>();
  const order: string[] = [];

  for (const session of sessions) {
    const key = session.session_group_id ?? `single:${session.id}`;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(session);
  }

  return order.map((key, index) => {
    const dates = (groups.get(key) ?? []).slice().sort(
      (left, right) =>
        new Date(left.start_ts).getTime() - new Date(right.start_ts).getTime(),
    );
    const isMultiDay = Boolean(dates[0]?.session_group_id) && dates.length > 1;
    return {
      key,
      label: isMultiDay
        ? `Session en ${dates.length} parties`
        : `Session ${String(index + 1).padStart(2, "0")}`,
      primarySessionId: dates[0]!.id,
      dates: isMultiDay ? dates : dates.slice(0, 1),
    };
  });
}

async function getCourses() {
  unstable_noStore();
  const supabase = await createClient();

  const [{ data, error }, { data: futureSessions, error: sessionsError }, { data: sessionsForDuration, error: durationSessionsError }] =
    await Promise.all([
      supabase
        .from("activity")
        .select(
          "id, name, description, image_url, image_urls, nb_credits, price, square_product_id, level, audience, discipline, disciplines",
        )
        .eq("type", "cours")
        .is("deleted_at", null)
        .order("name"),
      supabase
        .from("session")
        .select("activity_id, start_ts, end_ts")
        .gte("start_ts", new Date(Date.now() - 15 * 60 * 1000).toISOString())
        .order("start_ts", { ascending: true }),
      supabase
        .from("session")
        .select("activity_id, start_ts, end_ts")
        .order("start_ts", { ascending: false }),
    ]);

  if (error) {
    console.error("Error fetching activities", error);
  }

  if (sessionsError) {
    console.error("Error fetching course session durations", sessionsError);
  }

  if (durationSessionsError) {
    console.error("Error fetching course durations", durationSessionsError);
  }

  return enrichCoursesForListing(
    getCoursesFromDb(
      data?.map((activity) => ({
        ...activity,
        durationMinutes: null,
      })),
    ),
    futureSessions ?? [],
    sessionsForDuration ?? [],
  );
}

async function getUpcomingSessions(activityId: string): Promise<CourseSession[]> {
  if (!UUID_RE.test(activityId)) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session")
    .select("id, start_ts, end_ts, session_group_id")
    .eq("activity_id", activityId)
    .gte("start_ts", new Date(Date.now() - 15 * 60 * 1000).toISOString())
    .order("start_ts", { ascending: true })
    .limit(40);

  if (error) {
    console.error("Error fetching course sessions", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    start_ts: row.start_ts,
    end_ts: row.end_ts,
    session_group_id: row.session_group_id ?? null,
  }));
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
  const sessionOffers = groupSessionsIntoOffers(sessions);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isInterested = false;

  if (user) {
    const accountUserId = await resolveAccountUserId(supabase, user.id);
    const { data: interest } = await supabase
      .from("activity_interest")
      .select("id")
      .eq("user_id", accountUserId)
      .eq("activity_id", course.id)
      .maybeSingle();

    isInterested = !!interest;
  }

  const priceLabel = formatPrice(course.price);
  const creditsLabel = formatCredits(course.credits);

  return (
    <MarketingPageContainer className="pb-[170px]">
      <div className="mb-8">
        <Link
          href="/cours"
          className="text-sm font-semibold text-[#4a56dd] underline underline-offset-2"
        >
          ← retour aux cours
        </Link>
      </div>
      <section className="grid gap-10 lg:grid-cols-[594px_1fr] lg:gap-[82px]">
        <div>
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[6px] bg-[#d9d9d9]">
            <CourseImageCarousel
              images={course.images}
              alt={course.title}
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
              {sessionOffers.length ? (
                sessionOffers.map((offer) => {
                  const isMultiDay = offer.dates.length > 1;
                  return (
                    <div
                      key={offer.key}
                      className="flex items-start justify-between gap-4 text-xl leading-normal text-black/75"
                    >
                      <div className="min-w-0">
                        {isMultiDay ? (
                          <>
                            <p className="font-semibold text-black">{offer.label}</p>
                            <ul className="mt-2 list-disc space-y-1 pl-5 capitalize">
                              {offer.dates.map((session, dateIndex) => (
                                <li key={session.id}>
                                  Partie {dateIndex + 1} — {formatSession(session)}
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <p className="capitalize">
                            {formatSession(offer.dates[0]!)}
                          </p>
                        )}
                      </div>
                      <ActivitySessionReserveTrigger
                        activityId={course.id}
                        activityTitle={course.title}
                        activityType="cours"
                        sessionId={offer.primarySessionId}
                        credits={course.credits}
                        price={course.price}
                        squareProductId={course.squareProductId}
                        isLoggedIn={!!user}
                        className={`${MARKETING_LINK_CLASS} cursor-pointer bg-transparent p-0 text-left`}
                      >
                        réserver
                      </ActivitySessionReserveTrigger>
                    </div>
                  );
                })
              ) : (
                <div className="space-y-5">
                  <p className="text-xl leading-normal text-black/75">
                    Aucune date n&apos;est disponible pour le moment.
                  </p>
                  <CourseInterestButton
                    activityId={course.id}
                    isLoggedIn={!!user}
                    isInterested={isInterested}
                    redirectPath={`/cours/${course.slug}`}
                  />
                </div>
              )}
            </div>
            <p className="mt-8">
              <Link
                href="/offrir"
                className={`${MARKETING_LINK_CLASS} text-lg`}
              >
                Offrir ce cours
              </Link>
            </p>
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
