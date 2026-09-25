import type { SupabaseClient } from "@supabase/supabase-js";

import {
  LEGAL_DOC_KEYS,
  LEGAL_REQUIRED_ERROR,
  type LegalDocumentRow,
  type UserLegalAcceptanceRow,
  type UserProfileRow,
} from "@/lib/legal/types";

export type SignedLegalDocument = {
  docKey: string;
  title: string;
  version: string;
  signed: boolean;
  acceptedAt: string | null;
  typedName: string | null;
  signaturePath: string | null;
  channel: UserLegalAcceptanceRow["channel"] | null;
};

export type LegalComplianceStatus = {
  complete: boolean;
  missingDocKeys: string[];
  imageRightsSet: boolean;
  imageRights: boolean | null;
  documents: LegalDocumentRow[];
  acceptances: UserLegalAcceptanceRow[];
  profile: UserProfileRow | null;
  signedDocuments: SignedLegalDocument[];
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

const PROFILE_COLUMNS =
  "user_id, phone, address, birth_date, emergency_contact_name, emergency_contact_phone, insurance_company, insurance_policy_number, image_rights, admin_notes, member_names, child_names";

const ACCEPTANCE_COLUMNS =
  "id, user_id, legal_document_id, typed_name, signature_path, channel, collected_by, accepted_at";

function pickProfile(rows: UserProfileRow[]) {
  return (
    rows.find((row) => row.image_rights !== null && row.image_rights !== undefined) ??
    rows.find((row) => row.phone || row.address || row.emergency_contact_name) ??
    rows[0] ??
    null
  );
}

export async function getUserLegalCompliance(
  supabase: SupabaseClient,
  userId: string,
  options?: { alsoUserIds?: string[] },
): Promise<LegalComplianceStatus> {
  const userIds = [...new Set([userId, ...(options?.alsoUserIds ?? [])])].filter(
    Boolean,
  );
  const documents = await getCurrentLegalDocuments(supabase);

  const [{ data: acceptances }, { data: profiles }] = await Promise.all([
    supabase
      .from("user_legal_acceptance")
      .select(ACCEPTANCE_COLUMNS)
      .in("user_id", userIds),
    supabase.from("user_profile").select(PROFILE_COLUMNS).in("user_id", userIds),
  ]);

  const acceptanceRows = (acceptances ?? []) as UserLegalAcceptanceRow[];
  const acceptedIds = [...new Set(acceptanceRows.map((row) => row.legal_document_id))];
  const knownDocIds = new Set(documents.map((doc) => doc.id));
  const missingSignedIds = acceptedIds.filter((id) => !knownDocIds.has(id));

  let signedVersions: Pick<LegalDocumentRow, "id" | "doc_key" | "version" | "title">[] =
    [];
  if (missingSignedIds.length > 0) {
    const { data } = await supabase
      .from("legal_document")
      .select("id, doc_key, version, title")
      .in("id", missingSignedIds);
    signedVersions = (data ?? []) as typeof signedVersions;
  }

  const docById = new Map<string, { doc_key: string; version: string; title: string }>();
  for (const doc of documents) {
    docById.set(doc.id, doc);
  }
  for (const doc of signedVersions) {
    docById.set(doc.id, doc);
  }

  const acceptanceByKey = new Map<string, UserLegalAcceptanceRow>();
  for (const row of acceptanceRows) {
    const doc = docById.get(row.legal_document_id);
    if (!doc) continue;
    const existing = acceptanceByKey.get(doc.doc_key);
    if (
      !existing ||
      new Date(row.accepted_at).getTime() > new Date(existing.accepted_at).getTime()
    ) {
      acceptanceByKey.set(doc.doc_key, row);
    }
  }

  const missingDocKeys = documents
    .filter((doc) => doc.requires_signature && !acceptanceByKey.has(doc.doc_key))
    .map((doc) => doc.doc_key);

  const signedDocuments: SignedLegalDocument[] = documents.map((doc) => {
    const acceptance = acceptanceByKey.get(doc.doc_key);
    const signedDoc = acceptance ? docById.get(acceptance.legal_document_id) : null;
    return {
      docKey: doc.doc_key,
      title: doc.title,
      version: signedDoc?.version ?? doc.version,
      signed: Boolean(acceptance),
      acceptedAt: acceptance?.accepted_at ?? null,
      typedName: acceptance?.typed_name ?? null,
      signaturePath: acceptance?.signature_path ?? null,
      channel: acceptance?.channel ?? null,
    };
  });

  if (signedDocuments.length === 0) {
    for (const [docKey, acceptance] of acceptanceByKey) {
      const signedDoc = docById.get(acceptance.legal_document_id);
      signedDocuments.push({
        docKey,
        title: signedDoc?.title ?? docKey,
        version: signedDoc?.version ?? "",
        signed: true,
        acceptedAt: acceptance.accepted_at,
        typedName: acceptance.typed_name,
        signaturePath: acceptance.signature_path,
        channel: acceptance.channel,
      });
    }
  }

  const profileRow = pickProfile((profiles ?? []) as UserProfileRow[]);
  const imageRightsSet =
    profileRow?.image_rights !== null && profileRow?.image_rights !== undefined;

  return {
    complete: missingDocKeys.length === 0 && imageRightsSet,
    missingDocKeys,
    imageRightsSet,
    imageRights: profileRow?.image_rights ?? null,
    documents,
    acceptances: acceptanceRows,
    profile: profileRow,
    signedDocuments,
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
