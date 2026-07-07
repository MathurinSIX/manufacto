import {
  getAdminClient,
  listSquareCustomers,
  syncSquareCustomerToBackend,
  syncSupabaseUserToSquare,
} from "@/lib/square/server";
import { reconcileSquareCreditPackPurchases } from "@/lib/square/purchase-import";

export type SquareUserSyncSummary = {
  supabaseUsersProcessed: number;
  supabaseUsersLinked: number;
  squareCustomersProcessed: number;
  squareCustomersLinked: number;
  errors: number;
};

export type SquarePurchaseSyncSummary = {
  paymentsScanned: number;
  imported: number;
  skipped: number;
  errors: number;
};

const AUTH_USERS_PAGE_SIZE = 1000;

type SupabaseAdminClient = ReturnType<typeof getAdminClient>;

async function listAllAuthUsers(adminClient: SupabaseAdminClient) {
  const allUsers = [];
  let page = 1;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: AUTH_USERS_PAGE_SIZE,
    });

    if (error) {
      throw error;
    }

    allUsers.push(...data.users);

    if (data.users.length < AUTH_USERS_PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return allUsers;
}

export function isSquareUserSyncEnabled() {
  if (process.env.SQUARE_USER_SYNC_ON_STARTUP === "false") {
    return false;
  }

  return Boolean(
    process.env.SQUARE_ACCESS_TOKEN &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function isSquarePurchaseSyncEnabled() {
  if (process.env.SQUARE_PURCHASE_SYNC_ON_STARTUP === "false") {
    return false;
  }

  return Boolean(
    process.env.SQUARE_ACCESS_TOKEN &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

function getPurchaseSyncDays() {
  const configured = Number.parseInt(
    process.env.SQUARE_PURCHASE_SYNC_DAYS ?? "30",
    10,
  );

  if (Number.isNaN(configured) || configured <= 0) {
    return 30;
  }

  return configured;
}

export async function reconcileSquareAndSupabaseUsers(): Promise<SquareUserSyncSummary> {
  const summary: SquareUserSyncSummary = {
    supabaseUsersProcessed: 0,
    supabaseUsersLinked: 0,
    squareCustomersProcessed: 0,
    squareCustomersLinked: 0,
    errors: 0,
  };

  const supabase = getAdminClient();
  const authUsers = await listAllAuthUsers(supabase);

  for (const user of authUsers) {
    summary.supabaseUsersProcessed += 1;

    try {
      const customerId = await syncSupabaseUserToSquare({
        supabase,
        userId: user.id,
      });

      if (customerId) {
        summary.supabaseUsersLinked += 1;
      }
    } catch (error) {
      summary.errors += 1;
      console.error("Square user sync failed for Supabase user:", user.id, error);
    }
  }

  const squareCustomers = await listSquareCustomers();

  for (const customer of squareCustomers) {
    if (!customer.email_address?.trim()) {
      continue;
    }

    summary.squareCustomersProcessed += 1;

    try {
      await syncSquareCustomerToBackend(customer);
      summary.squareCustomersLinked += 1;
    } catch (error) {
      summary.errors += 1;
      console.error(
        "Square user sync failed for Square customer:",
        customer.id,
        error,
      );
    }
  }

  return summary;
}

export async function reconcileSquarePurchasesOnStartup(): Promise<SquarePurchaseSyncSummary | null> {
  if (!isSquarePurchaseSyncEnabled()) {
    return null;
  }

  try {
    console.info("[square-purchase-sync] Starting credit pack reconciliation...");
    const summary = await reconcileSquareCreditPackPurchases({
      days: getPurchaseSyncDays(),
    });
    console.info("[square-purchase-sync] Reconciliation complete:", summary);
    return summary;
  } catch (error) {
    console.error("[square-purchase-sync] Reconciliation failed:", error);
    return null;
  }
}

const globalForSync = globalThis as typeof globalThis & {
  squareUserSyncPromise?: Promise<SquareUserSyncSummary | null>;
  squarePurchaseSyncPromise?: Promise<SquarePurchaseSyncSummary | null>;
};

export function scheduleStartupSquareUserSync() {
  if (!isSquareUserSyncEnabled()) {
    return;
  }

  if (globalForSync.squareUserSyncPromise) {
    return;
  }

  globalForSync.squareUserSyncPromise = (async () => {
    try {
      console.info("[square-user-sync] Starting batch reconciliation...");
      const summary = await reconcileSquareAndSupabaseUsers();
      console.info("[square-user-sync] Batch reconciliation complete:", summary);
      return summary;
    } catch (error) {
      console.error("[square-user-sync] Batch reconciliation failed:", error);
      return null;
    }
  })();
}

export function scheduleStartupSquarePurchaseSync() {
  if (!isSquarePurchaseSyncEnabled()) {
    return;
  }

  if (globalForSync.squarePurchaseSyncPromise) {
    return;
  }

  globalForSync.squarePurchaseSyncPromise = reconcileSquarePurchasesOnStartup();
}
