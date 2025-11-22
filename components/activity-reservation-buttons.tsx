"use client";

import { ActivitySessionPicker } from "./activity-session-picker";

interface ActivityReservationButtonsProps {
  activityId?: string;
  activityTitle: string;
  credits: number | null;
  price: number | null;
  isLoggedIn: boolean;
}

export function ActivityReservationButtons({
  activityId,
  activityTitle,
  credits,
  price,
  isLoggedIn,
}: ActivityReservationButtonsProps) {
  return (
    <div className="mt-4">
      <ActivitySessionPicker
        activityId={activityId}
        activityTitle={activityTitle}
        credits={credits}
        price={price}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}

