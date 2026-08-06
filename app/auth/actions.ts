"use server";

import { sendAccountAccessEmail } from "@/lib/auth/invite-user";
import { getPasswordSetupRedirectUrl } from "@/lib/auth-redirect";

export async function requestPasswordReset(email: string) {
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    return { error: "L'email est requis" };
  }

  try {
    const result = await sendAccountAccessEmail(
      normalizedEmail,
      getPasswordSetupRedirectUrl(),
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
