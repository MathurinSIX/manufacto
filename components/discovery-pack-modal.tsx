"use client";

import { useState } from "react";

import { DiscoveryPackReservationButton } from "@/components/discovery-pack-reservation-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type DiscoveryPackOption = {
  discipline: string;
  title: string;
  price: string;
  line1: string;
  line2: string;
  activityId: string;
  squareProductId: string;
};

const secondaryCtaClassName =
  "inline-flex items-center justify-center rounded-[12px] border-2 border-[#4a56dd] bg-white/90 px-6 py-3 text-lg font-semibold text-[#4a56dd] transition hover:bg-[#f0f1ff]";

type DiscoveryPackModalTriggerProps = {
  packs: DiscoveryPackOption[];
  isLoggedIn: boolean;
  label?: string;
  className?: string;
};

export function DiscoveryPackModalTrigger({
  packs,
  isLoggedIn,
  label = "Première visite",
  className = "",
}: DiscoveryPackModalTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={cn(secondaryCtaClassName, className)}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md gap-0 overflow-hidden rounded-[19px] border-black/10 p-0 sm:max-w-lg">
          <div className="bg-[#fff8f0] px-5 py-5 md:px-6 md:py-6">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="text-[24px] font-bold tracking-[-0.02em] text-[#f56800]">
                Pack découverte
              </DialogTitle>
              <DialogDescription className="text-base text-black/70">
                Une première venue pour tester l&apos;atelier — limitée à un
                achat par personne.
              </DialogDescription>
            </DialogHeader>

            {packs.length === 0 ? (
              <p className="mt-5 text-sm text-black/60">
                Packs bientôt disponibles. En attendant,{" "}
                <a href="/contact" className="font-semibold text-[#4a56dd] underline">
                  réservez une visite
                </a>
                .
              </p>
            ) : (
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {packs.map((pack) => (
                  <div
                    key={pack.discipline}
                    className="flex flex-col items-center justify-center rounded-[12px] border border-[#4a56dd]/50 bg-white px-3 py-4 text-center"
                  >
                    <p className="text-[26px] leading-none text-black">{pack.price}</p>
                    <p className="mt-1 text-sm font-semibold leading-tight text-black/85">
                      {pack.line1}
                    </p>
                    <p className="text-sm leading-tight text-black/70">{pack.line2}</p>
                    <DiscoveryPackReservationButton
                      activityId={pack.activityId}
                      activityTitle={pack.title}
                      squareProductId={pack.squareProductId}
                      isLoggedIn={isLoggedIn}
                      label="Réserver"
                      className="mt-3 inline-flex w-full justify-center rounded-[10px] bg-[#4a56dd] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#3d47c4]"
                    />
                  </div>
                ))}
              </div>
            )}

            <p className="mt-4 text-center text-xs text-black/50">
              Ou{" "}
              <a href="/reserver" className="font-semibold text-[#4a56dd] underline">
                réservez une visite gratuite
              </a>{" "}
              (mardi 18h30).
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
