"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  bookingParticipantsAreValid,
  clampParticipantCount,
  normalizeBookingParticipants,
  sumParticipantCount,
} from "@/lib/participant-count";
import { sendEmail } from "@/lib/email/resend";
import { formatSessionDate, formatSessionTime } from "@/lib/email/format-session";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createSessionSubscription(formData: FormData) {
  const sessionId = String(formData.get("session_id") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const participantCount = clampParticipantCount(
    Number.parseInt(String(formData.get("participant_count") ?? "1"), 10),
  );
  const participants = normalizeBookingParticipants(
    Array.from({ length: participantCount }, (_, index) => ({
      name: String(formData.getAll("participant_names")[index] ?? ""),
      email: String(formData.getAll("participant_emails")[index] ?? ""),
    })),
  );
  const name = participants[0]?.name ?? "";

  if (!UUID_RE.test(sessionId)) {
    redirect("/reserver?error=session");
  }

  if (!bookingParticipantsAreValid(participants)) {
    redirect(`/reserver?session=${encodeURIComponent(sessionId)}&error=required`);
  }

  const supabase = await createClient();
  const { data: session } = await supabase
    .from("session")
    .select("id, start_ts, max_registrations, activity:activity_id(name)")
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

  const participantNames = participants.map((participant) => participant.name);
  const participantEmails = participants.map((participant) => participant.email);
  const { error } = await supabase.from("public_session_subscription").insert({
    session_id: sessionId,
    name,
    phone: phone || "",
    participant_count: participantCount,
    companion_first_names: participantNames.slice(1),
    participant_names: participantNames,
    participant_emails: participantEmails,
  });

  if (error) {
    console.error("Error creating public session subscription:", error);
    redirect(`/reserver?session=${encodeURIComponent(sessionId)}&error=server`);
  }

  const activity = Array.isArray(session.activity) ? session.activity[0] : session.activity;
  const activityName = activity?.name ?? "Manufacto";
  const whenLabel = `${formatSessionDate(session.start_ts)} à ${formatSessionTime(session.start_ts)}`;
  const seen = new Set<string>();
  for (const participant of participants) {
    if (!participant.email || seen.has(participant.email)) continue;
    seen.add(participant.email);
    void sendEmail({
      to: participant.email,
      subject: `Votre place — ${activityName}`,
      html: `<p>Bonjour ${participant.name.replaceAll("<", "")},</p><p>Une place est réservée pour vous à <strong>${activityName.replaceAll("<", "")}</strong>, le ${whenLabel}.</p>`,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/reserver");
  redirect("/reserver?success=1");
}
