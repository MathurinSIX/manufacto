import { unstable_noStore } from "next/cache";

import { GIFT_COURSE_CATEGORIES } from "@/lib/gift-cards/course-categories";
import { createClient } from "@/lib/supabase/server";

export type GiftCourseExample = {
  activityId: string;
  name: string;
  discipline: string | null;
  price: number;
  nextSessionStart: string | null;
};

export type GiftCourseCategoryWithExamples = {
  id: string;
  label: string;
  amountCents: number;
  credits: number;
  description: string;
  examples: GiftCourseExample[];
};

export async function getGiftCourseCategoriesWithExamples(): Promise<
  GiftCourseCategoryWithExamples[]
> {
  unstable_noStore();

  const supabase = await createClient();
  const prices = GIFT_COURSE_CATEGORIES.map((category) => category.amountCents / 100);
  const nowIso = new Date().toISOString();

  const { data: activities, error } = await supabase
    .from("activity")
    .select("id, name, discipline, price")
    .eq("type", "cours")
    .is("deleted_at", null)
    .in("price", prices)
    .order("name");

  if (error) {
    console.error("Error loading gift course examples:", error);
  }

  const activityIds = (activities ?? []).map((activity) => activity.id);
  const nextByActivity = new Map<string, string>();

  if (activityIds.length > 0) {
    const { data: sessions, error: sessionsError } = await supabase
      .from("session")
      .select("activity_id, start_ts")
      .in("activity_id", activityIds)
      .gte("start_ts", nowIso)
      .order("start_ts", { ascending: true });

    if (sessionsError) {
      console.error("Error loading gift course sessions:", sessionsError);
    } else {
      for (const session of sessions ?? []) {
        if (!nextByActivity.has(session.activity_id)) {
          nextByActivity.set(session.activity_id, session.start_ts);
        }
      }
    }
  }

  return GIFT_COURSE_CATEGORIES.map((category) => {
    const priceEuros = category.amountCents / 100;
    const examples = (activities ?? [])
      .filter((activity) => Number(activity.price) === priceEuros)
      .map((activity) => ({
        activityId: activity.id,
        name: activity.name,
        discipline: activity.discipline,
        price: Number(activity.price),
        nextSessionStart: nextByActivity.get(activity.id) ?? null,
      }))
      .sort((a, b) => {
        if (a.nextSessionStart && b.nextSessionStart) {
          return a.nextSessionStart.localeCompare(b.nextSessionStart);
        }
        if (a.nextSessionStart) return -1;
        if (b.nextSessionStart) return 1;
        return a.name.localeCompare(b.name, "fr");
      })
      .slice(0, 4);

    return {
      id: category.id,
      label: category.label,
      amountCents: category.amountCents,
      credits: category.credits,
      description: category.description,
      examples,
    };
  });
}
