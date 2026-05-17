"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

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
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-[1180px] overflow-y-auto border-none bg-white p-5 text-black shadow-2xl sm:rounded-[24px] md:p-8">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}
