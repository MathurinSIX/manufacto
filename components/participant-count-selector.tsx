"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MAX_PARTICIPANTS } from "@/lib/participant-count";
import { cn } from "@/lib/utils";

type ParticipantCountSelectorProps = {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  disabled?: boolean;
  className?: string;
};

export function ParticipantCountSelector({
  value,
  onChange,
  max = MAX_PARTICIPANTS,
  disabled = false,
  className,
}: ParticipantCountSelectorProps) {
  const effectiveMax = Math.min(MAX_PARTICIPANTS, Math.max(1, max));

  return (
    <div className={cn("space-y-2", className)}>
      <Label>Nombre de personnes</Label>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || value <= 1}
          onClick={() => onChange(Math.max(1, value - 1))}
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
          onClick={() => onChange(Math.min(effectiveMax, value + 1))}
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
    </div>
  );
}
