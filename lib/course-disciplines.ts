export const COURSE_DISCIPLINE_VALUES = [
  "menuiserie",
  "couture",
  "electronique",
  "ceramique",
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
];

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
