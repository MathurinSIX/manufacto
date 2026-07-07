export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  const { scheduleStartupSquareUserSync, scheduleStartupSquarePurchaseSync } =
    await import("@/lib/square/user-sync");
  scheduleStartupSquareUserSync();
  scheduleStartupSquarePurchaseSync();
}
