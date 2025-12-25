"use client";

import { useState, useMemo, useEffect } from "react";
import { Pagination } from "@/components/ui/pagination";

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

interface Session {
  id: string;
  start_ts: string;
  end_ts: string;
  activity_id: string;
  activity?: {
    id: string;
    name: string;
  } | {
    id: string;
    name: string;
  }[] | null;
}

interface Registration {
  id: string;
  payment_type: string | null;
  session_id: string | null;
  session?: Session | Session[] | null;
}

interface PastReservationsListProps {
  registrations: Registration[];
  sessionsMap: Record<string, Session>;
  error?: string | null;
}

const ITEMS_PER_PAGE = 5;

export function PastReservationsList({
  registrations,
  sessionsMap,
  error,
}: PastReservationsListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedRegistrations = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return registrations.slice(startIndex, endIndex);
  }, [registrations, currentPage]);

  const totalPages = Math.ceil(registrations.length / ITEMS_PER_PAGE);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  if (error) {
    return (
      <p className="text-sm text-destructive mb-4">
        Erreur lors du chargement: {error}
      </p>
    );
  }

  if (registrations.length === 0) {
    return (
      <p className="text-muted-foreground">
        Aucune réservation passée
      </p>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {paginatedRegistrations.map((reg) => {
          // Try to get session from nested query first, then from separate query
          let session: Session | null = null;
          if (Array.isArray(reg.session)) {
            session = reg.session[0] || null;
          } else if (reg.session && typeof reg.session === "object") {
            session = reg.session as Session;
          }
          
          // Fallback to separate query result
          if (!session && reg.session_id) {
            session = sessionsMap[reg.session_id] || null;
          }
          
          if (!session) {
            return null;
          }

          const activity = session.activity 
            ? (Array.isArray(session.activity) 
                ? session.activity[0] 
                : (typeof session.activity === "object" ? session.activity : null))
            : null;
          const activityName = activity?.name || "Activité inconnue";
          const startDate = session.start_ts ? new Date(session.start_ts) : new Date();
          const endDate = session.end_ts ? new Date(session.end_ts) : new Date();

          return (
            <div
              key={reg.id}
              className="flex items-center justify-between p-4 border rounded-lg opacity-75"
            >
              <div>
                <p className="font-medium">{activityName}</p>
                <p className="text-sm text-muted-foreground">
                  {dateFormatter.format(startDate)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {timeFormatter.format(startDate)} -{" "}
                  {timeFormatter.format(endDate)}
                </p>
                {reg.payment_type && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Paiement: {reg.payment_type === "credit" ? "Crédits" : reg.payment_type}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={ITEMS_PER_PAGE}
        totalItems={registrations.length}
      />
    </>
  );
}

