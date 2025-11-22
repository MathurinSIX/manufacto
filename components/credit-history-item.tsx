"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const PARIS_TIMEZONE = "Europe/Paris";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: PARIS_TIMEZONE,
});

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: PARIS_TIMEZONE,
});

interface CreditHistoryItemProps {
  amount: number;
  date: Date;
  session?: {
    start_ts: string;
    end_ts: string;
    activity?: {
      name: string;
    } | null;
  } | null;
  activity?: {
    name: string;
  } | null;
}

export function CreditHistoryItem({
  amount,
  date,
  session,
  activity,
}: CreditHistoryItemProps) {
  const [showDetails, setShowDetails] = useState(false);
  const hasSession = session && activity;

  return (
    <div className="flex items-start justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <p className="font-medium">
          {amount >= 0 ? "+" : ""}{Math.round(amount)} crédit{Math.abs(amount) !== 1 ? "s" : ""}
        </p>
        <p className="text-sm text-muted-foreground">
          {dateFormatter.format(date)} à{" "}
          {timeFormatter.format(date)}
        </p>
        {hasSession && showDetails && (
          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            <p>
              <span className="font-medium">Activité:</span> {activity.name}
            </p>
            <p>
              <span className="font-medium">Date:</span> {dateFormatter.format(new Date(session.start_ts))}
            </p>
            <p>
              <span className="font-medium">Heure:</span> {timeFormatter.format(new Date(session.start_ts))} - {timeFormatter.format(new Date(session.end_ts))}
            </p>
          </div>
        )}
      </div>
      {hasSession && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 ml-4"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Masquer les détails
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Détail de l'activité
            </>
          )}
        </Button>
      )}
    </div>
  );
}

