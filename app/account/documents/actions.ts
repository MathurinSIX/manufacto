"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/square/server";
import {
  getCurrentLegalDocuments,
  getUserLegalCompliance,
} from "@/lib/legal/status";
import { LEGAL_DOC_KEYS, type LegalAcceptanceChannel } from "@/lib/legal/types";
import { resolveAccountUserId } from "@/lib/account-share";

export type SubmitLegalPackInput = {
  targetUserId?: string;
  channel: LegalAcceptanceChannel;
  typedName: string;
  signatureDataUrl: string;
  acceptReglement: boolean;
  acceptDecharge: boolean;
  imageRights: boolean;
  phone?: string;
  address?: string;
  birthDate?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  certifyInsurance: boolean;
};

function parseDataUrl(dataUrl: string) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

async function requireActor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Non authentifié", user: null, supabase };
  }
  return { error: null, user, supabase };
}

export async function getLegalSigningState(targetUserId?: string) {
  const { error, user, supabase } = await requireActor();
  if (error || !user) {
    return { error: error ?? "Non authentifié", status: null };
  }

  const isAdmin = user.app_metadata?.role === "admin";
  const accountUserId = await resolveAccountUserId(supabase, user.id);
  const userId = targetUserId && isAdmin ? targetUserId : accountUserId;

  if (
    targetUserId &&
    targetUserId !== user.id &&
    targetUserId !== accountUserId &&
    !isAdmin
  ) {
    return { error: "Non autorisé", status: null };
  }

  const status = await getUserLegalCompliance(supabase, userId);
  return { error: null, status, userId, isAdmin };
}

export async function submitLegalPack(input: SubmitLegalPackInput) {
  const { error, user, supabase } = await requireActor();
  if (error || !user) {
    return { error: error ?? "Non authentifié" };
  }

  const isAdmin = user.app_metadata?.role === "admin";
  const accountUserId = await resolveAccountUserId(supabase, user.id);
  const targetUserId =
    input.targetUserId && isAdmin ? input.targetUserId : accountUserId;

  if (
    input.targetUserId &&
    input.targetUserId !== user.id &&
    input.targetUserId !== accountUserId &&
    !isAdmin
  ) {
    return { error: "Non autorisé" };
  }

  if (!input.acceptReglement || !input.acceptDecharge) {
    return { error: "Vous devez accepter le règlement et la décharge." };
  }

  if (typeof input.imageRights !== "boolean") {
    return { error: "Indiquez votre choix pour le droit à l’image." };
  }

  const typedName = input.typedName.trim();
  if (typedName.length < 2) {
    return { error: "Indiquez votre nom complet." };
  }

  if (!input.certifyInsurance) {
    return {
      error:
        "Vous devez certifier disposer d’une assurance responsabilité civile.",
    };
  }

  if (
    !input.emergencyContactName.trim() ||
    !input.emergencyContactPhone.trim()
  ) {
    return {
      error: "Renseignez la personne à prévenir (obligatoire pour la décharge).",
    };
  }

  const parsedSignature = parseDataUrl(input.signatureDataUrl);
  if (!parsedSignature) {
    return { error: "Signature invalide. Merci de signer à nouveau." };
  }

  const channel: LegalAcceptanceChannel =
    input.targetUserId && isAdmin && input.targetUserId !== user.id
      ? "on_site"
      : input.channel === "on_site"
        ? "on_site"
        : "online";

  const documents = await getCurrentLegalDocuments(supabase);
  const requiredDocs = documents.filter((doc) =>
    LEGAL_DOC_KEYS.includes(doc.doc_key as (typeof LEGAL_DOC_KEYS)[number]),
  );

  if (requiredDocs.length < LEGAL_DOC_KEYS.length) {
    return { error: "Documents légaux introuvables. Contactez l’atelier." };
  }

  const adminClient = getAdminClient();
  const extension = parsedSignature.contentType.split("/")[1] ?? "png";
  const signaturePath = `${targetUserId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await adminClient.storage
    .from("legal-signatures")
    .upload(signaturePath, parsedSignature.buffer, {
      contentType: parsedSignature.contentType,
      upsert: false,
    });

  if (uploadError) {
    console.error("Signature upload failed:", uploadError);
    return { error: "Impossible d’enregistrer la signature." };
  }

  const headerStore = await headers();
  const ipAddress =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    null;
  const userAgent = headerStore.get("user-agent");

  const profilePayload = {
    user_id: targetUserId,
    phone: input.phone?.trim() || null,
    address: input.address?.trim() || null,
    birth_date: input.birthDate?.trim() || null,
    emergency_contact_name: input.emergencyContactName.trim(),
    emergency_contact_phone: input.emergencyContactPhone.trim(),
    image_rights: input.imageRights,
    updated_at: new Date().toISOString(),
  };

  const { error: profileError } = await adminClient
    .from("user_profile")
    .upsert(profilePayload, { onConflict: "user_id" });

  if (profileError) {
    console.error("Profile upsert failed:", profileError);
    return { error: "Impossible d’enregistrer le profil." };
  }

  const acceptanceRows = requiredDocs.map((doc) => ({
    user_id: targetUserId,
    legal_document_id: doc.id,
    typed_name: typedName,
    signature_path: signaturePath,
    channel,
    collected_by: channel === "on_site" ? user.id : null,
    ip_address: ipAddress,
    user_agent: userAgent,
  }));

  const { error: acceptanceError } = await adminClient
    .from("user_legal_acceptance")
    .upsert(acceptanceRows, { onConflict: "user_id,legal_document_id" });

  if (acceptanceError) {
    console.error("Acceptance upsert failed:", acceptanceError);
    return { error: "Impossible d’enregistrer les signatures." };
  }

  revalidatePath("/account");
  revalidatePath("/account/documents");
  revalidatePath("/admin");
  revalidatePath(`/admin/users/${targetUserId}`);

  return { error: null };
}

export async function updateUserHabilitations(
  userId: string,
  selectedKeys: string[],
  labelsByKey: Record<string, string>,
) {
  const { error, user } = await requireActor();
  if (error || !user) {
    return { error: error ?? "Non authentifié" };
  }
  if (user.app_metadata?.role !== "admin") {
    return { error: "Non autorisé" };
  }

  const adminClient = getAdminClient();
  const { data: existing } = await adminClient
    .from("user_habilitation")
    .select("id, machine_key")
    .eq("user_id", userId);

  const existingKeys = new Set((existing ?? []).map((row) => row.machine_key));
  const nextKeys = new Set(selectedKeys);

  const toDelete = [...existingKeys].filter((key) => !nextKeys.has(key));
  if (toDelete.length > 0) {
    await adminClient
      .from("user_habilitation")
      .delete()
      .eq("user_id", userId)
      .in("machine_key", toDelete);
  }

  const toInsert = [...nextKeys]
    .filter((key) => !existingKeys.has(key))
    .map((key) => ({
      user_id: userId,
      machine_key: key,
      label: labelsByKey[key] ?? key,
      granted_by: user.id,
    }));

  if (toInsert.length > 0) {
    const { error: insertError } = await adminClient
      .from("user_habilitation")
      .insert(toInsert);
    if (insertError) {
      return { error: insertError.message };
    }
  }

  revalidatePath(`/admin/users/${userId}`);
  return { error: null };
}

export async function updateAdminNotes(userId: string, notes: string) {
  const { error, user } = await requireActor();
  if (error || !user) {
    return { error: error ?? "Non authentifié" };
  }
  if (user.app_metadata?.role !== "admin") {
    return { error: "Non autorisé" };
  }

  const adminClient = getAdminClient();
  const { error: upsertError } = await adminClient.from("user_profile").upsert(
    {
      user_id: userId,
      admin_notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (upsertError) {
    return { error: upsertError.message };
  }

  revalidatePath(`/admin/users/${userId}`);
  return { error: null };
}

export async function updateHouseholdMembers(
  userId: string,
  memberNames: string[],
  childNames: string[],
) {
  const { error, user, supabase } = await requireActor();
  if (error || !user) {
    return { error: error ?? "Non authentifié" };
  }

  const isAdmin = user.app_metadata?.role === "admin";
  const accountUserId = await resolveAccountUserId(supabase, user.id);
  if (!isAdmin && user.id !== userId && accountUserId !== userId) {
    return { error: "Non autorisé" };
  }

  const normalizedMembers = memberNames
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 2);
  const normalizedChildren = childNames
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 8);

  if (normalizedMembers.length === 0) {
    return { error: "Indiquez au moins un prénom d'adulte" };
  }

  const adminClient = getAdminClient();
  const { error: upsertError } = await adminClient.from("user_profile").upsert(
    {
      user_id: userId,
      member_names: normalizedMembers,
      child_names: normalizedChildren,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (upsertError) {
    return { error: upsertError.message };
  }

  revalidatePath("/account");
  revalidatePath("/account/documents");
  revalidatePath(`/admin/users/${userId}`);
  return { error: null };
}

export async function getSignatureSignedUrl(path: string) {
  const { error, user, supabase } = await requireActor();
  if (error || !user) {
    return { error: error ?? "Non authentifié", url: null };
  }

  const adminClient = getAdminClient();
  const isAdmin = user.app_metadata?.role === "admin";
  const accountUserId = await resolveAccountUserId(supabase, user.id);
  if (
    !isAdmin &&
    !path.startsWith(`${user.id}/`) &&
    !path.startsWith(`${accountUserId}/`)
  ) {
    return { error: "Non autorisé", url: null };
  }

  const { data, error: signError } = await adminClient.storage
    .from("legal-signatures")
    .createSignedUrl(path, 60 * 10);

  if (signError || !data?.signedUrl) {
    return { error: signError?.message ?? "URL indisponible", url: null };
  }

  return { error: null, url: data.signedUrl };
}
