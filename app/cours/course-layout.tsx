import Image from "next/image";
import Link from "next/link";

import { Course, formatCredits, formatPrice } from "./course-data";

export function CourseCard({ course }: { course: Course }) {
  const priceLabel = formatPrice(course.price);
  const creditsLabel = formatCredits(course.credits);
  const metaLabel = priceLabel ?? creditsLabel;

  return (
    <Link href={`/cours/${course.slug}`} className="group block">
      <article>
        <div className="relative h-[128px] w-full overflow-hidden bg-[#d9d9d9] md:h-[156px]">
          <Image
            src={course.image}
            alt={course.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 407px"
          />
        </div>
        <div className="mt-3 text-xl leading-normal text-black/75">
          <p className="font-bold">{course.discipline} /</p>
          <p>{course.title}</p>
          {metaLabel ? (
            <p>
              {metaLabel}
              {course.duration ? ` · ${course.duration}` : ""}
            </p>
          ) : null}
          {(course.level || course.audience) && (
            <p className="mt-1 text-base leading-normal text-black/60">
              {[course.level, course.audience].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}

export function CourseGrid({ courses }: { courses: Course[] }) {
  return (
    <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course, index) => (
        <CourseCard key={`${course.id}-${index}`} course={course} />
      ))}
    </div>
  );
}
