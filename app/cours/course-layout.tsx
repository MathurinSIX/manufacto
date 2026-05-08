import Image from "next/image";
import Link from "next/link";

import { InstagramIcon } from "@/components/instagram-icon";
import { Course, formatPrice } from "./course-data";

const ASSETS = {
  logoMark: "/assets/figma-landing/logo-mark.png",
  accountIcon: "/assets/figma-landing/account-icon.png",
} as const;

const INSTAGRAM_URL = "https://www.instagram.com/manufacto.marseille/";

const navItems = [
  { href: "/atelier", label: "L'Atelier" },
  { href: "/cours", label: "Cours" },
  { href: "/pratique-libre", label: "Pratique libre" },
  { href: "/contact", label: "Contact" },
];

export function CourseNav() {
  return (
    <nav className="w-full bg-white">
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6 text-[12px] text-black md:px-10">
        <Link href="/" className="relative h-[24px] w-[108px] shrink-0">
          <Image
            src={ASSETS.logoMark}
            alt="Manufacto"
            fill
            className="object-contain object-left"
            priority
            sizes="108px"
          />
        </Link>

        <div className="hidden items-center gap-10 md:flex">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="hover:text-[#4a56dd]">
              {item.label}
            </Link>
          ))}
        </div>

        <Link
          href="/account"
          className="flex items-center gap-2 font-medium text-[#4a56dd] underline underline-offset-2"
        >
          <span className="hidden sm:inline">Mon compte</span>
          <Image src={ASSETS.accountIcon} alt="" width={16} height={14} aria-hidden />
        </Link>
      </div>
    </nav>
  );
}

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
        <div className="mt-3 text-[12px] font-medium leading-[1.18] tracking-[-0.01em] text-black md:text-[13px]">
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
      <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-12 text-[12px] md:grid-cols-[1fr_170px_170px_170px] md:px-10">
        <div>
          <p className="mb-20 text-[14px] leading-normal">Manufacto</p>
          <Link
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-6 w-6 items-center justify-center rounded"
            aria-label="Instagram"
          >
            <InstagramIcon className="h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-5 font-medium leading-normal">
          <div className="space-y-5 text-[#454545]">
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

        <div className="space-y-5 font-medium leading-normal">
          <div className="space-y-5 text-[#454545]">
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

        <div className="space-y-2 font-medium leading-normal">
          <p className="py-2">Contact</p>
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
