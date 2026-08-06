import type { SupabaseClient } from "@supabase/supabase-js";

import {
  LEGAL_DOC_KEYS,
  LEGAL_REQUIRED_ERROR,
  type LegalDocumentRow,
  type UserLegalAcceptanceRow,
  type UserProfileRow,
} from "@/lib/legal/types";

export type LegalComplianceStatus = {
  complete: boolean;
  missingDocKeys: string[];
  imageRightsSet: boolean;
  imageRights: boolean | null;
  documents: LegalDocumentRow[];
  acceptances: UserLegalAcceptanceRow[];
  profile: UserProfileRow | null;
};

export async function getCurrentLegalDocuments(
  supabase: SupabaseClient,
): Promise<LegalDocumentRow[]> {
  const { data, error } = await supabase
    .from("legal_document")
    .select("id, doc_key, version, title, body_md, requires_signature, is_current")
    .eq("is_current", true)
    .in("doc_key", [...LEGAL_DOC_KEYS]);

  if (error) {
    console.error("Error loading legal documents:", error);
    return [];
  }

  return (data ?? []) as LegalDocumentRow[];
}

export async function getUserLegalCompliance(
  supabase: SupabaseClient,
  userId: string,
): Promise<LegalComplianceStatus> {
  const documents = await getCurrentLegalDocuments(supabase);

  const [{ data: acceptances }, { data: profile }] = await Promise.all([
    supabase
      .from("user_legal_acceptance")
      .select(
        "id, user_id, legal_document_id, typed_name, signature_path, channel, collected_by, accepted_at",
      )
      .eq("user_id", userId),
    supabase
      .from("user_profile")
      .select(
        "user_id, phone, address, birth_date, emergency_contact_name, emergency_contact_phone, insurance_company, insurance_policy_number, image_rights, admin_notes",
      )
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const acceptanceRows = (acceptances ?? []) as UserLegalAcceptanceRow[];
  const acceptedIds = new Set(
    acceptanceRows.map((row) => row.legal_document_id),
  );

  const missingDocKeys = documents
    .filter((doc) => doc.requires_signature && !acceptedIds.has(doc.id))
    .map((doc) => doc.doc_key);

  const profileRow = (profile as UserProfileRow | null) ?? null;
  const imageRightsSet = profileRow?.image_rights !== null && profileRow?.image_rights !== undefined;

  return {
    complete: missingDocKeys.length === 0 && imageRightsSet,
    missingDocKeys,
    imageRightsSet,
    imageRights: profileRow?.image_rights ?? null,
    documents,
    acceptances: acceptanceRows,
    profile: profileRow,
  };
}

export function legalDocsRequiredError() {
  return {
    error: LEGAL_REQUIRED_ERROR,
    message:
      "Avant de réserver, merci de signer le règlement intérieur et la décharge de responsabilité.",
  };
}

export function isLegalDocsRequiredError(error: string | null | undefined) {
  return error === LEGAL_REQUIRED_ERROR;
}
