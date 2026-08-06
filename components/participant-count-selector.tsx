"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_PARTICIPANTS } from "@/lib/participant-count";
import { cn } from "@/lib/utils";

type ParticipantCountSelectorProps = {
  value: number;
  onChange: (value: number) => void;
  companionFirstNames?: string[];
  onCompanionFirstNamesChange?: (names: string[]) => void;
  max?: number;
  disabled?: boolean;
  className?: string;
};

export function ParticipantCountSelector({
  value,
  onChange,
  companionFirstNames = [],
  onCompanionFirstNamesChange,
  max = MAX_PARTICIPANTS,
  disabled = false,
  className,
}: ParticipantCountSelectorProps) {
  const effectiveMax = Math.min(MAX_PARTICIPANTS, Math.max(1, max));
  const showCompanionFields =
    value > 1 && typeof onCompanionFirstNamesChange === "function";

  const handleCountChange = (next: number) => {
    onChange(next);
    if (!onCompanionFirstNamesChange) return;
    if (next <= 1) {
      onCompanionFirstNamesChange([]);
      return;
    }
    const needed = next - 1;
    const nextNames = companionFirstNames.slice(0, needed);
    while (nextNames.length < needed) {
      nextNames.push("");
    }
    onCompanionFirstNamesChange(nextNames);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label>Nombre de personnes</Label>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || value <= 1}
          onClick={() => handleCountChange(Math.max(1, value - 1))}
          aria-label="Moins de personnes"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="min-w-[2rem] text-center text-lg font-semibold tabular-nums">
          {value}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || value >= effectiveMax}
          onClick={() => handleCountChange(Math.min(effectiveMax, value + 1))}
          aria-label="Plus de personnes"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {effectiveMax < MAX_PARTICIPANTS ? (
        <p className="text-xs text-muted-foreground">
          {effectiveMax === 0
            ? "Plus de places disponibles."
            : `Seulement ${effectiveMax} place${effectiveMax > 1 ? "s" : ""} disponible${effectiveMax > 1 ? "s" : ""}.`}
        </p>
      ) : null}

      {showCompanionFields ? (
        <div className="space-y-2 pt-1">
          <Label className="text-sm font-medium">
            Prénom{value > 2 ? "s" : ""} de la / des personne{value > 2 ? "s" : ""} supplémentaire{value > 2 ? "s" : ""}
          </Label>
          {Array.from({ length: value - 1 }, (_, index) => (
            <Input
              key={index}
              value={companionFirstNames[index] ?? ""}
              disabled={disabled}
              placeholder={`Prénom de la personne ${index + 2}`}
              onChange={(event) => {
                const nextNames = [...companionFirstNames];
                while (nextNames.length < value - 1) {
                  nextNames.push("");
                }
                nextNames[index] = event.target.value;
                onCompanionFirstNamesChange?.(nextNames.slice(0, value - 1));
              }}
              required
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function normalizeCompanionFirstNames(
  participantCount: number,
  names: string[],
): string[] {
  if (participantCount <= 1) {
    return [];
  }

  return names
    .slice(0, participantCount - 1)
    .map((name) => name.trim())
    .filter(Boolean);
}

export function companionNamesAreValid(
  participantCount: number,
  names: string[],
): boolean {
  if (participantCount <= 1) {
    return true;
  }

  return normalizeCompanionFirstNames(participantCount, names).length ===
    participantCount - 1;
}
