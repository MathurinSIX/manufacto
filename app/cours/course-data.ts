export type Course = {
  id: string;
  slug: string;
  discipline: string;
  title: string;
  image: string;
  price: number | null;
  squareProductId: string | null;
  credits: number | null;
  duration: string;
  level: string | null;
  audience: string | null;
  description: string;
  sessions: string[];
};

import { formatCourseDiscipline } from "@/lib/course-disciplines";

export type DbCourse = {
  id: string;
  name: string | null;
  description: string | null;
  image_url: string | null;
  nb_credits: number | null;
  price: number | null;
  square_product_id: string | null;
  created_at?: string | null;
  level: string | null;
  audience: string | null;
  discipline: string | null;
};

const DEFAULT_COURSE_IMAGE = "/assets/homepage/Frame 42.jpg";
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

export function getCoursesFromDb(data?: DbCourse[] | null): Course[] {
  if (!data?.length) {
    return [];
  }

  return data.map((activity) => {
    const name = activity.name?.trim() || "Cours";
    const { discipline, title } = splitCourseName(name, activity.discipline);
    const displayTitle = title || name;

    return {
      id: activity.id,
      slug: slugify(displayTitle),
      discipline,
      title: displayTitle,
      image: activity.image_url || DEFAULT_COURSE_IMAGE,
      price: activity.price,
      squareProductId: activity.square_product_id,
      credits: activity.nb_credits,
      duration: "3h",
      level: activity.level,
      audience: activity.audience,
      description: activity.description || DEFAULT_COURSE_DESCRIPTION,
      sessions: [],
    };
  });
}

export function getCourseBySlug(slug: string, courses: Course[]) {
  return courses.find((course) => course.slug === slug) || null;
}
