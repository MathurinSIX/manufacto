import Image from "next/image";
import Link from "next/link";

import { CourseInterestButton } from "@/components/course-interest-button";
import { Course, formatCredits, formatPrice } from "./course-data";

type CourseCardProps = {
  course: Course;
  isLoggedIn: boolean;
  isInterested: boolean;
};

export function CourseCard({ course, isLoggedIn, isInterested }: CourseCardProps) {
  const priceLabel = formatPrice(course.price);
  const creditsLabel = formatCredits(course.credits);
  const metaLabel = priceLabel ?? creditsLabel;

  return (
    <article>
      <Link href={`/cours/${course.slug}`} className="group block">
        <div className="relative h-[180px] w-full overflow-hidden bg-[#d9d9d9] md:h-[230px]">
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
          {metaLabel || course.duration ? (
            <p>
              {[metaLabel, course.duration].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          {course.level ? (
            <p className="mt-1 text-base leading-normal text-black/60">
              <span className="font-semibold text-black/70">Niveau</span>
              {" · "}
              {course.level}
            </p>
          ) : null}
          {course.audience ? (
            <p className="mt-1 text-base leading-normal text-black/60">
              <span className="font-semibold text-black/70">Public</span>
              {" · "}
              {course.audience}
            </p>
          ) : null}
        </div>
      </Link>

      {!course.hasUpcomingSessions ? (
        <div className="mt-3 space-y-3">
          <p className="text-base text-black/50">Aucune date pour le moment</p>
          <CourseInterestButton
            activityId={course.id}
            isLoggedIn={isLoggedIn}
            isInterested={isInterested}
            redirectPath={`/cours/${course.slug}`}
          />
        </div>
      ) : null}
    </article>
  );
}

type CourseGridProps = {
  courses: Course[];
  isLoggedIn: boolean;
  interestedActivityIds: string[];
};

export function CourseGrid({
  courses,
  isLoggedIn,
  interestedActivityIds,
}: CourseGridProps) {
  const interestedSet = new Set(interestedActivityIds);

  return (
    <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          isLoggedIn={isLoggedIn}
          isInterested={interestedSet.has(course.id)}
        />
      ))}
    </div>
  );
}
