"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { PracticeReservationModal } from "@/components/practice-reservation-modal";
import { buildSignUpUrl } from "@/lib/auth-redirect";

type DiscoveryPackReservationButtonProps = {
  activityId: string;
  activityTitle: string;
  productId: string;
  isLoggedIn?: boolean;
  returnPath?: string;
  className?: string;
  label?: string;
};

export function DiscoveryPackReservationButton({
  activityId,
  activityTitle,
  productId,
  isLoggedIn = false,
  returnPath,
  className,
  label = "sélectionner",
}: DiscoveryPackReservationButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function handleClick() {
    if (!isLoggedIn) {
      router.push(buildSignUpUrl(returnPath ?? pathname));
      return;
    }

    setOpen(true);
  }

  return (
    <>
      <button type="button" className={className} onClick={handleClick}>
        {label}
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
