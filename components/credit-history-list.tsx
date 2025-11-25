"use client";

import { useState, useMemo, useEffect } from "react";
import { CreditHistoryItem } from "@/components/credit-history-item";
import { Pagination } from "@/components/ui/pagination";

interface Session {
  id: string;
  start_ts: string;
  end_ts: string;
  activity_id: string;
  activity?: {
    id: string;
    name: string;
  } | null;
}

interface Credit {
  id: string;
  amount: number | string;
  created_at: string;
}

interface RegistrationStatus {
  status: string;
  created_at: string;
}

interface Registration {
  id: string;
  credit_id: string;
  session_id: string | null;
  payment_type: string | null;
  status?: RegistrationStatus | null;
  session?: Session | Session[] | null;
}

interface CreditHistoryListProps {
  creditHistory: Credit[];
  creditSessionMap: Record<string, Registration>;
}

const ITEMS_PER_PAGE = 5;

export function CreditHistoryList({
  creditHistory,
  creditSessionMap,
}: CreditHistoryListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedCredits = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return creditHistory.slice(startIndex, endIndex);
  }, [creditHistory, currentPage]);

  const totalPages = Math.ceil(creditHistory.length / ITEMS_PER_PAGE);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  if (!creditHistory || creditHistory.length === 0) {
    return (
      <p className="text-muted-foreground">
        Aucun historique de crédits
      </p>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {paginatedCredits.map((credit) => {
          const amount =
            typeof credit.amount === "number"
              ? credit.amount
              : parseFloat(String(credit.amount)) || 0;
          const date = new Date(credit.created_at);
          
          // Check if credit has associated session through registration
          const registration = creditSessionMap[credit.id];
          let session: Session | null = null;
          if (registration?.session) {
            if (Array.isArray(registration.session)) {
              session = registration.session[0] || null;
            } else if (typeof registration.session === "object") {
              session = registration.session as Session;
            }
          }
          
          let activity = null;
          if (session?.activity) {
            if (Array.isArray(session.activity)) {
              activity = session.activity[0] || null;
            } else if (typeof session.activity === "object") {
              activity = session.activity;
            }
          }

          return (
            <CreditHistoryItem
              key={credit.id}
              amount={amount}
              date={date}
              registration={registration ? {
                id: registration.id,
                session_id: registration.session_id,
                payment_type: registration.payment_type,
                status: registration.status,
              } : null}
              session={session ? {
                id: session.id,
                start_ts: session.start_ts,
                end_ts: session.end_ts,
                activity: activity,
              } : null}
              activity={activity}
            />
          );
        })}
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={ITEMS_PER_PAGE}
        totalItems={creditHistory.length}
      />
    </>
  );
}

