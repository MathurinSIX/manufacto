"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cancelRegistration } from "@/app/account/actions";
import { useRouter } from "next/navigation";

interface CancelRegistrationButtonProps {
  registrationId: string;
}

export function CancelRegistrationButton({
  registrationId,
}: CancelRegistrationButtonProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Clear error when component mounts
  useEffect(() => {
    setError(null);
  }, []);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleCancel = async () => {
    if (!confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) {
      return;
    }

    setIsCancelling(true);
    setError(null);

    const result = await cancelRegistration(registrationId);

    if (result.error) {
      setError(result.error);
      setIsCancelling(false);
    } else {
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        variant="destructive"
        size="sm"
        onClick={handleCancel}
        disabled={isCancelling}
      >
        {isCancelling ? "Annulation..." : "Annuler"}
      </Button>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}


