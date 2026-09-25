import type { SupabaseClient } from "@supabase/supabase-js";

import {
  isValidAccountEmail,
  normalizeAccountEmail,
  type AccountPartnerStatus,
} from "@/lib/account-share";
import { getAuthSiteUrl } from "@/lib/auth-redirect";
import { sendEmail } from "@/lib/email/resend";
import { getAdminClient } from "@/lib/square/server";

type AuthLookup = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  is_admin: boolean;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function displayName(parts: Array<string | null | undefined>, fallback: string) {
  const name = parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  return name || fallback;
}

async function lookupAuthUserByEmail(email: string): Promise<AuthLookup | null> {
  const admin = getAdminClient();
  const { data, error } = await admin.rpc("lookup_auth_user_by_email", {
    target_email: email,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) return null;
  return row as AuthLookup;
}

async function ensureSecondMemberName(
  admin: SupabaseClient,
  ownerUserId: string,
  secondName: string,
) {
  const name = secondName.trim();
  if (!name) return;

  const { data: profile } = await admin
    .from("user_profile")
    .select("member_names")
    .eq("user_id", ownerUserId)
    .maybeSingle();

  const current = Array.isArray(profile?.member_names)
    ? (profile.member_names as string[]).map((entry) => entry.trim()).filter(Boolean)
    : [];

  if (current.length >= 2) return;

  const next = [...current, name].slice(0, 2);
  await admin.from("user_profile").upsert(
    {
      user_id: ownerUserId,
      member_names: next,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}

function inviteEmailHtml({
  ownerName,
  signupUrl,
}: {
  ownerName: string;
  signupUrl: string;
}) {
  const safeName = escapeHtml(ownerName);
  return `<p>Bonjour,</p>
<p><strong>${safeName}</strong> vous invite à partager son compte Manufacto. Vous verrez les mêmes crédits et les mêmes réservations, et pourrez choisir qui participe à chaque cours.</p>
<p>Créez votre compte avec cette adresse e-mail&nbsp;:</p>
<p><a href="${signupUrl}">${signupUrl}</a></p>
<p>À bientôt à l'atelier.</p>`;
}

function linkedEmailHtml({
  ownerName,
  loginUrl,
}: {
  ownerName: string;
  loginUrl: string;
}) {
  const safeName = escapeHtml(ownerName);
  return `<p>Bonjour,</p>
<p>Votre compte est maintenant lié à celui de <strong>${safeName}</strong>. En vous connectant, vous entrez sur le même foyer&nbsp;: crédits, réservations et choix de la personne qui vient au cours.</p>
<p><a href="${loginUrl}">Se connecter</a></p>`;
}

export async function linkOrInviteAccountPartner(input: {
  ownerUserId: string;
  ownerName: string;
  ownerEmail: string;
  partnerEmail: string;
}): Promise<{ error: string | null; message: string | null; status: AccountPartnerStatus | null }> {
  const email = normalizeAccountEmail(input.partnerEmail);
  if (!isValidAccountEmail(email)) {
    return { error: "Adresse e-mail invalide.", message: null, status: null };
  }

  if (email === normalizeAccountEmail(input.ownerEmail)) {
    return {
      error: "Cette adresse est déjà celle du titulaire.",
      message: null,
      status: null,
    };
  }

  const admin = getAdminClient();
  const { data: existingLink, error: existingError } = await admin
    .from("account_partner")
    .select("owner_user_id, partner_email, status")
    .eq("owner_user_id", input.ownerUserId)
    .maybeSingle();

  if (existingError) {
    return { error: existingError.message, message: null, status: null };
  }

  if (existingLink) {
    return {
      error: "Ce compte a déjà une deuxième personne. Retirez-la avant d'en ajouter une autre.",
      message: null,
      status: null,
    };
  }

  let existingUser: AuthLookup | null = null;
  try {
    existingUser = await lookupAuthUserByEmail(email);
  } catch (lookupError) {
    return {
      error:
        lookupError instanceof Error
          ? lookupError.message
          : "Impossible de vérifier cette adresse.",
      message: null,
      status: null,
    };
  }

  if (existingUser?.is_admin) {
    return {
      error: "Cette adresse ne peut pas être ajoutée.",
      message: null,
      status: null,
    };
  }

  if (existingUser && existingUser.id === input.ownerUserId) {
    return {
      error: "Cette adresse est déjà celle du titulaire.",
      message: null,
      status: null,
    };
  }

  const status: AccountPartnerStatus = existingUser ? "active" : "pending";
  const { error: insertError } = await admin.from("account_partner").insert({
    owner_user_id: input.ownerUserId,
    partner_email: email,
    partner_user_id: existingUser?.id ?? null,
    status,
  });

  if (insertError) {
    const message = insertError.message.toLowerCase();
    if (message.includes("already") || message.includes("duplicate") || message.includes("unique")) {
      return {
        error: "Cette personne est déjà liée à un compte.",
        message: null,
        status: null,
      };
    }
    return { error: insertError.message, message: null, status: null };
  }

  const partnerName = existingUser
    ? displayName([existingUser.first_name, existingUser.last_name], "")
    : "";
  if (partnerName) {
    await ensureSecondMemberName(admin, input.ownerUserId, existingUser?.first_name?.trim() || partnerName);
  }

  const siteUrl = getAuthSiteUrl();
  if (existingUser) {
    const { data: credits } = await admin
      .from("credit")
      .select("amount")
      .eq("user_id", existingUser.id);
    const existingCredits =
      credits?.reduce((total, row) => {
        const amount = typeof row.amount === "number" ? row.amount : Number(row.amount) || 0;
        return total + amount;
      }, 0) ?? 0;

    await sendEmail({
      to: email,
      subject: "Votre compte Manufacto est lié",
      html: linkedEmailHtml({
        ownerName: input.ownerName,
        loginUrl: `${siteUrl}/auth/login`,
      }),
    });
    return {
      error: null,
      status,
      message:
        existingCredits > 0
          ? "Compte lié. Cette personne se connecte sur ce foyer. Ses crédits personnels ne sont pas fusionnés ici."
          : "Compte lié. Cette personne se connecte comme d'habitude et voit ce foyer.",
    };
  }

  const signupUrl = `${siteUrl}/auth/sign-up?${new URLSearchParams({
    email,
    invite: "1",
  }).toString()}`;

  const sent = await sendEmail({
    to: email,
    subject: "Invitation à rejoindre un compte Manufacto",
    html: inviteEmailHtml({
      ownerName: input.ownerName,
      signupUrl,
    }),
  });

  if (!sent.ok) {
    return {
      error: null,
      status,
      message:
        "Invitation enregistrée, mais l'e-mail n'a pas pu être envoyé. La personne peut créer un compte avec cette adresse.",
    };
  }

  return {
    error: null,
    status,
    message: "Invitation envoyée. La personne doit créer son compte avec cette adresse.",
  };
}

export async function removeAccountPartnerRow(ownerUserId: string) {
  const admin = getAdminClient();
  const { error } = await admin
    .from("account_partner")
    .delete()
    .eq("owner_user_id", ownerUserId);

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

/** Attach a newly created login to a pending household invite. */
export async function claimAccountPartnerInvite(input: {
  userId: string;
  email: string;
  firstName?: string | null;
}) {
  const email = normalizeAccountEmail(input.email);
  if (!email) return;

  const admin = getAdminClient();
  const { data: invite, error } = await admin
    .from("account_partner")
    .select("owner_user_id")
    .eq("partner_email", email)
    .eq("status", "pending")
    .is("partner_user_id", null)
    .maybeSingle();

  if (error || !invite?.owner_user_id) return;

  const { error: updateError } = await admin
    .from("account_partner")
    .update({
      partner_user_id: input.userId,
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("owner_user_id", invite.owner_user_id)
    .eq("status", "pending");

  if (updateError) {
    console.error("Error claiming account partner invite:", updateError);
    return;
  }

  if (input.firstName?.trim()) {
    await ensureSecondMemberName(admin, invite.owner_user_id, input.firstName.trim());
  }
}
