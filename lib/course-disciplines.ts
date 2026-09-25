export const COURSE_DISCIPLINE_VALUES = [
  "menuiserie",
  "couture",
  "electronique",
  "ceramique",
  "autre",
] as const;

export type CourseDiscipline = (typeof COURSE_DISCIPLINE_VALUES)[number];

export const COURSE_DISCIPLINE_OPTIONS: {
  value: CourseDiscipline;
  label: string;
}[] = [
  { value: "menuiserie", label: "Menuiserie" },
  { value: "couture", label: "Couture" },
  { value: "electronique", label: "Électronique" },
  { value: "ceramique", label: "Céramique" },
  { value: "autre", label: "Autre" },
];

/**
 * Brand colors per discipline — match the handwritten word images shown in the
 * landing-page hero strip (orange / bleue / verte / rose).
 */
export type DisciplineColors = {
  /** Strong color, used for text & accents. */
  fg: string;
  /** Soft tint, used for filled pill backgrounds. */
  tint: string;
  /** Border tint, used for outlined day cells. */
  border: string;
};

export const COURSE_DISCIPLINE_COLORS: Record<CourseDiscipline, DisciplineColors> = {
  menuiserie: { fg: "#f56800", tint: "#fff3e8", border: "#f56800" },
  couture: { fg: "#4a56dd", tint: "#f0f1ff", border: "#4a56dd" },
  electronique: { fg: "#20b75a", tint: "#e8faee", border: "#20b75a" },
  ceramique: { fg: "#d73459", tint: "#fdebef", border: "#d73459" },
  autre: { fg: "#5c5c5c", tint: "#f3f3f3", border: "#5c5c5c" },
};

const COURSE_DISCIPLINE_LABELS = new Map<string, string>(
  COURSE_DISCIPLINE_OPTIONS.map((option) => [option.value, option.label]),
);

export function isCourseDiscipline(value: string): value is CourseDiscipline {
  return COURSE_DISCIPLINE_VALUES.includes(value as CourseDiscipline);
}

export function formatCourseDiscipline(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return COURSE_DISCIPLINE_LABELS.get(normalized) ?? null;
}

/** Normalize DB `discipline` + optional `disciplines[]` into a unique ordered list of keys. */
export function normalizeActivityDisciplines(
  discipline?: string | null,
  disciplines?: string[] | null,
): CourseDiscipline[] {
  const keys: CourseDiscipline[] = [];
  const seen = new Set<string>();

  const push = (raw: string | null | undefined) => {
    if (!raw) return;
    const normalized = raw
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    if (!isCourseDiscipline(normalized) || seen.has(normalized)) return;
    seen.add(normalized);
    keys.push(normalized);
  };

  for (const value of disciplines ?? []) {
    push(value);
  }
  push(discipline);

  return keys;
}

export function primaryActivityDiscipline(
  discipline?: string | null,
  disciplines?: string[] | null,
): CourseDiscipline | null {
  return normalizeActivityDisciplines(discipline, disciplines)[0] ?? null;
}

export function inferPracticeDiscipline(
  name: string,
  discipline?: string | null,
): CourseDiscipline | null {
  if (discipline && isCourseDiscipline(discipline)) {
    return discipline;
  }

  const normalizedName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalizedName.includes("menuiserie") || normalizedName.includes("bois")) {
    return "menuiserie";
  }
  if (normalizedName.includes("couture")) {
    return "couture";
  }
  if (normalizedName.includes("ceramique") || normalizedName.includes("cuisson")) {
    return "ceramique";
  }
  if (normalizedName.includes("electronique") || normalizedName.includes("repair cafe")) {
    return "electronique";
  }

  return null;
}
