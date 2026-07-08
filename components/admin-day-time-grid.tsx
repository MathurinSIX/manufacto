"use client";

import { useMemo } from "react";
import {
  formatParisDate,
  PARIS_TIMEZONE,
  parseParisDateTime,
} from "@/lib/paris-time";
import { cn } from "@/lib/utils";
import {
  AdminWeekCalendarSession,
  getActivityColorClass,
} from "@/components/admin-week-calendar";
import { HOUR_HEIGHT_PX } from "@/components/admin-week-time-grid";

const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 22;

function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return (hour ?? 0) * 60 + (minute ?? 0);
}

function computeHourRange(sessions: AdminWeekCalendarSession[]) {
  if (sessions.length === 0) {
    return { startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR };
  }

  let minMinutes = 24 * 60;
  let maxMinutes = 0;

  for (const session of sessions) {
    minMinutes = Math.min(minMinutes, timeToMinutes(session.start));
    maxMinutes = Math.max(maxMinutes, timeToMinutes(session.end));
  }

  return {
    startHour: Math.max(0, Math.floor(minMinutes / 60) - 1),
    endHour: Math.min(24, Math.ceil(maxMinutes / 60) + 1),
  };
}

export type AdminDayTimeGridSession = AdminWeekCalendarSession & {
  registrationCount?: number;
};

interface AdminDayTimeGridProps {
  date: string;
  sessions: AdminDayTimeGridSession[];
  activityColorIds?: string[];
  onSessionClick?: (session: AdminDayTimeGridSession) => void;
  className?: string;
}

export function AdminDayTimeGrid({
  date,
  sessions,
  activityColorIds = [],
  onSessionClick,
  className,
}: AdminDayTimeGridProps) {
  const { startHour, endHour } = useMemo(
    () => computeHourRange(sessions),
    [sessions],
  );

  const hours = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, index) => startHour + index),
    [startHour, endHour],
  );

  const gridHeight = hours.length * HOUR_HEIGHT_PX;
  const isToday = formatParisDate(new Date()) === date;

  const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: PARIS_TIMEZONE,
  });

  const formatDayLabel = (dateKey: string) =>
    dateFormatter.format(parseParisDateTime(dateKey, "12:00"));

  const renderEvent = (session: AdminDayTimeGridSession) => {
    const startMinutes = timeToMinutes(session.start);
    const endMinutes = timeToMinutes(session.end);
    const top = ((startMinutes - startHour * 60) / 60) * HOUR_HEIGHT_PX;
    const height = Math.max(
      ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT_PX,
      28,
    );

    const colorClass = session.activity_id
      ? getActivityColorClass(session.activity_id, activityColorIds)
      : "bg-primary/15 border-primary/40 text-foreground";

    return (
      <button
        key={session.id ?? `${session.date}-${session.start}`}
        type="button"
        onClick={() => onSessionClick?.(session)}
        className={cn(
          "absolute left-1 right-1 overflow-hidden rounded border px-2 py-1 text-left text-xs leading-tight shadow-sm transition-shadow hover:shadow-md z-10",
          colorClass,
          onSessionClick && "cursor-pointer",
        )}
        style={{ top: `${top}px`, height: `${height}px` }}
        title={`${session.activity_name ?? "Session"} · ${session.start} – ${session.end}`}
      >
        <p className="font-semibold tabular-nums truncate">
          {session.start} – {session.end}
        </p>
        {session.activity_name ? (
          <p className="truncate font-medium">{session.activity_name}</p>
        ) : null}
        {session.registrationCount != null ? (
          <p className="truncate text-[10px] opacity-80">
            {session.registrationCount} inscription
            {session.registrationCount > 1 ? "s" : ""}
            {session.max_registrations != null ? ` / ${session.max_registrations}` : ""}
          </p>
        ) : null}
      </button>
    );
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          "rounded-lg border px-4 py-3 text-center",
          isToday ? "bg-primary/5 ring-1 ring-primary/20" : "bg-muted/30",
        )}
      >
        <p className="text-sm font-semibold capitalize">{formatDayLabel(date)}</p>
      </div>

      <div className="overflow-auto rounded-lg border bg-background max-h-[640px]">
        <div className="min-w-[320px]">
          <div className="flex">
            <div
              className="w-14 shrink-0 border-r bg-muted/20"
              style={{ height: gridHeight }}
            >
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="relative border-b text-[10px] text-muted-foreground"
                  style={{ height: HOUR_HEIGHT_PX }}
                >
                  <span className="absolute -top-2 right-2 tabular-nums">
                    {hour.toString().padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            <div className="relative flex-1" style={{ height: gridHeight }}>
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-black/5 pointer-events-none"
                  style={{ height: HOUR_HEIGHT_PX }}
                />
              ))}
              {sessions.map((session) => renderEvent(session))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
