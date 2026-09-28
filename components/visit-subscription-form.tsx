"use client";

import { useEffect, useState } from "react";

import { createSessionSubscription } from "@/app/reserver/actions";
import {
  ParticipantCountSelector,
  bookingParticipantsAreValid,
  participantsToRegistrationFields,
} from "@/components/participant-count-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maxSelectableCount, type BookingParticipant } from "@/lib/participant-count";

type VisitSubscriptionFormProps = {
  sessionId: string;
  availableSpots: number | null;
};

export function VisitSubscriptionForm({
  sessionId,
  availableSpots,
}: VisitSubscriptionFormProps) {
  const [participants, setParticipants] = useState<BookingParticipant[]>([
    { name: "", email: "" },
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const maxParticipants = maxSelectableCount(availableSpots);
  const { participantCount, participantNames, participantEmails } =
    participantsToRegistrationFields(participants);

  useEffect(() => {
    if (participants.length > maxParticipants) {
      setParticipants((current) => current.slice(0, Math.max(1, maxParticipants)));
    }
  }, [maxParticipants, participants.length]);

  return (
    <form
      action={createSessionSubscription}
      className="mt-5 space-y-4"
      onSubmit={(event) => {
        if (!bookingParticipantsAreValid(participants)) {
          event.preventDefault();
          setErrorMessage(
            "Indiquez le nom de chaque personne. L'e-mail, s'il est rempli, doit être valide.",
          );
          return;
        }
        setErrorMessage(null);
      }}
    >
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="participant_count" value={participantCount} />
      {participantNames.map((name, index) => (
        <input key={`name-${index}`} type="hidden" name="participant_names" value={name} />
      ))}
      {participantEmails.map((email, index) => (
        <input key={`email-${index}`} type="hidden" name="participant_emails" value={email} />
      ))}
      <ParticipantCountSelector
        participants={participants}
        onChange={setParticipants}
        max={maxParticipants}
      />
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
