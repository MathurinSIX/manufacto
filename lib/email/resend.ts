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

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY is not configured; skipping email send.");
    return { ok: false as const, error: "RESEND_API_KEY is not configured" };
  }

  const { error } = await resend.emails.send({
    from: getResendFromEmail(),
    to,
    subject,
    html,
  });

  if (error) {
    console.error("Resend email error:", error);
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const, error: null };
}
