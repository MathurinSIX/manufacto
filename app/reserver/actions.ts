"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  clampParticipantCount,
  sumParticipantCount,
} from "@/lib/participant-count";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createSessionSubscription(formData: FormData) {
  const sessionId = String(formData.get("session_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const participantCount = clampParticipantCount(
    Number.parseInt(String(formData.get("participant_count") ?? "1"), 10),
  );

  if (!UUID_RE.test(sessionId)) {
    redirect("/reserver?error=session");
  }

  if (!name) {
    redirect(`/reserver?session=${encodeURIComponent(sessionId)}&error=required`);
  }

  const supabase = await createClient();
  const { data: session } = await supabase
    .from("session")
    .select("id, start_ts, max_registrations")
    .eq("id", sessionId)
    .gte("start_ts", new Date().toISOString())
    .maybeSingle();

  if (!session) {
    redirect("/reserver?error=session");
  }

  if (session.max_registrations !== null) {
    const { data: subscriptions } = await supabase
      .from("public_session_subscription")
      .select("participant_count")
      .eq("session_id", sessionId);

    const currentCount = sumParticipantCount(subscriptions ?? []);
    if (currentCount + participantCount > session.max_registrations) {
      redirect(`/reserver?session=${encodeURIComponent(sessionId)}&error=full`);
    }
  }

  const { error } = await supabase.from("public_session_subscription").insert({
    session_id: sessionId,
    name,
    phone: phone || "",
    participant_count: participantCount,
  });

  if (error) {
    console.error("Error creating public session subscription:", error);
    redirect(`/reserver?session=${encodeURIComponent(sessionId)}&error=server`);
  }

  revalidatePath("/admin");
  revalidatePath("/reserver");
  redirect("/reserver?success=1");
}
