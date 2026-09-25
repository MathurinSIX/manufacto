export const LEGAL_DOC_KEYS = [
  "reglement_interieur",
  "decharge_responsabilite",
] as const;

export type LegalDocKey = (typeof LEGAL_DOC_KEYS)[number];

export type LegalAcceptanceChannel = "online" | "on_site" | "paper";

export type LegalDocumentRow = {
  id: string;
  doc_key: LegalDocKey | string;
  version: string;
  title: string;
  body_md: string;
  requires_signature: boolean;
  is_current: boolean;
};

export type UserProfileRow = {
  user_id: string;
  phone: string | null;
  address: string | null;
  birth_date: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  insurance_company: string | null;
  insurance_policy_number: string | null;
  image_rights: boolean | null;
  admin_notes: string | null;
  /** Adult household members (incl. account holder), display names. */
  member_names?: string[] | null;
  /** Children linked to the household. */
  child_names?: string[] | null;
};

export type UserLegalAcceptanceRow = {
  id: string;
  user_id: string;
  legal_document_id: string;
  typed_name: string;
  signature_path: string | null;
  channel: LegalAcceptanceChannel;
  collected_by: string | null;
  accepted_at: string;
};

export type UserHabilitationRow = {
  id: string;
  user_id: string;
  machine_key: string;
  label: string;
  notes: string | null;
  granted_at: string;
  granted_by: string | null;
};

export const DEFAULT_HABILITATIONS = [
  { key: "scie_a_format", label: "Scie à format" },
  { key: "degau_rabo", label: "Dégauchisseuse / Raboteuse" },
  { key: "scie_a_ruban", label: "Scie à ruban" },
  { key: "perceuse_colonne", label: "Perceuse à colonne" },
  { key: "mortaiseuse", label: "Mortaiseuse à bédane" },
  { key: "tour_a_bois", label: "Tour à bois" },
  { key: "defonceuse_table", label: "Défonceuse sous table" },
] as const;

export const LEGAL_DOCS_PATH = "/account/documents";
export const LEGAL_REQUIRED_ERROR = "LEGAL_DOCS_REQUIRED";
