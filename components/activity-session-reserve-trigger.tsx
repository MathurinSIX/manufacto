"use client";

import { useState, type ReactNode } from "react";

import { ActivitySessionPicker } from "@/components/activity-session-picker";

type ActivitySessionReserveTriggerProps = {
  activityId: string;
  activityTitle: string;
  activityType?: string | null;
  sessionId?: string;
  credits?: number | null;
  price?: number | null;
  squareProductId?: string | null;
  isLoggedIn?: boolean;
  children?: ReactNode;
  className?: string;
};

export function ActivitySessionReserveTrigger({
  activityId,
  activityTitle,
  activityType = "cours",
  sessionId,
  credits,
  price,
  squareProductId,
  isLoggedIn = false,
  children,
  className,
}: ActivitySessionReserveTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children ?? "réserver"}
      </button>
      {open ? (
        <ActivitySessionPicker
          activityId={activityId}
          activityTitle={activityTitle}
          activityType={activityType}
          initialSessionId={sessionId}
          open={open}
          onOpenChange={setOpen}
          credits={credits}
          price={price}
          squareProductId={squareProductId}
          isLoggedIn={isLoggedIn}
        />
      ) : null}
    </>
  );
}
