import { unstable_noStore } from "next/cache";

import {
  blurbFromCourseDescription,
  enrichCoursesForListing,
  getCoursesFromDb,
  sortCoursesForListing,
  type Course,
} from "@/app/cours/course-data";
import {
  FEATURED_COURSES,
  P,
  type FeaturedCourse,
} from "@/components/mockups/shared";
import {
  isCourseDiscipline,
  type CourseDiscipline,
} from "@/lib/course-disciplines";
import { createClient } from "@/lib/supabase/server";

const MAX_FEATURED = 8;

/** Prefer one course per flagship universe first (homepage carousel). */
const FEATURED_UNIVERSE_ORDER: CourseDiscipline[] = [
  "menuiserie",
  "couture",
  "ceramique",
  "electronique",
];

function preferFeaturedTitle(discipline: CourseDiscipline, title: string) {
  const normalized = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (discipline === "ceramique") {
    return normalized.includes("modelage") || normalized.includes("initiation");
  }
  if (discipline === "electronique") {
    return normalized.includes("repair");
  }
  return false;
}

function orderFeaturedCourses(courses: Course[]): Course[] {
  const remaining = [...courses];
  const picked: Course[] = [];

  for (const discipline of FEATURED_UNIVERSE_ORDER) {
    const preferredIndex = remaining.findIndex(
      (course) =>
        toDisciplineKey(course.discipline) === discipline &&
        preferFeaturedTitle(discipline, course.title),
    );
    const index =
      preferredIndex >= 0
        ? preferredIndex
        : remaining.findIndex(
            (course) => toDisciplineKey(course.discipline) === discipline,
          );
    if (index < 0) continue;
    picked.push(remaining.splice(index, 1)[0]!);
  }

  return [...picked, ...remaining].slice(0, MAX_FEATURED);
}

const DISCIPLINE_WORDS: Record<
  CourseDiscipline,
  { word: string; wordW: number; wordH: number }
> = {
  menuiserie: { word: P.wordMenuiserie, wordW: 496, wordH: 90 },
  couture: { word: P.wordCouture, wordW: 279, wordH: 63 },
  ceramique: { word: P.wordCeramique, wordW: 428, wordH: 130 },
  electronique: { word: P.wordElectronique, wordW: 466, wordH: 124 },
  autre: { word: P.wordMenuiserie, wordW: 496, wordH: 90 },
};

function toDisciplineKey(label: string): CourseDiscipline {
  const normalized = label
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (isCourseDiscipline(normalized)) {
    return normalized;
  }
  if (normalized.includes("couture")) return "couture";
  if (normalized.includes("ceramique")) return "ceramique";
  if (normalized.includes("electronique")) return "electronique";
  return "menuiserie";
}

function toFeaturedCourse(course: Course): FeaturedCourse {
  const discipline = toDisciplineKey(course.discipline);
  const wordMeta = DISCIPLINE_WORDS[discipline];

  return {
    title: course.title,
    blurb:
      blurbFromCourseDescription(course.description) ??
      "Dates et inscription sur la page du cours.",
    image: course.image,
    word: wordMeta.word,
    wordW: wordMeta.wordW,
    wordH: wordMeta.wordH,
    discipline,
    href: `/cours/${course.slug}`,
  };
}

/** Upcoming courses for the homepage carousel — uses each course’s real photos. */
export async function getFeaturedCoursesWithImages(): Promise<
  FeaturedCourse[]
> {
  unstable_noStore();

  const supabase = await createClient();
  const nowIso = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const [{ data: activities, error }, { data: futureSessions, error: sessionsError }] =
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
        .gte("start_ts", nowIso)
        .order("start_ts", { ascending: true }),
    ]);

  if (error) {
    console.error("Error fetching featured courses", error);
    return [...FEATURED_COURSES];
  }

  if (sessionsError) {
    console.error("Error fetching featured course sessions", sessionsError);
  }

  const courseIds = new Set((activities ?? []).map((activity) => activity.id));
  const courseFutureSessions = (futureSessions ?? []).filter((session) =>
    courseIds.has(session.activity_id),
  );

  const upcoming = sortCoursesForListing(
    enrichCoursesForListing(
      getCoursesFromDb(
        activities?.map((activity) => ({
          ...activity,
          durationMinutes: null,
        })),
      ),
      courseFutureSessions,
      courseFutureSessions,
    ),
  ).filter((course) => course.hasUpcomingSessions);

  if (upcoming.length === 0) {
    return FEATURED_COURSES.slice(0, 4);
  }

  // First four cards = one course per flagship universe when possible
  const universeOrder: CourseDiscipline[] = [
    "menuiserie",
    "couture",
    "ceramique",
    "electronique",
  ];
  const preferredTitle: Partial<Record<CourseDiscipline, RegExp>> = {
    ceramique: /modelage/i,
    electronique: /repair\s*caf[eé]/i,
  };

  const picked: Course[] = [];
  const used = new Set<string>();

  for (const discipline of universeOrder) {
    const candidates = upcoming.filter(
      (course) => toDisciplineKey(course.discipline) === discipline,
    );
    const preferred = preferredTitle[discipline]
      ? candidates.find((course) => preferredTitle[discipline]!.test(course.title))
      : undefined;
    const chosen = preferred ?? candidates[0];
    if (chosen) {
      picked.push(chosen);
      used.add(chosen.slug);
    }
  }

  for (const course of upcoming) {
    if (picked.length >= MAX_FEATURED) break;
    if (used.has(course.slug)) continue;
    picked.push(course);
    used.add(course.slug);
  }

  return picked.map(toFeaturedCourse);
}
