import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

export function getResendFromEmail() {
  return process.env.RESEND_FROM_EMAIL ?? "Manufacto <contact@manufacto-marseille.fr>";
}

export function getResendReplyToEmail() {
  return process.env.RESEND_REPLY_TO_EMAIL ?? "contact@manufacto-marseille.fr";
}

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
  listUnsubscribeUrl,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  /** Optional absolute unsubscribe URL (newsletter / marketing only). */
  listUnsubscribeUrl?: string;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY is not configured; skipping email send.");
    return { ok: false as const, error: "RESEND_API_KEY is not configured" };
  }

  const headers: Record<string, string> = {};
  if (listUnsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${listUnsubscribeUrl}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  const { error } = await resend.emails.send({
    from: getResendFromEmail(),
    to,
    subject,
    html,
    replyTo: replyTo ?? getResendReplyToEmail(),
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
  });

  if (error) {
    console.error("Resend email error:", error);
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const, error: null };
}
