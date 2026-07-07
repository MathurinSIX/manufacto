"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function toggleCourseInterest(activityId: string) {
  if (!UUID_RE.test(activityId)) {
    return { error: "Cours invalide", interested: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Vous devez être connecté·e", interested: false };
  }

  const { data: existing, error: selectError } = await supabase
    .from("activity_interest")
    .select("id")
    .eq("user_id", user.id)
    .eq("activity_id", activityId)
    .maybeSingle();

  if (selectError) {
    console.error("Error checking course interest:", selectError);
    return { error: selectError.message, interested: false };
  }

  if (existing) {
    const { error: deleteError } = await supabase
      .from("activity_interest")
      .delete()
      .eq("id", existing.id);

    if (deleteError) {
      console.error("Error removing course interest:", deleteError);
      return { error: deleteError.message, interested: true };
    }

    revalidatePath("/cours", "layout");
    revalidatePath("/admin");
    return { error: null, interested: false };
  }

  const { error: insertError } = await supabase.from("activity_interest").insert({
    user_id: user.id,
    activity_id: activityId,
  });

  if (insertError) {
    console.error("Error adding course interest:", insertError);
    return { error: insertError.message, interested: false };
  }

  revalidatePath("/cours", "layout");
  revalidatePath("/admin");
  return { error: null, interested: true };
}
