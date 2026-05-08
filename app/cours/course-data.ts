export type Course = {
  id: string;
  slug: string;
  discipline: string;
  title: string;
  image: string;
  price: number | null;
  credits: number | null;
  description: string;
  sessions: string[];
};

export type DbCourse = {
  id: string;
  name: string | null;
  description: string | null;
  image_url: string | null;
  nb_credits: number | null;
  price: number | null;
};

const COURSE_IMAGE = "/assets/figma-landing/hero-wood.png";

export const fallbackCourses: Course[] = [
  {
    id: "initiation-assemblages",
    slug: "initiation-assemblages-traditionnels",
    discipline: "Menuiserie",
    title: "Initiation aux assemblages traditionnels",
    image: COURSE_IMAGE,
    price: 50,
    credits: 10,
    description:
      "Découvrir les gestes de base du travail du bois et apprendre à préparer des assemblages simples à la main.",
    sessions: [
      "Vendredi 25 avril - 14h / 17h",
      "Vendredi 25 avril - 14h / 17h",
      "Vendredi 25 avril - 14h / 17h",
    ],
  },
  {
    id: "degauchisseuse-raboteuse",
    slug: "degauchisseuse-raboteuse",
    discipline: "Menuiserie",
    title: "Formation dégauchisseuse / raboteuse",
    image: COURSE_IMAGE,
    price: 50,
    credits: 10,
    description:
      "Prendre en main les machines de préparation du bois, comprendre les réglages et travailler en sécurité.",
    sessions: [
      "Vendredi 25 avril - 14h / 17h",
      "Vendredi 25 avril - 14h / 17h",
      "Vendredi 25 avril - 14h / 17h",
    ],
  },
  {
    id: "surjeteuse",
    slug: "formation-surjeteuse",
    discipline: "Couture",
    title: "Formation surjeteuse",
    image: COURSE_IMAGE,
    price: 50,
    credits: 10,
    description:
      "Apprendre à enfiler, régler et utiliser une surjeteuse pour réaliser des finitions propres et solides.",
    sessions: [
      "Vendredi 25 avril - 14h / 17h",
      "Vendredi 25 avril - 14h / 17h",
      "Vendredi 25 avril - 14h / 17h",
    ],
  },
];

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function splitCourseName(name: string) {
  const [discipline, ...rest] = name.split("/");

  if (rest.length === 0) {
    return {
      discipline: "Menuiserie",
      title: name,
    };
  }

  return {
    discipline: discipline.trim(),
    title: rest.join("/").trim(),
  };
}

export function formatPrice(price: number | null) {
  if (price === null) {
    return "50€";
  }

  return `${Number.isInteger(price) ? price : price.toFixed(2)}€`;
}

export function getCoursesFromDb(data?: DbCourse[] | null): Course[] {
  if (!data?.length) {
    return [...fallbackCourses, ...fallbackCourses];
  }

  return data.map((activity, index) => {
    const name = activity.name || fallbackCourses[index % fallbackCourses.length].title;
    const fallback = fallbackCourses[index % fallbackCourses.length];
    const { discipline, title } = splitCourseName(name);

    return {
      id: activity.id || fallback.id,
      slug: slugify(title || name || fallback.title),
      discipline,
      title: title || fallback.title,
      image: activity.image_url || fallback.image,
      price: activity.price ?? fallback.price,
      credits: activity.nb_credits ?? fallback.credits,
      description: activity.description || fallback.description,
      sessions: fallback.sessions,
    };
  });
}

export function getCourseBySlug(slug: string, courses: Course[]) {
  return courses.find((course) => course.slug === slug) || courses[0];
}
