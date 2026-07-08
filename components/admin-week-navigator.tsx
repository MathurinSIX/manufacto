"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatParisWeekLabel } from "@/lib/paris-time";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminWeekNavigatorProps {
  weekOffset: number;
  onWeekOffsetChange: (offset: number) => void;
  label?: string;
  hint?: string;
  id?: string;
}

export function AdminWeekNavigator({
  weekOffset,
  onWeekOffsetChange,
  label,
  hint,
  id,
}: AdminWeekNavigatorProps) {
  const navigateWeek = (direction: "prev" | "next") => {
    onWeekOffsetChange(weekOffset + (direction === "next" ? 1 : -1));
  };

  return (
    <div className="grid gap-2">
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigateWeek("prev")}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          semaine précédente
        </Button>
        <div className="px-2 text-center">
          <p className="text-sm font-semibold">{formatParisWeekLabel(weekOffset)}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onWeekOffsetChange(0)}
            className="text-xs text-muted-foreground"
          >
            Cette semaine
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigateWeek("next")}
        >
          semaine suivante
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
