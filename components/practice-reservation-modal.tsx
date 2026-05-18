"use client";

import type { ReactNode } from "react";

import { PracticeReservationPicker } from "@/components/practice-reservation-picker";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

type PracticeReservationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityId: string;
  activityTitle: string;
  activityType?: string | null;
  credits?: number | null;
  squareProductId?: string | null;
  fixedHourCount?: number;
  isLoggedIn?: boolean;
  trigger?: ReactNode;
};

export function PracticeReservationModal({
  open,
  onOpenChange,
  activityId,
  activityTitle,
  activityType,
  credits,
  squareProductId,
  fixedHourCount,
  isLoggedIn,
  trigger,
}: PracticeReservationModalProps) {
  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-xl overflow-y-auto border-none bg-white p-5 text-black shadow-2xl sm:rounded-[24px] md:p-6">
          <DialogTitle className="text-[26px] font-bold leading-tight text-black">
            réserver en pratique libre
          </DialogTitle>
          <p className="mt-2 text-sm leading-normal text-black/65">
            Choisissez votre créneau et votre durée pour{" "}
            <span className="font-semibold text-black">{activityTitle}</span>.
          </p>
          <div className="mt-6">
            <PracticeReservationPicker
              activityId={activityId}
              activityTitle={activityTitle}
              activityType={activityType}
              credits={credits}
              squareProductId={squareProductId}
              fixedHourCount={fixedHourCount}
              isLoggedIn={isLoggedIn}
              inModal
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
