import { CourseImageCarousel } from "@/components/course-image-carousel";
import { DISCIPLINE_CAROUSEL_PHOTOS } from "@/lib/site-photo-sets";
import type { CourseDiscipline } from "@/lib/course-disciplines";
import { cn } from "@/lib/utils";

export function DisciplinePhotoCarousel({
  discipline,
  alt,
  className,
  compact = false,
  priority = false,
  images,
}: {
  discipline: CourseDiscipline;
  alt: string;
  className?: string;
  compact?: boolean;
  priority?: boolean;
  images?: readonly string[];
}) {
  const resolved = images ?? DISCIPLINE_CAROUSEL_PHOTOS[discipline];
  if (!resolved?.length) {
    return null;
  }

  return (
    <div className={cn("relative overflow-hidden rounded-[19px] bg-[#d9d9d9]", className)}>
      <CourseImageCarousel
        images={[...resolved]}
        alt={alt}
        compact={compact}
        priority={priority}
        sizes="(max-width: 768px) 100vw, 640px"
      />
    </div>
  );
}
