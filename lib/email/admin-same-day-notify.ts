import { formatSessionDate, formatSessionTime } from "@/lib/email/format-session";
import { sendEmail } from "@/lib/email/resend";

function getAdminNotifyEmail(): string | null {
  const configured = process.env.ADMIN_NOTIFY_EMAIL?.trim();
  if (configured) return configured;
  return "contact@manufacto-marseille.fr";
}

export async function notifyAdminSameDayRegistration({
  registrationId,
  userEmail,
  userName,
  activityName,
  startTs,
  endTs,
}: {
  registrationId: string;
  userEmail?: string;
  userName: string;
  activityName: string;
  startTs: string;
  endTs: string;
}) {
  const to = getAdminNotifyEmail();
  if (!to) {
    return { ok: false as const, error: "No admin notify email configured" };
  }

  const sessionDate = formatSessionDate(startTs);
  const sessionTime = `${formatSessionTime(startTs)} – ${formatSessionTime(endTs)}`;

  const html = `
    <p>Nouvelle réservation <strong>le jour même</strong>.</p>
    <p>
      <strong>Participant :</strong> ${escapeHtml(userName)}
      ${userEmail ? `(${escapeHtml(userEmail)})` : ""}
    </p>
    <p><strong>Activité :</strong> ${escapeHtml(activityName)}</p>
    <p><strong>Date :</strong> ${escapeHtml(sessionDate)}<br>
    <strong>Horaires :</strong> ${escapeHtml(sessionTime)}</p>
    <p style="color:#888;font-size:12px">Réf. inscription : ${escapeHtml(registrationId)}</p>
  `;

  return sendEmail({
    to,
    subject: `[Jour J] Réservation — ${activityName} · ${sessionTime}`,
    html,
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
