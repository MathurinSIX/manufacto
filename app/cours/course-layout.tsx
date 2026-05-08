import Image from "next/image";
import Link from "next/link";

import { InstagramIcon } from "@/components/instagram-icon";
import { Course, formatPrice } from "./course-data";

const INSTAGRAM_URL = "https://www.instagram.com/manufacto.marseille/";

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

export function CourseFooter() {
  return (
    <footer className="mt-auto border-t border-black/10 bg-white">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-12 text-base md:grid-cols-[1fr_187px_187px_187px]">
        <div>
          <p className="mb-20 text-2xl leading-normal">Manufacto</p>
          <Link
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded"
            aria-label="Instagram"
          >
            <InstagramIcon className="h-6 w-6" />
          </Link>
        </div>

        <div className="space-y-6 font-medium leading-normal">
          <div className="space-y-6 text-[#454545]">
            <Link href="/atelier" className="block hover:text-black">
              L&apos;Atelier
            </Link>
            <Link href="/cours" className="block hover:text-black">
              Cours
            </Link>
            <Link href="/pratique-libre" className="block hover:text-black">
              Pratique libre
            </Link>
          </div>
        </div>

        <div className="space-y-6 font-medium leading-normal">
          <div className="space-y-6 text-[#454545]">
            <Link href="/contact" className="block hover:text-black">
              Contact
            </Link>
            <Link href="/activities" className="block hover:text-black">
              Calendrier
            </Link>
            <Link href="/account" className="block hover:text-black">
              Mon compte
            </Link>
          </div>
        </div>

        <div className="space-y-3 font-medium leading-normal">
          <p className="py-3">Contact</p>
          <div className="space-y-1 text-[#454545]">
            <a href="tel:+33607080910" className="block hover:text-black">
              06 07 08 09 10
            </a>
            <a href="mailto:contact@manufacto-marseille.com" className="block hover:text-black">
              contact@manufacto-marseille.com
            </a>
            <p>8 rue de Locarno</p>
            <p>13005 Marseille</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
