"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { loadAccountShare } from "@/lib/account-share";
import {
  linkOrInviteAccountPartner,
  removeAccountPartnerRow,
} from "@/lib/account-partner";
import { getAdminClient } from "@/lib/square/server";

function personName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}) {
  const meta = user.user_metadata ?? {};
  const name = [meta.first_name, meta.last_name]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean)
    .join(" ");
  return name || user.email || "Un membre Manufacto";
}

async function requireActor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Non authentifié" as const, user: null, supabase, isAdmin: false };
  }
  const isAdmin = user.app_metadata?.role === "admin";
  return { error: null, user, supabase, isAdmin };
}

export async function addAccountPartner(email: string, targetUserId?: string) {
  const { error, user, supabase, isAdmin } = await requireActor();
  if (error || !user) {
    return { error: error ?? "Non authentifié", message: null, status: null };
  }

  let ownerUserId = user.id;
  let ownerName = personName(user);
  let ownerEmail = user.email ?? "";

  if (targetUserId && targetUserId !== user.id) {
    if (!isAdmin) {
      return { error: "Non autorisé", message: null, status: null };
    }
    ownerUserId = targetUserId;
    const admin = getAdminClient();
    const targetShare = await loadAccountShare(admin, targetUserId);
    if (!targetShare.isOwner) {
      return {
        error: "Cette personne est déjà liée à un autre compte.",
        message: null,
        status: null,
      };
    }
    const { data, error: userError } = await admin.auth.admin.getUserById(targetUserId);
    if (userError || !data.user) {
      return { error: "Utilisateur introuvable", message: null, status: null };
    }
    ownerName = personName(data.user);
    ownerEmail = data.user.email ?? "";
  } else {
    const share = await loadAccountShare(supabase, user.id);
    if (!share.isOwner) {
      return {
        error: "Seul le titulaire du compte peut ajouter une deuxième personne.",
        message: null,
        status: null,
      };
    }
    ownerUserId = share.accountUserId;
  }

  const result = await linkOrInviteAccountPartner({
    ownerUserId,
    ownerName,
    ownerEmail,
    partnerEmail: email,
  });

  revalidatePath("/account");
  revalidatePath(`/admin/users/${ownerUserId}`);
  return result;
}

export async function removeAccountPartner(targetUserId?: string) {
  const { error, user, supabase, isAdmin } = await requireActor();
  if (error || !user) {
    return { error: error ?? "Non authentifié" };
  }

  const share = await loadAccountShare(
    isAdmin && targetUserId ? getAdminClient() : supabase,
    targetUserId && isAdmin ? targetUserId : user.id,
  );

  if (!isAdmin && targetUserId && targetUserId !== user.id && targetUserId !== share.accountUserId) {
    return { error: "Non autorisé" };
  }

  if (!share.partner) {
    return { error: "Aucune deuxième personne sur ce compte." };
  }

  const canRemove =
    isAdmin || share.isOwner || share.partner.userId === user.id;
  if (!canRemove) {
    return { error: "Non autorisé" };
  }

  const removed = await removeAccountPartnerRow(share.accountUserId);
  revalidatePath("/account");
  revalidatePath(`/admin/users/${share.accountUserId}`);
  return removed;
}
