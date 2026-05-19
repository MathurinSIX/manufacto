"use client";

import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

export type VisitSessionOption = {
  id: string;
  title: string;
  scheduleLabel: string;
};

export function VisitSessionList({
  sessions,
  selectedSessionId,
}: {
  sessions: VisitSessionOption[];
  selectedSessionId?: string;
}) {
  const router = useRouter();

  return (
    <>
      {sessions.map((session) => {
        const isSelected = session.id === selectedSessionId;

        return (
          <button
            key={session.id}
            type="button"
            onClick={() =>
              router.replace(
                `/reserver?session=${encodeURIComponent(session.id)}`,
                { scroll: false },
              )
            }
            className={cn(
              "block w-full rounded-[14px] border p-4 text-left transition",
              isSelected
                ? "border-[#4a56dd] bg-[#4a56dd]/5"
                : "border-black/10 hover:border-[#4a56dd]/50",
            )}
          >
            <p className="font-semibold text-black">{session.title}</p>
            <p className="mt-1 text-sm capitalize text-black/65">
              {session.scheduleLabel}
            </p>
          </button>
        );
      })}
    </>
  );
}
