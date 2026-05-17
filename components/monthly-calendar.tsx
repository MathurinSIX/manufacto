"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

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

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: PARIS_TIMEZONE,
});

export type CalendarSessionItem = {
  id: string;
  activityId: string;
  start_ts: string;
  end_ts: string;
  activityName: string;
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
}

export function MonthlyCalendar({
  sessionsByDate,
  currentMonthIso,
}: MonthlyCalendarProps) {
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonthUTC(new Date(currentMonthIso)),
  );
  const todayKey = toDayKey(new Date());

  const calendarDays = useMemo(
    () => buildCalendarGrid(visibleMonth),
    [visibleMonth],
  );

  const getSessionsForDay = (day: Date) => {
    const key = toDayKey(day);
    return sessionsByDate[key] ?? [];
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setVisibleMonth(addMonthsUTC(visibleMonth, -1))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition hover:bg-muted"
          aria-label="Mois précédent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-lg font-semibold capitalize">
          {monthFormatter.format(visibleMonth)}
        </p>
        <button
          type="button"
          onClick={() => setVisibleMonth(addMonthsUTC(visibleMonth, 1))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition hover:bg-muted"
          aria-label="Mois suivant"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-2 grid grid-cols-7 text-center text-xs uppercase text-muted-foreground">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={`${i}-${label}`}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
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
                "flex flex-col min-h-[80px] rounded-md border p-1 text-sm transition-colors md:min-h-[100px]",
                !isCurrentMonth && "text-muted-foreground/40 border-muted/40",
                isToday && "ring-2 ring-primary",
                hasSessions && "bg-primary/5 border-primary/20"
              )}
            >
              <span className="text-xs font-medium mb-1">
                {day.getUTCDate()}
              </span>
              {hasSessions && (
                <div className="flex max-h-[132px] flex-1 flex-col gap-0.5 overflow-y-auto pr-0.5">
                  {sessions.map((session) => {
                    const href = `/reserver?activity=${encodeURIComponent(session.activityId)}&session=${encodeURIComponent(session.id)}`;
                    const label = `${timeFormatter.format(new Date(session.start_ts))} ${session.activityName}`;
                    return (
                      <Link
                        key={session.id}
                        href={href}
                        scroll={false}
                        className="block truncate rounded bg-primary/10 px-1 py-0.5 text-[10px] font-medium text-primary underline-offset-2 transition hover:bg-primary/20 hover:underline"
                        title={`Réserver — ${label}`}
                      >
                        {label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

