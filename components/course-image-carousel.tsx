"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type CourseImageCarouselProps = {
  images: string[];
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
};

export function CourseImageCarousel({
  images,
  alt,
  className,
  imageClassName,
  sizes = "100vw",
  priority = false,
}: CourseImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultipleImages = images.length > 1;
  const activeImage = images[activeIndex] ?? images[0];

  if (!activeImage) {
    return null;
  }

  const goToPrevious = () => {
    setActiveIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  };

  const goToNext = () => {
    setActiveIndex((current) => (current === images.length - 1 ? 0 : current + 1));
  };

  return (
    <div className={cn("group relative h-full w-full overflow-hidden", className)}>
      <Image
        key={activeImage}
        src={activeImage}
        alt={hasMultipleImages ? `${alt} — photo ${activeIndex + 1}` : alt}
        fill
        className={cn("object-cover", imageClassName)}
        sizes={sizes}
        priority={priority && activeIndex === 0}
      />

      {hasMultipleImages ? (
        <>
          <button
            type="button"
            onClick={goToPrevious}
            aria-label="Photo précédente"
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition hover:bg-black/60 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white group-hover:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            aria-label="Photo suivante"
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition hover:bg-black/60 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white group-hover:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                aria-label={`Afficher la photo ${index + 1}`}
                aria-current={index === activeIndex}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition",
                  index === activeIndex ? "bg-white" : "bg-white/50 hover:bg-white/75",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
