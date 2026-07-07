"use client";

import { useEffect, useState } from "react";

import { createSessionSubscription } from "@/app/reserver/actions";
import { ParticipantCountSelector } from "@/components/participant-count-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maxSelectableCount } from "@/lib/participant-count";

type VisitSubscriptionFormProps = {
  sessionId: string;
  availableSpots: number | null;
};

export function VisitSubscriptionForm({
  sessionId,
  availableSpots,
}: VisitSubscriptionFormProps) {
  const [participantCount, setParticipantCount] = useState(1);
  const maxParticipants = maxSelectableCount(availableSpots);

  useEffect(() => {
    if (participantCount > maxParticipants) {
      setParticipantCount(Math.max(1, maxParticipants));
    }
  }, [maxParticipants, participantCount]);

  return (
    <form action={createSessionSubscription} className="mt-5 space-y-4">
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="participant_count" value={participantCount} />
      <ParticipantCountSelector
        value={participantCount}
        onChange={setParticipantCount}
        max={maxParticipants}
      />
      <div className="space-y-2">
        <Label htmlFor="name">Nom *</Label>
        <Input id="name" name="name" autoComplete="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={!sessionId || maxParticipants < 1}
      >
        {participantCount > 1
          ? `Confirmer l'inscription (${participantCount} personnes)`
          : "Confirmer l'inscription"}
      </Button>
    </form>
  );
}
