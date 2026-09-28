"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MAX_PARTICIPANTS,
  bookingParticipantsAreValid,
  normalizeBookingParticipants,
  type BookingParticipant,
} from "@/lib/participant-count";
import { cn } from "@/lib/utils";

type ParticipantCountSelectorProps = {
  participants: BookingParticipant[];
  onChange: (next: BookingParticipant[]) => void;
  max?: number;
  disabled?: boolean;
  className?: string;
  /** Household names that can be added in one click. */
  quickAddNames?: string[];
};

export function ParticipantCountSelector({
  participants,
  onChange,
  max = MAX_PARTICIPANTS,
  disabled = false,
  className,
  quickAddNames = [],
}: ParticipantCountSelectorProps) {
  const effectiveMax = Math.min(MAX_PARTICIPANTS, Math.max(1, max));
  const canAdd = participants.length < effectiveMax;

  const updateAt = (index: number, patch: Partial<BookingParticipant>) => {
    onChange(
      participants.map((participant, participantIndex) =>
        participantIndex === index ? { ...participant, ...patch } : participant,
      ),
    );
  };

  const addParticipant = (name = "") => {
    if (!canAdd) return;
    onChange([...participants, { name, email: "" }]);
  };

  const listedNames = new Set(
    participants.map((participant) => participant.name.trim().toLowerCase()),
  );
  const suggestions = quickAddNames.filter(
    (name) => name.trim() && !listedNames.has(name.trim().toLowerCase()),
  );

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label>Qui participe ?</Label>
        <span className="text-xs text-muted-foreground">
          {participants.length} personne{participants.length > 1 ? "s" : ""}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Un nom par personne. L&apos;e-mail est facultatif : s&apos;il est
        renseigné, cette personne reçoit la confirmation.
      </p>
      {effectiveMax < MAX_PARTICIPANTS ? (
        <p className="text-xs text-muted-foreground">
          {effectiveMax === 0
            ? "Plus de places disponibles."
            : `Jusqu'à ${effectiveMax} place${effectiveMax > 1 ? "s" : ""}.`}
        </p>
      ) : null}

      <div className="space-y-3">
        {participants.map((participant, index) => (
          <div key={index} className="space-y-2 rounded-md border p-3">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm">Personne {index + 1}</Label>
              {participants.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={() =>
                    onChange(participants.filter((_, participantIndex) => participantIndex !== index))
                  }
                  aria-label={`Retirer la personne ${index + 1}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
            <Input
              value={participant.name}
              disabled={disabled}
              placeholder="Nom"
              required
              onChange={(event) => updateAt(index, { name: event.target.value })}
            />
            <Input
              type="email"
              value={participant.email}
              disabled={disabled}
              placeholder="E-mail (facultatif)"
              onChange={(event) => updateAt(index, { email: event.target.value })}
            />
          </div>
        ))}
      </div>

      {suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((name) => (
            <Button
              key={name}
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || !canAdd}
              onClick={() => addParticipant(name)}
            >
              Ajouter {name}
            </Button>
          ))}
        </div>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || !canAdd}
        onClick={() => addParticipant()}
      >
        <Plus className="mr-1 h-4 w-4" />
        Ajouter une personne
      </Button>
    </div>
  );
}

export function participantsToRegistrationFields(participants: BookingParticipant[]) {
  const normalized = normalizeBookingParticipants(participants);
  return {
    participantCount: Math.max(1, normalized.length),
    companionFirstNames: normalized.slice(1).map((participant) => participant.name),
    participantNames: normalized.map((participant) => participant.name),
    participantEmails: normalized.map((participant) => participant.email),
  };
}

export function companionNamesAreValid(
  participantCount: number,
  names: string[],
): boolean {
  if (participantCount <= 1) return true;
  return (
    names
      .slice(0, participantCount - 1)
      .map((name) => name.trim())
      .filter(Boolean).length ===
    participantCount - 1
  );
}

export { bookingParticipantsAreValid };
