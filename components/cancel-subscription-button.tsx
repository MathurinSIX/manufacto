"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { cancelSubscriptionPurchase } from "@/app/account/actions";

type CancelSubscriptionButtonProps = {
  purchaseId: string;
};

export function CancelSubscriptionButton({ purchaseId }: CancelSubscriptionButtonProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setError(null);
  }, [purchaseId]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 8000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleCancel = async () => {
    if (
      !confirm(
        "Résilier ce prélèvement Square ? Les prélèvements mensuels s'arrêteront à la fin de la période en cours.",
      )
    ) {
      return;
    }

    setIsCancelling(true);
    setError(null);

    const result = await cancelSubscriptionPurchase(purchaseId);

    if (result.error) {
      setError(result.error);
      setIsCancelling(false);
      return;
    }

    router.refresh();
    setIsCancelling(false);
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleCancel}
        disabled={isCancelling}
        className="inline-flex rounded-[10px] border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCancelling ? "Résiliation…" : "Résilier"}
      </button>
      {error ? <p className="max-w-[220px] text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
