import { Suspense } from "react";

import { ReservationModal } from "@/components/reservation-modal";
import { ReserverPanel } from "@/app/reserver/page";
import { createClient } from "@/lib/supabase/server";

type Search = { activity?: string; session?: string };
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PRACTICE_ACTIVITY_TYPES = new Set([
  "autonomie",
  "autonomie_encadree",
  "accompagnement",
  "cuisson",
]);

async function shouldSkipOuterModal(searchParams: Promise<Search>) {
  const sp = await searchParams;
  const activityId = sp.activity?.trim() ?? "";

  if (!UUID_RE.test(activityId)) {
    return false;
  }

  const supabase = await createClient();
  const { data: activity, error } = await supabase
    .from("activity")
    .select("type")
    .eq("id", activityId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("Error fetching reservation modal activity:", error);
  }

  return !!activity?.type && !PRACTICE_ACTIVITY_TYPES.has(activity.type);
}

function ReserverModalFallback() {
  return (
    <div className="px-5 py-16 text-center text-black/70">Chargement…</div>
  );
}

async function ReserverModalContent({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const activityId = sp.activity?.trim() ?? "";
  const skipOuterModal = await shouldSkipOuterModal(searchParams);

  if (skipOuterModal) {
    return (
      <ReserverPanel
        searchParams={searchParams}
        isModal
        pickerBackOnClose
        pickerOnly
      />
    );
  }

  const isPracticeActivity = UUID_RE.test(activityId) && !skipOuterModal;

  return (
    <ReservationModal
      title={
        isPracticeActivity ? "réserver en pratique libre" : "réserver"
      }
    >
      <ReserverPanel searchParams={searchParams} isModal />
    </ReservationModal>
  );
}

export default function ReserverModalPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  return (
    <Suspense fallback={<ReserverModalFallback />}>
      <ReserverModalContent searchParams={searchParams} />
    </Suspense>
  );
}
