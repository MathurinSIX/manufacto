"use client";

import { useState } from "react";

import { ActivitySessionPicker } from "@/components/activity-session-picker";

type DiscoveryPackReservationButtonProps = {
  activityId: string;
  activityTitle: string;
  squareProductId: string;
  isLoggedIn?: boolean;
  className?: string;
  label?: string;
};

export function DiscoveryPackReservationButton({
  activityId,
  activityTitle,
  squareProductId,
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
        <ActivitySessionPicker
          open={open}
          onOpenChange={setOpen}
          activityId={activityId}
          activityTitle={activityTitle}
          activityType="pack_decouverte"
          squareProductId={squareProductId}
          isLoggedIn={isLoggedIn}
        />
      ) : null}
    </>
  );
}
