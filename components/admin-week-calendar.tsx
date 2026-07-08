"use client";

import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  addParisCalendarDays,
  formatParisDate,
  getParisWeekMonday,
  getParisWeekdayIndex,
  PARIS_TIMEZONE,
  parseParisDateTime,
} from "@/lib/paris-time";
import { cn } from "@/lib/utils";

export type AdminWeekCalendarSession = {
  id?: string;
  date: string;
  start: string;
  end: string;
  activity_id?: string;
  activity_name?: string;
  max_registrations?: number | null;
};

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const ACTIVITY_COLORS = [
  "bg-blue-500/15 border-blue-500/40 text-blue-950",
  "bg-emerald-500/15 border-emerald-500/40 text-emerald-950",
  "bg-violet-500/15 border-violet-500/40 text-violet-950",
  "bg-amber-500/15 border-amber-500/40 text-amber-950",
  "bg-rose-500/15 border-rose-500/40 text-rose-950",
  "bg-cyan-500/15 border-cyan-500/40 text-cyan-950",
  "bg-orange-500/15 border-orange-500/40 text-orange-950",
  "bg-indigo-500/15 border-indigo-500/40 text-indigo-950",
];

export function getActivityColorClass(activityId: string, activityIds: string[]): string {
  const index = activityIds.indexOf(activityId);
  if (index === -1) return ACTIVITY_COLORS[0];
  return ACTIVITY_COLORS[index % ACTIVITY_COLORS.length];
}

type ActivityLegendItem = {
  id: string;
  name: string;
  sessionCount: number;
};

interface AdminWeekCalendarProps {
  weekOffset: number;
  sessions: AdminWeekCalendarSession[];
  title?: string;
  emptyDayLabel?: string;
  minDayHeight?: string;
  selectedActivityIds?: Set<string>;
  activityLegend?: ActivityLegendItem[];
  onToggleActivity?: (activityId: string) => void;
  onSelectAllActivities?: () => void;
  onDeselectAllActivities?: () => void;
  selectedDays?: number[];
  onToggleDay?: (dayIndex: number) => void;
  sessionVariant?: "default" | "preview" | "target";
  /** Stable activity order for consistent colors across source/target calendars */
  activityColorIds?: string[];
  legendReadOnly?: boolean;
  className?: string;
}

export function AdminWeekCalendar({
  weekOffset,
  sessions,
  title,
  emptyDayLabel = "—",
  minDayHeight = "min-h-[220px]",
  selectedActivityIds,
  activityLegend,
  onToggleActivity,
  onSelectAllActivities,
  onDeselectAllActivities,
  selectedDays,
  onToggleDay,
  sessionVariant = "default",
  activityColorIds,
  legendReadOnly = false,
  className,
}: AdminWeekCalendarProps) {
  const weekDays = useMemo(() => {
    const weekMonday = getParisWeekMonday(weekOffset);
    return Array.from({ length: 7 }, (_, index) =>
      addParisCalendarDays(weekMonday, index),
    );
  }, [weekOffset]);

  const activityIdsForColors = useMemo(() => {
    if (activityColorIds?.length) return activityColorIds;
    if (activityLegend?.length) return activityLegend.map((item) => item.id);
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const session of sessions) {
      if (session.activity_id && !seen.has(session.activity_id)) {
        seen.add(session.activity_id);
        ids.push(session.activity_id);
      }
    }
    return ids;
  }, [activityColorIds, activityLegend, sessions]);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, AdminWeekCalendarSession[]>();
    for (const session of sessions) {
      const existing = map.get(session.date) ?? [];
      existing.push(session);
      map.set(session.date, existing);
    }
    for (const [dateKey, daySessions] of map.entries()) {
      map.set(
        dateKey,
        daySessions.sort((left, right) => left.start.localeCompare(right.start)),
      );
    }
    return map;
  }, [sessions]);

  const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: PARIS_TIMEZONE,
  });

  const formatDayLabel = (dateKey: string) =>
    dateFormatter.format(parseParisDateTime(dateKey, "12:00"));

  const showLegend =
    activityLegend &&
    activityLegend.length > 0 &&
    (legendReadOnly || (onToggleActivity && selectedActivityIds));

  return (
    <div className={cn("space-y-3", className)}>
      {title ? <h4 className="text-sm font-semibold">{title}</h4> : null}

      {showLegend ? (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Activités
            </p>
            {onSelectAllActivities && onDeselectAllActivities ? (
              <div className="flex gap-1">
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={onSelectAllActivities}
                >
                  Tout
                </button>
                <span className="text-xs text-muted-foreground">·</span>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={onDeselectAllActivities}
                >
                  Aucun
                </button>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {activityLegend.map((item) => {
              const isSelected = legendReadOnly
                ? true
                : selectedActivityIds!.has(item.id);
              const colorClass = getActivityColorClass(item.id, activityIdsForColors);
              if (legendReadOnly) {
                return (
                  <span
                    key={item.id}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                      colorClass,
                    )}
                  >
                    <span className="font-medium truncate max-w-[180px]">{item.name}</span>
                    <span className="text-muted-foreground">({item.sessionCount})</span>
                  </span>
                );
              }
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggleActivity!(item.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-opacity",
                    colorClass,
                    !isSelected && "opacity-40",
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    className="pointer-events-none h-3.5 w-3.5"
                    aria-hidden
                  />
                  <span className="font-medium truncate max-w-[180px]">{item.name}</span>
                  <span className="text-muted-foreground">({item.sessionCount})</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border bg-background">
        <div className="min-w-[720px] grid grid-cols-7 divide-x">
          {WEEKDAY_LABELS.map((label, index) => {
            const dateKey = weekDays[index];
            const dayIndex = getParisWeekdayIndex(parseParisDateTime(dateKey, "12:00"));
            const daySessions = sessionsByDate.get(dateKey) ?? [];
            const isToday = formatParisDate(new Date()) === dateKey;
            const isDaySelected = selectedDays?.includes(dayIndex) ?? false;
            const isDaySelectable = Boolean(onToggleDay);

            return (
              <div
                key={dateKey}
                className={cn(
                  "flex flex-col",
                  isDaySelected && "bg-primary/5",
                  isDaySelectable && !isDaySelected && "bg-muted/20",
                )}
              >
                <button
                  type="button"
                  disabled={!isDaySelectable}
                  onClick={() => onToggleDay?.(dayIndex)}
                  className={cn(
                    "border-b px-2 py-3 text-left transition-colors",
                    isDaySelectable && "hover:bg-muted/50 cursor-pointer",
                    !isDaySelectable && "cursor-default",
                    isToday && "ring-2 ring-inset ring-primary",
                    isDaySelected && "bg-primary/10",
                  )}
                >
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                    {label}
                  </p>
                  <p className="text-sm font-semibold">{formatDayLabel(dateKey)}</p>
                  {isDaySelectable ? (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {isDaySelected ? "Sélectionné" : "Cliquer pour sélectionner"}
                    </p>
                  ) : null}
                </button>

                <div className={cn("flex flex-1 flex-col gap-1.5 p-2", minDayHeight)}>
                  {daySessions.length > 0 ? (
                    daySessions.map((session, sessionIndex) => {
                      const isActivitySelected =
                        !selectedActivityIds ||
                        !session.activity_id ||
                        selectedActivityIds.has(session.activity_id);
                      const colorClass = session.activity_id
                        ? getActivityColorClass(session.activity_id, activityIdsForColors)
                        : sessionVariant === "preview"
                          ? "bg-green-500/15 border-green-500/40 text-green-950 border-dashed"
                          : "bg-primary/15 border-primary/30";

                      return (
                        <div
                          key={session.id ?? `${session.date}-${session.start}-${sessionIndex}`}
                          className={cn(
                            "rounded-md border px-2 py-1.5 text-xs transition-opacity",
                            colorClass,
                            !isActivitySelected && "opacity-30",
                            sessionVariant === "preview" && "border-dashed",
                            sessionVariant === "target" && "ring-1 ring-inset ring-black/5",
                          )}
                        >
                          <p className="font-semibold tabular-nums">
                            {session.start} – {session.end}
                          </p>
                          {session.activity_name ? (
                            <p className="mt-0.5 truncate text-[10px] opacity-80">
                              {session.activity_name}
                            </p>
                          ) : null}
                          {session.max_registrations ? (
                            <p className="mt-0.5 text-[10px] opacity-70">
                              max {session.max_registrations}
                            </p>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <p className="flex flex-1 items-center justify-center text-xs italic text-muted-foreground/50">
                      {emptyDayLabel}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {onToggleDay ? (
        <p className="text-xs text-muted-foreground">
          Cliquez sur un jour du calendrier pour choisir où créer les sessions.
        </p>
      ) : null}
    </div>
  );
}
