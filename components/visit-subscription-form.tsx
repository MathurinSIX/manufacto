"use client";

import { useEffect, useState } from "react";

import { createSessionSubscription } from "@/app/reserver/actions";
import {
  ParticipantCountSelector,
  companionNamesAreValid,
} from "@/components/participant-count-selector";
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
  const [companionFirstNames, setCompanionFirstNames] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const maxParticipants = maxSelectableCount(availableSpots);

  useEffect(() => {
    if (participantCount > maxParticipants) {
      setParticipantCount(Math.max(1, maxParticipants));
    }
  }, [maxParticipants, participantCount]);

  return (
    <form
      action={createSessionSubscription}
      className="mt-5 space-y-4"
      onSubmit={(event) => {
        if (!companionNamesAreValid(participantCount, companionFirstNames)) {
          event.preventDefault();
          setErrorMessage(
            "Indiquez le prénom de chaque personne supplémentaire.",
          );
          return;
        }
        setErrorMessage(null);
      }}
    >
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="participant_count" value={participantCount} />
      {companionFirstNames.map((name, index) => (
        <input
          key={index}
          type="hidden"
          name="companion_first_names"
          value={name}
        />
      ))}
      <ParticipantCountSelector
        value={participantCount}
        onChange={setParticipantCount}
        companionFirstNames={companionFirstNames}
        onCompanionFirstNamesChange={setCompanionFirstNames}
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
      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}
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
