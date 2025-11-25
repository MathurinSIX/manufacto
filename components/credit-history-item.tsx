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

interface RegistrationStatus {
  status: string;
  created_at: string;
}

interface CreditHistoryItemProps {
  amount: number;
  date: Date;
  registration?: {
    id: string;
    session_id: string | null;
    payment_type: string | null;
    status?: RegistrationStatus | null;
  } | null;
  session?: {
    id: string;
    start_ts: string;
    end_ts: string;
    activity?: {
      id: string;
      name: string;
    } | null;
  } | null;
  activity?: {
    id: string;
    name: string;
  } | null;
}

export function CreditHistoryItem({
  amount,
  date,
  registration,
  session,
  activity,
}: CreditHistoryItemProps) {
  const [showDetails, setShowDetails] = useState(false);
  const hasRegistration = registration && session && activity;

  const registrationStatus = registration?.status;
  const isCancelled = registrationStatus?.status === "CANCELLED";

  return (
    <div className="flex items-start justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium">
            {amount >= 0 ? "+" : ""}{Math.round(amount)} crédit{Math.abs(amount) !== 1 ? "s" : ""}
          </p>
          {hasRegistration && (
            <>
              {registration.payment_type && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {registration.payment_type === "credit" ? "Crédits" : registration.payment_type}
                </span>
              )}
              {isCancelled && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                  Annulée
                </span>
              )}
            </>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {dateFormatter.format(date)} à{" "}
          {timeFormatter.format(date)}
        </p>
        {hasRegistration && showDetails && (
          <div className="mt-3 p-3 bg-muted/50 rounded-md space-y-2 text-sm">
            {activity && (
              <p className="font-medium text-foreground">{activity.name}</p>
            )}
            {session && (
              <p className="text-muted-foreground">
                {dateFormatter.format(new Date(session.start_ts))} à{" "}
                {timeFormatter.format(new Date(session.start_ts))} - {timeFormatter.format(new Date(session.end_ts))}
              </p>
            )}
          </div>
        )}
      </div>
      {hasRegistration && (
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
              Détails de la réservation
            </>
          )}
        </Button>
      )}
    </div>
  );
}

