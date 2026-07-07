export type Course = {
  id: string;
  slug: string;
  discipline: string;
  title: string;
  image: string;
  images: string[];
  price: number | null;
  squareProductId: string | null;
  credits: number | null;
  duration: string;
  level: string | null;
  audience: string | null;
  description: string;
  sessions: string[];
  hasUpcomingSessions: boolean;
};

import { formatCourseDiscipline } from "@/lib/course-disciplines";

export type DbCourse = {
  id: string;
  name: string | null;
  description: string | null;
  image_url: string | null;
  image_urls?: string[] | null;
  nb_credits: number | null;
  price: number | null;
  square_product_id: string | null;
  created_at?: string | null;
  level: string | null;
  audience: string | null;
  discipline: string | null;
  durationMinutes?: number | null;
};

export const DEFAULT_COURSE_IMAGE = "/assets/homepage/Vector.jpg";

export function resolveActivityImages(
  imageUrl: string | null | undefined,
  imageUrls: string[] | null | undefined,
): string[] {
  const fromArray = (imageUrls ?? [])
    .map((url) => url.trim())
    .filter(Boolean);

  if (fromArray.length > 0) {
    return fromArray;
  }

  if (imageUrl?.trim()) {
    return [imageUrl.trim()];
  }

  return [DEFAULT_COURSE_IMAGE];
}

const DEFAULT_COURSE_DESCRIPTION =
  "Les informations détaillées de ce cours seront bientôt disponibles.";
const DEFAULT_COURSE_DISCIPLINE = "Menuiserie";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function splitCourseName(name: string, disciplineFromDb?: string | null) {
  const fromDb = formatCourseDiscipline(disciplineFromDb);
  if (fromDb) {
    const titleFromPrefix = name.includes("/")
      ? name.split("/").slice(1).join("/").trim()
      : name.trim();
    return {
      discipline: fromDb,
      title: titleFromPrefix || name.trim(),
    };
  }

  const [discipline, ...rest] = name.split("/");
  const displayDiscipline =
    formatCourseDiscipline(discipline.trim()) ?? DEFAULT_COURSE_DISCIPLINE;

  if (rest.length === 0) {
    return {
      discipline: displayDiscipline,
      title: name,
    };
  }

  return {
    discipline: displayDiscipline,
    title: rest.join("/").trim(),
  };
}

export function formatPrice(price: number | null) {
  if (price === null) {
    return null;
  }

  return `${Number.isInteger(price) ? price : price.toFixed(2)}€`;
}

export function formatCredits(credits: number | null) {
  if (credits === null) {
    return null;
  }

  return `${credits} crédit${credits !== 1 ? "s" : ""}`;
}

export function getSessionDurationMinutes(startTs: string, endTs: string): number {
  return Math.round(
    (new Date(endTs).getTime() - new Date(startTs).getTime()) / 60_000,
  );
}

export function formatCourseDurationMinutes(minutes: number): string | null {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return null;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (remainder === 0) {
    return `${hours}h`;
  }

  if (hours === 0) {
    return `${remainder} min`;
  }

  return `${hours}h${remainder.toString().padStart(2, "0")}`;
}

export function buildCourseDurationMinutesByActivityId(
  sessions: Array<{ activity_id: string; start_ts: string; end_ts: string }>,
): Map<string, number> {
  const durations = new Map<string, number>();

  for (const session of sessions) {
    if (durations.has(session.activity_id)) {
      continue;
    }

    const minutes = getSessionDurationMinutes(session.start_ts, session.end_ts);
    if (minutes > 0) {
      durations.set(session.activity_id, minutes);
    }
  }

  return durations;
}

export function getCoursesFromDb(data?: DbCourse[] | null): Course[] {
  if (!data?.length) {
    return [];
  }

  return data.map((activity) => {
    const name = activity.name?.trim() || "Cours";
    const { discipline, title } = splitCourseName(name, activity.discipline);
    const displayTitle = title || name;

    const images = resolveActivityImages(activity.image_url, activity.image_urls);

    return {
      id: activity.id,
      slug: slugify(displayTitle),
      discipline,
      title: displayTitle,
      image: images[0],
      images,
      price: activity.price,
      squareProductId: activity.square_product_id,
      credits: activity.nb_credits,
      duration:
        formatCourseDurationMinutes(activity.durationMinutes ?? 0) ?? "",
      level: activity.level,
      audience: activity.audience,
      description: activity.description || DEFAULT_COURSE_DESCRIPTION,
      sessions: [],
      hasUpcomingSessions: false,
    };
  });
}

export function getCourseBySlug(slug: string, courses: Course[]) {
  return courses.find((course) => course.slug === slug) || null;
}

export function enrichCoursesWithSessionAvailability(
  courses: Course[],
  activityIdsWithUpcomingSessions: Set<string>,
): Course[] {
  return courses.map((course) => ({
    ...course,
    hasUpcomingSessions: activityIdsWithUpcomingSessions.has(course.id),
  }));
}

export function sortCoursesForListing(courses: Course[]): Course[] {
  return [...courses].sort((left, right) => {
    if (left.hasUpcomingSessions !== right.hasUpcomingSessions) {
      return left.hasUpcomingSessions ? -1 : 1;
    }

    return left.title.localeCompare(right.title, "fr");
  });
}
