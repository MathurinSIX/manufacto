import Image from "next/image";
import Link from "next/link";

import { P } from "@/components/mockups/shared";
import {
  COURSE_DISCIPLINE_COLORS,
  isCourseDiscipline,
  type CourseDiscipline,
} from "@/lib/course-disciplines";
import {
  Course,
  formatCredits,
  formatPrice,
  blurbFromCourseDescription,
} from "./course-data";

type CourseCardProps = {
  course: Course;
};

const DISCIPLINE_WORDS: Record<
  CourseDiscipline,
  { word: string; wordW: number; wordH: number }
> = {
  menuiserie: { word: P.wordMenuiserie, wordW: 496, wordH: 90 },
  couture: { word: P.wordCouture, wordW: 400, wordH: 90 },
  ceramique: { word: P.wordCeramique, wordW: 420, wordH: 90 },
  electronique: { word: P.wordElectronique, wordW: 480, wordH: 90 },
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

export function CourseCard({ course }: CourseCardProps) {
  const discipline = toDisciplineKey(course.discipline);
  const colors = COURSE_DISCIPLINE_COLORS[discipline];
  const wordMeta = DISCIPLINE_WORDS[discipline];
  const priceLabel = formatPrice(course.price);
  const creditsLabel = formatCredits(course.credits);
  const metaParts = [priceLabel ?? creditsLabel, course.duration].filter(Boolean);
  const blurb = blurbFromCourseDescription(course.description);

  return (
    <article className="flex h-full flex-col">
      <Link
        href={`/cours/${course.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-[19px] border border-black/8 transition hover:border-black/20 hover:shadow-sm"
        style={{ backgroundColor: colors.tint }}
      >
        <div className="relative h-44 shrink-0 sm:h-48">
          <Image
            src={course.image}
            alt={course.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 407px"
          />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <Image
            src={wordMeta.word}
            alt={course.discipline}
            width={wordMeta.wordW}
            height={wordMeta.wordH}
            className="h-7 w-auto object-contain object-left"
          />
          <h3 className="mt-4 text-lg font-bold leading-snug text-black/90 sm:text-xl">
            {course.title}
          </h3>
          {blurb ? (
            <p className="mt-2 text-base leading-snug text-black/65">{blurb}</p>
          ) : null}
          {metaParts.length > 0 ? (
            <p className="mt-2 text-sm font-medium text-black/55">
              {metaParts.join(" · ")}
            </p>
          ) : null}
          {course.level ? (
            <p className="mt-1 text-sm text-black/50">
              <span className="font-semibold text-black/60">Niveau</span>
              {" · "}
              {course.level}
            </p>
          ) : null}
          {course.audience ? (
            <p className="mt-1 text-sm text-black/50">
              <span className="font-semibold text-black/60">Public</span>
              {" · "}
              {course.audience}
            </p>
          ) : null}
          <span
            className="mt-auto pt-6 text-base font-semibold underline underline-offset-2 sm:text-lg"
            style={{ color: colors.fg }}
          >
            Voir le cours et les dates →
          </span>
        </div>
      </Link>
    </article>
  );
}

type CourseGridProps = {
  courses: Course[];
};

export function CourseGrid({ courses }: CourseGridProps) {
  return (
    <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
