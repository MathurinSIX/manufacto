"use client";

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

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date: Date, delta: number) =>
  new Date(date.getFullYear(), date.getMonth() + delta, 1);

const toDayKey = (date: Date) => dayKeyFormatter.format(date);

const buildCalendarGrid = (month: Date) => {
  const firstOfMonth = startOfMonth(month);
  const weekday = (firstOfMonth.getDay() + 6) % 7; // convert Sunday(0) -> 6
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - weekday);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
};

interface MonthlyCalendarProps {
  sessionsByDate: Map<string, Array<{ id: string; start_ts: string; end_ts: string; activityName: string }>>;
  currentMonth: Date;
}

export function MonthlyCalendar({ sessionsByDate, currentMonth }: MonthlyCalendarProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(currentMonth));
  const todayKey = toDayKey(new Date());

  const calendarDays = useMemo(
    () => buildCalendarGrid(visibleMonth),
    [visibleMonth]
  );

  const getSessionsForDay = (day: Date) => {
    const key = toDayKey(day);
    return sessionsByDate.get(key) || [];
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
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
          onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition hover:bg-muted"
          aria-label="Mois suivant"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-2 grid grid-cols-7 text-center text-xs uppercase text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const key = toDayKey(day);
          const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
          const isToday = key === todayKey;
          const sessions = getSessionsForDay(day);
          const hasSessions = sessions.length > 0;

          return (
            <div
              key={key}
              className={cn(
                "flex flex-col min-h-[80px] rounded-md border p-1 text-sm transition-colors",
                !isCurrentMonth && "text-muted-foreground/40 border-muted/40",
                isToday && "ring-2 ring-primary",
                hasSessions && "bg-primary/5 border-primary/20"
              )}
            >
              <span className="text-xs font-medium mb-1">{day.getDate()}</span>
              {hasSessions && (
                <div className="flex-1 space-y-0.5 overflow-hidden">
                  {sessions.slice(0, 2).map((session) => (
                    <div
                      key={session.id}
                      className="text-[10px] bg-primary/10 text-primary rounded px-1 py-0.5 truncate"
                      title={`${session.activityName} - ${timeFormatter.format(new Date(session.start_ts))}`}
                    >
                      {timeFormatter.format(new Date(session.start_ts))} {session.activityName}
                    </div>
                  ))}
                  {sessions.length > 2 && (
                    <div className="text-[10px] text-muted-foreground">
                      +{sessions.length - 2}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

