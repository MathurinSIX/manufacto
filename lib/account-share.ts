import type { SupabaseClient } from "@supabase/supabase-js";

export type AccountPartnerStatus = "pending" | "active";

export type AccountPartnerSummary = {
  email: string;
  userId: string | null;
  status: AccountPartnerStatus;
};

export type AccountShare = {
  accountUserId: string;
  isOwner: boolean;
  partner: AccountPartnerSummary | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeAccountEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidAccountEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function emptyShare(userId: string): AccountShare {
  return { accountUserId: userId, isOwner: true, partner: null };
}

type AccountPartnerRow = {
  owner_user_id: string;
  partner_email: string;
  partner_user_id: string | null;
  status: string;
};

export async function loadAccountShare(
  supabase: SupabaseClient,
  userId: string,
): Promise<AccountShare> {
  if (!UUID_RE.test(userId)) {
    return emptyShare(userId);
  }

  const { data, error } = await supabase
    .from("account_partner")
    .select("owner_user_id, partner_email, partner_user_id, status")
    .or(`owner_user_id.eq.${userId},partner_user_id.eq.${userId}`)
    .maybeSingle();

  if (error || !data) {
    return emptyShare(userId);
  }

  const row = data as AccountPartnerRow;
  const status: AccountPartnerStatus =
    row.status === "active" ? "active" : "pending";

  return {
    accountUserId: row.owner_user_id,
    isOwner: row.owner_user_id === userId,
    partner: {
      email: row.partner_email,
      userId: row.partner_user_id,
      status,
    },
  };
}

/** Credits, bookings, and documents live on this id for both logins. */
export async function resolveAccountUserId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const share = await loadAccountShare(supabase, userId);
  return share.accountUserId;
}
