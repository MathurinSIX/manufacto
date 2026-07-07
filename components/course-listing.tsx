"use client";

import { useEffect, useMemo, useState } from "react";

import { Course, formatPrice } from "@/app/cours/course-data";
import { CourseGrid } from "@/app/cours/course-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

const ALL = "__all__";
const COURSES_PER_PAGE = 9;

type AvailabilityFilter =
  | typeof ALL
  | "upcoming"
  | "none"
  | "week"
  | "month";

type CourseListingProps = {
  courses: Course[];
  isLoggedIn: boolean;
  interestedActivityIds: string[];
};

function CourseFilterField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-[180px] flex-1", className)}>
      <p className="mb-2 text-sm font-semibold text-black/60">{label}</p>
      {children}
    </div>
  );
}

function matchesAvailabilityFilter(
  course: Course,
  availability: AvailabilityFilter,
): boolean {
  if (availability === ALL) {
    return true;
  }

  if (availability === "upcoming") {
    return course.hasUpcomingSessions;
  }

  if (availability === "none") {
    return !course.hasUpcomingSessions;
  }

  if (!course.nextSessionStart) {
    return false;
  }

  const nextSessionTime = new Date(course.nextSessionStart).getTime();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  if (availability === "week") {
    return nextSessionTime <= now + 7 * dayMs;
  }

  if (availability === "month") {
    return nextSessionTime <= now + 30 * dayMs;
  }

  return true;
}

export function CourseListing({
  courses,
  isLoggedIn,
  interestedActivityIds,
}: CourseListingProps) {
  const [discipline, setDiscipline] = useState(ALL);
  const [price, setPrice] = useState(ALL);
  const [duration, setDuration] = useState(ALL);
  const [level, setLevel] = useState(ALL);
  const [audience, setAudience] = useState(ALL);
  const [availability, setAvailability] = useState<AvailabilityFilter>(ALL);
  const [currentPage, setCurrentPage] = useState(1);

  const disciplineOptions = useMemo(() => {
    return Array.from(new Set(courses.map((course) => course.discipline))).sort((left, right) =>
      left.localeCompare(right, "fr"),
    );
  }, [courses]);

  const priceOptions = useMemo(() => {
    return Array.from(
      new Set(
        courses
          .map((course) => course.price)
          .filter((value): value is number => value !== null),
      ),
    ).sort((left, right) => left - right);
  }, [courses]);

  const durationOptions = useMemo(() => {
    return Array.from(
      new Set(
        courses
          .map((course) => course.duration)
          .filter((value) => value.length > 0),
      ),
    ).sort((left, right) => left.localeCompare(right, "fr"));
  }, [courses]);

  const levelOptions = useMemo(() => {
    return Array.from(
      new Set(
        courses
          .map((course) => course.level)
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((left, right) => left.localeCompare(right, "fr"));
  }, [courses]);

  const audienceOptions = useMemo(() => {
    return Array.from(
      new Set(
        courses
          .map((course) => course.audience)
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((left, right) => left.localeCompare(right, "fr"));
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      if (discipline !== ALL && course.discipline !== discipline) {
        return false;
      }

      if (price !== ALL && String(course.price) !== price) {
        return false;
      }

      if (duration !== ALL && course.duration !== duration) {
        return false;
      }

      if (level !== ALL && course.level !== level) {
        return false;
      }

      if (audience !== ALL && course.audience !== audience) {
        return false;
      }

      return matchesAvailabilityFilter(course, availability);
    });
  }, [audience, availability, courses, discipline, duration, level, price]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / COURSES_PER_PAGE));

  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * COURSES_PER_PAGE;
    return filteredCourses.slice(startIndex, startIndex + COURSES_PER_PAGE);
  }, [currentPage, filteredCourses]);

  useEffect(() => {
    setCurrentPage(1);
  }, [audience, discipline, duration, level, price, availability]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const hasActiveFilters =
    discipline !== ALL ||
    price !== ALL ||
    duration !== ALL ||
    level !== ALL ||
    audience !== ALL ||
    availability !== ALL;

  const resetFilters = () => {
    setDiscipline(ALL);
    setPrice(ALL);
    setDuration(ALL);
    setLevel(ALL);
    setAudience(ALL);
    setAvailability(ALL);
    setCurrentPage(1);
  };

  const selectTriggerClassName =
    "h-11 rounded-full border-black/15 bg-white text-base text-black/80 shadow-none";

  return (
    <div className="space-y-8">
      <div className="rounded-[18px] border border-black/10 bg-[#fff8f0] p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <CourseFilterField label="Discipline">
            <Select value={discipline} onValueChange={setDiscipline}>
              <SelectTrigger className={selectTriggerClassName}>
                <SelectValue placeholder="Toutes les disciplines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Toutes les disciplines</SelectItem>
                {disciplineOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CourseFilterField>

          <CourseFilterField label="Prix">
            <Select value={price} onValueChange={setPrice}>
              <SelectTrigger className={selectTriggerClassName}>
                <SelectValue placeholder="Tous les prix" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tous les prix</SelectItem>
                {priceOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {formatPrice(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CourseFilterField>

          <CourseFilterField label="Durée">
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className={selectTriggerClassName}>
                <SelectValue placeholder="Toutes les durées" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Toutes les durées</SelectItem>
                {durationOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CourseFilterField>

          <CourseFilterField label="Niveau">
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className={selectTriggerClassName}>
                <SelectValue placeholder="Tous les niveaux" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tous les niveaux</SelectItem>
                {levelOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CourseFilterField>

          <CourseFilterField label="Public">
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger className={selectTriggerClassName}>
                <SelectValue placeholder="Tous les publics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tous les publics</SelectItem>
                {audienceOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CourseFilterField>

          <CourseFilterField label="Prochaine disponibilité" className="min-w-[220px]">
            <Select
              value={availability}
              onValueChange={(value) => setAvailability(value as AvailabilityFilter)}
            >
              <SelectTrigger className={selectTriggerClassName}>
                <SelectValue placeholder="Toutes les disponibilités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Toutes les disponibilités</SelectItem>
                <SelectItem value="upcoming">Dates à venir</SelectItem>
                <SelectItem value="week">Dans les 7 prochains jours</SelectItem>
                <SelectItem value="month">Dans les 30 prochains jours</SelectItem>
                <SelectItem value="none">Sans date pour le moment</SelectItem>
              </SelectContent>
            </Select>
          </CourseFilterField>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="h-11 rounded-full border border-black/15 px-4 text-sm font-semibold text-black/70 transition hover:bg-white"
            >
              Réinitialiser
            </button>
          ) : null}
        </div>
      </div>

      <p className="text-base text-black/60">
        {filteredCourses.length} cours
        {hasActiveFilters ? " correspondant aux filtres" : ""}
      </p>

      {filteredCourses.length > 0 ? (
        <>
          <CourseGrid
            courses={paginatedCourses}
            isLoggedIn={isLoggedIn}
            interestedActivityIds={interestedActivityIds}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={COURSES_PER_PAGE}
            totalItems={filteredCourses.length}
          />
        </>
      ) : (
        <div className="rounded-[18px] border border-dashed border-black/15 px-6 py-12 text-center text-lg text-black/60">
          Aucun cours ne correspond à ces filtres.
        </div>
      )}
    </div>
  );
}
