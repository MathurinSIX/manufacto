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

/** Couture is shorter, so use smaller height */
const WORD_SIZE: Record<CraftWordKey, string> = {
  menuiserie: "h-8 sm:h-9 md:h-10 lg:h-11",
  couture: "h-5 sm:h-6 md:h-7 lg:h-8",
  electronique: "h-8 sm:h-9 md:h-10 lg:h-11",
  ceramique: "h-8 sm:h-9 md:h-10 lg:h-11",
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
      onError={() => setError(true)}
    />
  );
}
