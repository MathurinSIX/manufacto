"use client";

import { useState } from "react";
import Image from "next/image";

const CRAFT_WORDS = ["menuiserie", "couture", "electronique", "ceramique"] as const;
type CraftWordKey = (typeof CRAFT_WORDS)[number];

const WORDS_PATH = "/assets/words";
const CRAFT_COLORS: Record<CraftWordKey, string> = {
  menuiserie: "orange",
  couture: "bleue",
  electronique: "verte",
  ceramique: "rose",
};

const WORD_LABELS: Record<CraftWordKey, string> = {
  menuiserie: "menuiserie",
  couture: "couture",
  electronique: "électronique",
  ceramique: "céramique",
};

/** Couture is shorter, so use smaller height. w-auto ensures width scales with height on small screens. */
const WORD_SIZE: Record<CraftWordKey, string> = {
  menuiserie: "h-5 sm:h-6 md:h-7 lg:h-8 xl:h-9 w-auto max-w-full",
  couture: "h-4 sm:h-5 md:h-6 lg:h-7 xl:h-8 w-auto max-w-full",
  electronique: "h-6 sm:h-8 md:h-9 lg:h-10 xl:h-11 w-auto max-w-full",
  ceramique: "h-6 sm:h-8 md:h-9 lg:h-10 xl:h-11 w-auto max-w-full",
};

interface WordImageProps {
  word: CraftWordKey;
  alt: string;
  className?: string;
}

export function WordImage({ word, alt, className = "" }: WordImageProps) {
  const [error, setError] = useState(false);
  const src = `${WORDS_PATH}/${CRAFT_COLORS[word]}/${word}.png`;

  if (error) {
    return (
      <span className={`inline-block align-middle ${className}`}>
        {WORD_LABELS[word]}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={180}
      height={60}
      className={`inline-block align-middle object-contain object-center ${WORD_SIZE[word]} ${className}`}
      sizes="(max-width: 640px) 120px, (max-width: 768px) 140px, (max-width: 1024px) 160px, 180px"
      onError={() => setError(true)}
    />
  );
}
