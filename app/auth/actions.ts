"use server";

import { sendAccountAccessEmail } from "@/lib/auth/invite-user";

function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    return { error: "L'email est requis" };
  }

  try {
    const result = await sendAccountAccessEmail(
      normalizedEmail,
      `${getSiteUrl()}/auth/update-password`,
    );

    if (result.error) {
      return { error: result.error };
    }

    return { error: null };
  } catch {
    return {
      error: "Une erreur s'est produite lors de l'envoi de l'e-mail",
    };
  }
}
