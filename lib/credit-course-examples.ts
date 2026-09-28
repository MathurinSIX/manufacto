import { unstable_noStore } from "next/cache";

import type {
  CreditCourseExample,
  PracticeCreditRate,
} from "@/lib/credit-course-matches";
import { resolveActivityImages } from "@/app/cours/course-data";
import { createClient } from "@/lib/supabase/server";

export type { CreditCourseExample, PracticeCreditRate };

export async function loadCreditCourseExamples(): Promise<CreditCourseExample[]> {
  unstable_noStore();
  const supabase = await createClient();

  const { data: activities, error } = await supabase
    .from("activity")
    .select("id, name, nb_credits, image_url, image_urls")
    .eq("type", "cours")
    .is("deleted_at", null)
    .not("nb_credits", "is", null)
    .order("name");

  if (error) {
    console.error("Error loading course examples for credits:", error);
    return [];
  }

  const rows = (activities ?? [])
    .map((activity) => ({
      activityId: activity.id,
      name: activity.name,
      credits: Number(activity.nb_credits),
      imageUrl: resolveActivityImages(activity.image_url, activity.image_urls)[0],
    }))
    .filter((activity) => Number.isFinite(activity.credits) && activity.credits > 0);

  const nextByActivity = new Map<string, string>();
  if (rows.length > 0) {
    const { data: sessions, error: sessionsError } = await supabase
      .from("session")
      .select("activity_id, start_ts")
      .in(
        "activity_id",
        rows.map((activity) => activity.activityId),
      )
      .gte("start_ts", new Date().toISOString())
      .order("start_ts", { ascending: true });

    if (sessionsError) {
      console.error("Error loading course example dates:", sessionsError);
    } else {
      for (const session of sessions ?? []) {
        if (!nextByActivity.has(session.activity_id)) {
          nextByActivity.set(session.activity_id, session.start_ts);
        }
      }
    }
  }

  return rows
    .map((activity) => ({
      ...activity,
      nextSessionStart: nextByActivity.get(activity.activityId) ?? null,
    }))
    .sort((left, right) => left.credits - right.credits || left.name.localeCompare(right.name, "fr"));
}

export async function loadPracticeCreditRates(): Promise<PracticeCreditRate[]> {
  unstable_noStore();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity")
    .select("id, name, type, nb_credits")
    .in("type", ["autonomie", "autonomie_encadree"])
    .is("deleted_at", null)
    .order("name");

  if (error) {
    console.error("Error loading practice credit rates:", error);
    return [];
  }

  return (data ?? [])
    .map((activity) => ({
      id: activity.id,
      type: activity.type as PracticeCreditRate["type"],
      name: activity.name,
      creditsPerHour: Number(activity.nb_credits),
    }))
    .filter(
      (activity) =>
        (activity.type === "autonomie" || activity.type === "autonomie_encadree") &&
        Number.isFinite(activity.creditsPerHour) &&
        activity.creditsPerHour > 0,
    );
}
