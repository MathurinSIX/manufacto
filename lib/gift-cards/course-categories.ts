/** Official course gift tiers (atelier tarifs: catégorie 01 / 02 / 03). */
export const GIFT_COURSE_CATEGORIES = [
  {
    id: "cat-01",
    label: "Catégorie 01",
    amountCents: 5000,
    credits: 10,
    description: "Cours d’initiation et ateliers courts.",
  },
  {
    id: "cat-02",
    label: "Catégorie 02",
    amountCents: 7200,
    credits: 15,
    description: "Ateliers projets et formations intermédiaires.",
  },
  {
    id: "cat-03",
    label: "Catégorie 03",
    amountCents: 10000,
    credits: 20,
    description: "Formations machines et projets plus longs.",
  },
] as const;

export type GiftCourseCategoryId = (typeof GIFT_COURSE_CATEGORIES)[number]["id"];

export function getGiftCourseCategory(id: string) {
  return GIFT_COURSE_CATEGORIES.find((category) => category.id === id) ?? null;
}

export function getGiftCourseCategoryByAmount(amountCents: number) {
  return (
    GIFT_COURSE_CATEGORIES.find((category) => category.amountCents === amountCents) ??
    null
  );
}
