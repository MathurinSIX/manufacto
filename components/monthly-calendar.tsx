"use client";

import { cn } from "@/lib/utils";
import type { CourseDiscipline } from "@/lib/course-disciplines";
import { getCalendarMonthKey } from "@/lib/paris-calendar";
import { loadCalendarMonthSessions } from "@/app/calendar/actions";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarSessionPill,
  DisciplineLegend,
} from "@/components/calendar-session-ui";

const PARIS_TIMEZONE = "Europe/Paris";
const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

const monthFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
  timeZone: PARIS_TIMEZONE,
});

const dayKeyFormatter = new Intl.DateTimeFormat("fr-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: PARIS_TIMEZONE,
});

export type CalendarSessionItem = {
  id: string;
  activityId: string;
  start_ts: string;
  end_ts: string;
  activityName: string;
  discipline: CourseDiscipline | null;
  nbCredits?: number | null;
  price?: number | null;
  squareProductId?: string | null;
};

const startOfMonthUTC = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12, 0, 0));

const addMonthsUTC = (date: Date, delta: number) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1, 12, 0, 0));

const toDayKey = (date: Date) => dayKeyFormatter.format(date);

const buildCalendarGrid = (month: Date) => {
  const firstOfMonth = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1, 12, 0, 0),
  );
  const weekday = (firstOfMonth.getUTCDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setUTCDate(firstOfMonth.getUTCDate() - weekday);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setUTCDate(gridStart.getUTCDate() + index);
    return date;
  });
};

interface MonthlyCalendarProps {
  sessionsByDate: Record<string, CalendarSessionItem[]>;
  currentMonthIso: string;
  compact?: boolean;
  dense?: boolean;
}

export function MonthlyCalendar({
  sessionsByDate: initialSessionsByDate,
  currentMonthIso,
  compact = false,
  dense = false,
}: MonthlyCalendarProps) {
  const isCompact = compact || dense;
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonthUTC(new Date(currentMonthIso)),
  );
  const [sessionsByDate, setSessionsByDate] = useState(initialSessionsByDate);
  const [loadingMonthKey, setLoadingMonthKey] = useState<string | null>(null);
  const loadedMonthKeysRef = useRef(
    new Set([getCalendarMonthKey(startOfMonthUTC(new Date(currentMonthIso)))]),
  );
  const todayKey = toDayKey(new Date());

  const calendarDays = useMemo(
    () => buildCalendarGrid(visibleMonth),
    [visibleMonth],
  );

  useEffect(() => {
    const monthKey = getCalendarMonthKey(visibleMonth);
    if (loadedMonthKeysRef.current.has(monthKey)) {
      return;
    }

    let cancelled = false;
    setLoadingMonthKey(monthKey);

    void loadCalendarMonthSessions(
      visibleMonth.getUTCFullYear(),
      visibleMonth.getUTCMonth() + 1,
    ).then((data) => {
      if (cancelled) {
        return;
      }

      setSessionsByDate((current) => ({ ...current, ...data }));
      loadedMonthKeysRef.current.add(monthKey);
      setLoadingMonthKey(null);
    });

    return () => {
      cancelled = true;
    };
  }, [visibleMonth]);

  const getSessionsForDay = (day: Date) => {
    const key = toDayKey(day);
    return sessionsByDate[key] ?? [];
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "flex items-center justify-between gap-3",
          dense ? "mb-2" : isCompact ? "mb-3" : "mb-5",
        )}
      >
        <button
          type="button"
          onClick={() => setVisibleMonth(addMonthsUTC(visibleMonth, -1))}
          className={cn(
            "inline-flex items-center justify-center rounded-full border border-black/10 text-black/70 transition hover:bg-black/5",
            dense ? "h-7 w-7" : isCompact ? "h-8 w-8" : "h-10 w-10",
          )}
          aria-label="Mois précédent"
        >
          <ChevronLeft className={dense ? "h-3.5 w-3.5" : isCompact ? "h-4 w-4" : "h-5 w-5"} />
        </button>
        <div className="flex items-center justify-center gap-2">
          <p
            className={cn(
              "font-semibold capitalize text-black/85",
              dense ? "text-base md:text-lg" : isCompact ? "text-lg md:text-xl" : "text-xl md:text-2xl",
            )}
          >
            {monthFormatter.format(visibleMonth)}
          </p>
          {loadingMonthKey === getCalendarMonthKey(visibleMonth) ? (
            <Loader2 className="h-4 w-4 animate-spin text-black/40" />
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setVisibleMonth(addMonthsUTC(visibleMonth, 1))}
          className={cn(
            "inline-flex items-center justify-center rounded-full border border-black/10 text-black/70 transition hover:bg-black/5",
            dense ? "h-7 w-7" : isCompact ? "h-8 w-8" : "h-10 w-10",
          )}
          aria-label="Mois suivant"
        >
          <ChevronRight className={dense ? "h-3.5 w-3.5" : isCompact ? "h-4 w-4" : "h-5 w-5"} />
        </button>
      </div>

      <DisciplineLegend compact={isCompact} dense={dense} />

      <div
        className={cn(
          "mb-2 grid grid-cols-7 text-center font-semibold uppercase tracking-wide text-black/45",
          dense ? "text-[9px]" : isCompact ? "text-[10px]" : "text-xs",
        )}
      >
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={`${i}-${label}`} className={dense ? "py-0.5" : isCompact ? "py-1" : "py-2"}>
            {label}
          </span>
        ))}
      </div>
      <div
        className={cn(
          "grid grid-cols-7",
          dense ? "gap-0.5 md:gap-1" : isCompact ? "gap-1 md:gap-1.5" : "gap-1.5 md:gap-2",
        )}
      >
        {calendarDays.map((day) => {
          const key = toDayKey(day);
          const isCurrentMonth =
            day.getUTCMonth() === visibleMonth.getUTCMonth() &&
            day.getUTCFullYear() === visibleMonth.getUTCFullYear();
          const isToday = key === todayKey;
          const sessions = getSessionsForDay(day);
          const hasSessions = sessions.length > 0;

          return (
            <div
              key={key}
              className={cn(
                "flex flex-col rounded-xl border bg-white text-sm transition-colors",
                dense ? "p-1" : isCompact ? "p-1.5" : "p-2",
                dense
                  ? "min-h-[52px] md:min-h-[62px] lg:min-h-[72px]"
                  : isCompact
                    ? "min-h-[72px] md:min-h-[96px] lg:min-h-[108px]"
                    : "min-h-[110px] md:min-h-[150px] lg:min-h-[170px]",
                !isCurrentMonth && "border-black/[0.04] bg-black/[0.015] text-black/30",
                isCurrentMonth && "border-black/10",
                isToday && "border-black/30 ring-2 ring-black/20",
              )}
            >
              <span
                className={cn(
                  "inline-flex items-center justify-center font-semibold",
                  dense
                    ? "mb-0.5 h-4 w-4 text-[9px]"
                    : isCompact
                      ? "mb-1 h-5 w-5 text-[10px]"
                      : "mb-1.5 h-6 w-6 text-xs",
                  isToday && isCurrentMonth
                    ? "rounded-full bg-black text-white"
                    : "text-black/70",
                  !isCurrentMonth && "text-black/30",
                )}
              >
                {day.getUTCDate()}
              </span>
              {hasSessions && (
                <div
                  className={cn(
                    "flex flex-1 flex-col",
                    dense ? "gap-0" : isCompact ? "gap-0.5" : "gap-1",
                  )}
                >
                  {sessions.map((session) => (
                    <CalendarSessionPill
                      key={session.id}
                      session={session}
                      compact={isCompact}
                      dense={dense}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
