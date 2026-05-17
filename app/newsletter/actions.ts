"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createNewsletterSubscription(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const wantsMonthlyCalendar = formData.get("wants_monthly_calendar") === "on";

  if (!name || !email) {
    redirect("/newsletter?error=required");
  }

  if (!EMAIL_RE.test(email)) {
    redirect("/newsletter?error=email");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("newsletter_subscription").insert({
    name,
    email,
    wants_monthly_calendar: wantsMonthlyCalendar,
  });

  if (error) {
    if (error.code === "23505") {
      redirect("/newsletter?success=1");
    }

    console.error("Error creating newsletter subscription:", error);
    redirect("/newsletter?error=server");
  }

  revalidatePath("/admin");
  redirect("/newsletter?success=1");
}
