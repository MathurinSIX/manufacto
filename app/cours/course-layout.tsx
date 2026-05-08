import Image from "next/image";
import Link from "next/link";

import { Course, formatPrice } from "./course-data";

export function CourseCard({ course }: { course: Course }) {
  return (
    <Link href={`/cours/${course.slug}`} className="group block">
      <article>
        <div className="relative h-[101px] w-full overflow-hidden bg-[#d9d9d9] md:h-[128px]">
          <Image
            src={course.image}
            alt={course.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 285px"
          />
        </div>
        <div className="mt-3 text-xl leading-normal text-black/75">
          <p className="font-bold">{course.discipline} /</p>
          <p>{course.title}</p>
          <p>{formatPrice(course.price)}</p>
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
