"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Shell: caps height to the viewport. Pair with scrollableDialogBodyClass on an inner wrapper. */
export const scrollableDialogContentClass =
  "!flex max-h-[min(90dvh,calc(100vh-2rem))] min-h-0 flex-col gap-0 overflow-hidden p-0";

/** Scrollable inner area for tall modal content. */
export const scrollableDialogBodyClass =
  "min-h-0 flex-1 overflow-y-auto overscroll-contain";

export function ReservationModal({
  children,
  title = "réserver",
}: {
  children: ReactNode;
  title?: string;
}) {
  const router = useRouter();

  return (
    <Dialog open onOpenChange={(open) => !open && router.back()}>
      <DialogContent
        className={cn(
          scrollableDialogContentClass,
          "w-[calc(100vw-2rem)] max-w-[1180px] border-none bg-white text-black shadow-2xl sm:rounded-[24px]",
        )}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className={cn(scrollableDialogBodyClass, "p-5 md:p-8")}>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
