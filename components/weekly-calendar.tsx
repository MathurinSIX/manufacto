"use client";

import { cn } from "@/lib/utils";
import {
  addUtcDays,
  calendarDateKey,
  PARIS_TIMEZONE,
} from "@/lib/paris-calendar";
import type { CalendarSessionItem } from "@/components/monthly-calendar";
import {
  CalendarSessionPill,
  DisciplineLegend,
} from "@/components/calendar-session-ui";

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

const weekLabelFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  timeZone: PARIS_TIMEZONE,
});

const weekdayFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  timeZone: "UTC",
});

const dayNumberFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const dayKeyFormatter = new Intl.DateTimeFormat("fr-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: PARIS_TIMEZONE,
});

function toDayKey(date: Date) {
  return dayKeyFormatter.format(date);
}

export type WeeklyCalendarProps = {
  sessionsByDate: Record<string, CalendarSessionItem[]>;
  weekStarts: string[];
  compact?: boolean;
};

export function WeeklyCalendar({
  sessionsByDate,
  weekStarts,
  compact = true,
}: WeeklyCalendarProps) {
  const todayKey = toDayKey(new Date());

  return (
    <div className="w-full">
      <DisciplineLegend compact={compact} />

      <div className="space-y-5">
        {weekStarts.map((weekStartIso) => {
          const weekStart = new Date(weekStartIso);
          const weekKey = calendarDateKey(weekStart);

          return (
            <section key={weekKey}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-black/45">
                Semaine du {weekLabelFormatter.format(weekStart)}
              </p>
              <div
                className={cn(
                  "mb-2 grid grid-cols-7 text-center font-semibold uppercase tracking-wide text-black/45",
                  compact ? "text-[10px]" : "text-xs",
                )}
              >
                {WEEKDAY_LABELS.map((label, i) => (
                  <span key={`${weekKey}-${i}-${label}`} className="py-1">
                    {label}
                  </span>
                ))}
              </div>
              <div
                className={cn(
                  "grid grid-cols-7",
                  compact ? "gap-1 md:gap-1.5" : "gap-1.5 md:gap-2",
                )}
              >
                {Array.from({ length: 7 }, (_, index) => {
                  const day = addUtcDays(weekStart, index);
                  const dayKey = calendarDateKey(day);
                  const parisDayKey = toDayKey(day);
                  const isToday = parisDayKey === todayKey;
                  const sessions = sessionsByDate[parisDayKey] ?? [];

                  return (
                    <div
                      key={dayKey}
                      className={cn(
                        "flex flex-col rounded-xl border border-black/10 bg-white text-sm transition-colors",
                        compact ? "min-h-[72px] p-1.5" : "min-h-[96px] p-2",
                        isToday && "border-black/30 ring-2 ring-black/20",
                      )}
                    >
                      <div className="text-center">
                        <p className="text-[10px] font-semibold uppercase text-black/45">
                          {weekdayFormatter.format(day)}
                        </p>
                        <p
                          className={cn(
                            "text-xs font-semibold",
                            isToday
                              ? "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-white"
                              : "text-black/70",
                          )}
                        >
                          {dayNumberFormatter.format(day)}
                        </p>
                      </div>
                      {sessions.length > 0 && (
                        <div
                          className={cn(
                            "mt-1.5 flex flex-1 flex-col overflow-hidden",
                            compact ? "gap-0.5" : "gap-1",
                          )}
                        >
                          {sessions.map((session) => (
                            <CalendarSessionPill
                              key={session.id}
                              session={session}
                              compact={compact}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
