"use client";

import { useState } from "react";

import { PracticeReservationModal } from "@/components/practice-reservation-modal";

type DiscoveryPackReservationButtonProps = {
  activityId: string;
  activityTitle: string;
  productId: string;
  isLoggedIn?: boolean;
  className?: string;
  label?: string;
};

export function DiscoveryPackReservationButton({
  activityId,
  activityTitle,
  productId,
  isLoggedIn = false,
  className,
  label = "sélectionner",
}: DiscoveryPackReservationButtonProps) {
  const [open, setOpen] = useState(false);

  function handleClick() {
    setOpen(true);
  }

  return (
    <>
      <button type="button" className={className} onClick={handleClick}>
        {label}
      </button>
      {open ? (
        <PracticeReservationModal
          open={open}
          onOpenChange={setOpen}
          activityId={activityId}
          activityTitle={activityTitle}
          squareProductId={productId}
          fixedHourCount={2}
          isLoggedIn={isLoggedIn}
        />
      ) : null}
    </>
  );
}
