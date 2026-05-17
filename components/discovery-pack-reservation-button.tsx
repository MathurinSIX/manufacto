"use client";

import { useState } from "react";

import { PracticeReservationModal } from "@/components/practice-reservation-modal";

type DiscoveryPackReservationButtonProps = {
  activityId: string;
  activityTitle: string;
  productId: string;
  isLoggedIn?: boolean;
  className?: string;
};

export function DiscoveryPackReservationButton({
  activityId,
  activityTitle,
  productId,
  isLoggedIn = false,
  className,
}: DiscoveryPackReservationButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
      >
        sélectionner
      </button>
      <PracticeReservationModal
        open={open}
        onOpenChange={setOpen}
        activityId={activityId}
        activityTitle={activityTitle}
        squareProductId={productId}
        fixedHourCount={2}
        isLoggedIn={isLoggedIn}
      />
    </>
  );
}
