"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { selectionToParticipants } from "@/lib/household";
import { cn } from "@/lib/utils";

type HouseholdBookingSelectorProps = {
  options: string[];
  selectedNames: string[];
  onChange: (next: {
    selectedNames: string[];
    participantCount: number;
    companionFirstNames: string[];
  }) => void;
  disabled?: boolean;
  className?: string;
};

export function HouseholdBookingSelector({
  options,
  selectedNames,
  onChange,
  disabled = false,
  className,
}: HouseholdBookingSelectorProps) {
  if (options.length <= 1) {
    return null;
  }

  const toggle = (name: string) => {
    const nextSelected = selectedNames.includes(name)
      ? selectedNames.filter((entry) => entry !== name)
      : [...selectedNames, name];
    const mapped = selectionToParticipants(nextSelected);
    onChange({
      selectedNames: nextSelected,
      participantCount: mapped.participantCount,
      companionFirstNames: mapped.companionFirstNames,
    });
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label>Qui participe ?</Label>
      <p className="text-xs text-muted-foreground">
        Choisissez qui fait le cours.
      </p>
      <div className="grid gap-2">
        {options.map((name) => (
          <label
            key={name}
            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <Checkbox
              checked={selectedNames.includes(name)}
              disabled={disabled}
              onCheckedChange={() => toggle(name)}
            />
            {name}
          </label>
        ))}
      </div>
    </div>
  );
}
