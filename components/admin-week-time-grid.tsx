"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  AdminWeekCalendarSession,
  getActivityColorClass,
} from "@/components/admin-week-calendar";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
export const HOUR_HEIGHT_PX = 52;
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 22;
const SNAP_MINUTES = 15;

function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return (hour ?? 0) * 60 + (minute ?? 0);
}

function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, totalMinutes));
  const hour = Math.floor(clamped / 60);
  const minute = clamped % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function snapMinutes(minutes: number, step = SNAP_MINUTES): number {
  return Math.round(minutes / step) * step;
}

function yToMinutes(y: number, startHour: number): number {
  return startHour * 60 + (y / HOUR_HEIGHT_PX) * 60;
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

type TimedGridEvent = {
  session: AdminWeekCalendarSession;
  variant: "existing" | "preview";
  startMin: number;
  endMin: number;
};

type TimedGridEventLayout = TimedGridEvent & {
  column: number;
  totalColumns: number;
};

function eventsOverlap(left: TimedGridEvent, right: TimedGridEvent): boolean {
  return left.startMin < right.endMin && right.startMin < left.endMin;
}

function layoutOverlappingEvents(events: TimedGridEvent[]): TimedGridEventLayout[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort((left, right) => {
    if (left.startMin !== right.startMin) return left.startMin - right.startMin;
    return right.endMin - right.startMin - (left.endMin - left.startMin);
  });

  const columnEnds: number[] = [];
  const withColumn = sorted.map((event) => {
    let column = columnEnds.findIndex((endMin) => endMin <= event.startMin);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(event.endMin);
    } else {
      columnEnds[column] = event.endMin;
    }
    return { ...event, column };
  });

  return withColumn.map((event) => {
    const overlapping = withColumn.filter((other) => eventsOverlap(event, other));
    const totalColumns = Math.max(...overlapping.map((other) => other.column + 1));
    return { ...event, totalColumns };
  });
}

function toTimedGridEvent(
  session: AdminWeekCalendarSession,
  variant: "existing" | "preview",
): TimedGridEvent {
  return {
    session,
    variant,
    startMin: timeToMinutes(session.start),
    endMin: timeToMinutes(session.end),
  };
}

export type CalendarSlotSelection = {
  dayIndex: number;
  date: string;
  startTime: string;
  endTime: string;
};

type ActivityLegendItem = {
  id: string;
  name: string;
  sessionCount: number;
};

interface AdminWeekTimeGridProps {
  weekOffset: number;
  existingSessions?: AdminWeekCalendarSession[];
  previewSessions?: AdminWeekCalendarSession[];
  activityColorIds?: string[];
  selectedDays?: number[];
  onToggleDay?: (dayIndex: number) => void;
  selectable?: boolean;
  onSelectSlot?: (selection: CalendarSlotSelection) => void;
  onExistingSessionClick?: (session: AdminWeekCalendarSession) => void;
  title?: string;
  activityLegend?: ActivityLegendItem[];
  selectedActivityIds?: Set<string>;
  onToggleActivity?: (activityId: string) => void;
  onSelectAllActivities?: () => void;
  onDeselectAllActivities?: () => void;
  legendReadOnly?: boolean;
  className?: string;
}

type DragState = {
  dateKey: string;
  dayIndex: number;
  startY: number;
  currentY: number;
};

export function AdminWeekTimeGrid({
  weekOffset,
  existingSessions = [],
  previewSessions = [],
  activityColorIds = [],
  selectedDays,
  onToggleDay,
  selectable = false,
  onSelectSlot,
  onExistingSessionClick,
  title,
  activityLegend,
  selectedActivityIds,
  onToggleActivity,
  onSelectAllActivities,
  onDeselectAllActivities,
  legendReadOnly = false,
  className,
}: AdminWeekTimeGridProps) {
  const columnRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [dragState, setDragState] = useState<DragState | null>(null);

  const weekDays = useMemo(() => {
    const weekMonday = getParisWeekMonday(weekOffset);
    return Array.from({ length: 7 }, (_, index) =>
      addParisCalendarDays(weekMonday, index),
    );
  }, [weekOffset]);

  const allSessions = useMemo(
    () => [...existingSessions, ...previewSessions],
    [existingSessions, previewSessions],
  );

  const { startHour, endHour } = useMemo(
    () => computeHourRange(allSessions),
    [allSessions],
  );

  const hours = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, index) => startHour + index),
    [startHour, endHour],
  );

  const gridHeight = hours.length * HOUR_HEIGHT_PX;

  const sessionsByDate = useMemo(() => {
    const existing = new Map<string, AdminWeekCalendarSession[]>();
    const preview = new Map<string, AdminWeekCalendarSession[]>();

    for (const session of existingSessions) {
      const list = existing.get(session.date) ?? [];
      list.push(session);
      existing.set(session.date, list);
    }
    for (const session of previewSessions) {
      const list = preview.get(session.date) ?? [];
      list.push(session);
      preview.set(session.date, list);
    }

    return { existing, preview };
  }, [existingSessions, previewSessions]);

  const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: PARIS_TIMEZONE,
  });

  const formatDayLabel = (dateKey: string) =>
    dateFormatter.format(parseParisDateTime(dateKey, "12:00"));

  const activityIdsForColors = useMemo(() => {
    if (activityColorIds.length > 0) return activityColorIds;
    if (activityLegend?.length) return activityLegend.map((item) => item.id);
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const session of allSessions) {
      if (session.activity_id && !seen.has(session.activity_id)) {
        seen.add(session.activity_id);
        ids.push(session.activity_id);
      }
    }
    return ids;
  }, [activityColorIds, activityLegend, allSessions]);

  const showLegend =
    activityLegend &&
    activityLegend.length > 0 &&
    (legendReadOnly || (onToggleActivity && selectedActivityIds));

  const commitSelection = useCallback(
    (dateKey: string, dayIndex: number, y1: number, y2: number) => {
      if (!onSelectSlot) return;

      const topY = Math.max(0, Math.min(y1, y2));
      const bottomY = Math.min(gridHeight, Math.max(y1, y2));

      let startMinutes = snapMinutes(yToMinutes(topY, startHour));
      let endMinutes = snapMinutes(yToMinutes(bottomY, startHour));

      if (endMinutes <= startMinutes) {
        endMinutes = startMinutes + SNAP_MINUTES;
      }

      const maxMinutes = endHour * 60;
      startMinutes = Math.min(startMinutes, maxMinutes - SNAP_MINUTES);
      endMinutes = Math.min(Math.max(endMinutes, startMinutes + SNAP_MINUTES), maxMinutes);

      onSelectSlot({
        dayIndex,
        date: dateKey,
        startTime: minutesToTime(startMinutes),
        endTime: minutesToTime(endMinutes),
      });
    },
    [endHour, gridHeight, onSelectSlot, startHour],
  );

  useEffect(() => {
    if (!dragState || !selectable) return;

    const handlePointerMove = (event: PointerEvent) => {
      const column = columnRefs.current.get(dragState.dateKey);
      if (!column) return;
      const rect = column.getBoundingClientRect();
      const y = Math.max(0, Math.min(gridHeight, event.clientY - rect.top));
      setDragState((previous) =>
        previous ? { ...previous, currentY: y } : previous,
      );
    };

    const handlePointerUp = (event: PointerEvent) => {
      const column = columnRefs.current.get(dragState.dateKey);
      if (!column) {
        setDragState(null);
        return;
      }
      const rect = column.getBoundingClientRect();
      const y = Math.max(0, Math.min(gridHeight, event.clientY - rect.top));
      commitSelection(dragState.dateKey, dragState.dayIndex, dragState.startY, y);
      setDragState(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [commitSelection, dragState, gridHeight, selectable]);

  const handleColumnPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    dateKey: string,
    dayIndex: number,
  ) => {
    if (!selectable || !onSelectSlot || event.button !== 0) return;

    const column = columnRefs.current.get(dateKey);
    if (!column) return;

    event.preventDefault();
    const rect = column.getBoundingClientRect();
    const y = Math.max(0, Math.min(gridHeight, event.clientY - rect.top));

    setDragState({
      dateKey,
      dayIndex,
      startY: y,
      currentY: y,
    });
  };

  const renderEvent = (
    layout: TimedGridEventLayout,
    layoutIndex: number,
  ) => {
    const { session, variant, column, totalColumns } = layout;
    const startMinutes = timeToMinutes(session.start);
    const endMinutes = timeToMinutes(session.end);
    const top = ((startMinutes - startHour * 60) / 60) * HOUR_HEIGHT_PX;
    const height = Math.max(
      ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT_PX,
      22,
    );

    const isActivitySelected =
      variant === "preview" ||
      !selectedActivityIds ||
      !session.activity_id ||
      selectedActivityIds.has(session.activity_id);

    const colorClass = session.activity_id
      ? getActivityColorClass(session.activity_id, activityIdsForColors)
      : variant === "preview"
        ? "bg-green-500/20 border-green-500/50 text-green-950"
        : "bg-primary/15 border-primary/40 text-foreground";

    const isClickable = variant === "existing" && Boolean(onExistingSessionClick);
    const widthPercent = 100 / totalColumns;
    const leftPercent = (column / totalColumns) * 100;

    return (
      <div
        key={
          session.id ??
          `${session.date}-${session.start}-${variant}-${layoutIndex}`
        }
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onClick={
          isClickable
            ? (event) => {
                event.stopPropagation();
                onExistingSessionClick?.(session);
              }
            : undefined
        }
        onKeyDown={
          isClickable
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  onExistingSessionClick?.(session);
                }
              }
            : undefined
        }
        className={cn(
          "absolute overflow-hidden rounded border px-1 py-0.5 text-[10px] leading-tight shadow-sm",
          colorClass,
          variant === "preview" && "border-dashed ring-1 ring-green-500/30 z-20",
          variant === "existing" && "z-10",
          variant === "preview" && selectable && "pointer-events-none",
          isClickable && "pointer-events-auto cursor-pointer hover:brightness-95",
          !isActivitySelected && "opacity-30",
        )}
        style={{
          top: `${top}px`,
          height: `${height}px`,
          left: `calc(${leftPercent}% + 1px)`,
          width: `calc(${widthPercent}% - 2px)`,
        }}
        title={`${session.activity_name ?? "Session"} · ${session.start} – ${session.end}`}
      >
        <p className="font-semibold tabular-nums truncate">
          {session.start} – {session.end}
        </p>
        {session.activity_name ? (
          <p className="truncate opacity-90">{session.activity_name}</p>
        ) : null}
        {variant === "preview" ? (
          <p className="truncate text-[9px] uppercase tracking-wide opacity-70">Nouveau</p>
        ) : null}
      </div>
    );
  };

  const renderDragOverlay = (dateKey: string) => {
    if (!dragState || dragState.dateKey !== dateKey) return null;

    const topY = Math.min(dragState.startY, dragState.currentY);
    const bottomY = Math.max(dragState.startY, dragState.currentY);
    const height = Math.max(bottomY - topY, SNAP_MINUTES * (HOUR_HEIGHT_PX / 60));

    const startMinutes = snapMinutes(yToMinutes(topY, startHour));
    const endMinutes = snapMinutes(
      Math.max(yToMinutes(topY + height, startHour), startMinutes + SNAP_MINUTES),
    );

    return (
      <div
        className="pointer-events-none absolute left-0.5 right-0.5 z-30 rounded border-2 border-dashed border-green-600 bg-green-500/25 px-1.5 py-0.5 text-[10px] font-semibold text-green-950"
        style={{ top: `${topY}px`, height: `${height}px` }}
      >
        {minutesToTime(startMinutes)} – {minutesToTime(endMinutes)}
      </div>
    );
  };

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
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
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
                  onClick={() => onToggleActivity?.(item.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-opacity",
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

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border bg-primary/15 border-primary/40" />
          Existant
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-dashed bg-green-500/20 border-green-500/50" />
          À créer
        </span>
        {selectable ? (
          <span className="text-muted-foreground">
            · Cliquez ou glissez sur un créneau libre
          </span>
        ) : null}
        {onExistingSessionClick ? (
          <span className="text-muted-foreground">
            · Cliquez sur un créneau existant pour le gérer
          </span>
        ) : null}
      </div>

      <div className="overflow-auto rounded-lg border bg-background max-h-[640px]">
        <div className="min-w-[760px]">
          <div
            className="sticky top-0 z-30 grid border-b bg-background"
            style={{ gridTemplateColumns: "56px repeat(7, minmax(0, 1fr))" }}
          >
            <div className="border-r bg-muted/30" />
            {WEEKDAY_LABELS.map((label, index) => {
              const dateKey = weekDays[index];
              const dayIndex = getParisWeekdayIndex(parseParisDateTime(dateKey, "12:00"));
              const isToday = formatParisDate(new Date()) === dateKey;
              const isDaySelected = selectedDays?.includes(dayIndex) ?? false;
              const isDaySelectable = Boolean(onToggleDay);

              return (
                <button
                  key={dateKey}
                  type="button"
                  disabled={!isDaySelectable}
                  onClick={() => onToggleDay?.(dayIndex)}
                  className={cn(
                    "border-r px-2 py-2 text-left transition-colors last:border-r-0",
                    isDaySelectable && "hover:bg-muted/50 cursor-pointer",
                    !isDaySelectable && "cursor-default",
                    isToday && "bg-primary/5",
                    isDaySelected && "bg-primary/10 ring-2 ring-inset ring-primary/30",
                  )}
                >
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                    {label}
                  </p>
                  <p className="text-sm font-semibold">{formatDayLabel(dateKey)}</p>
                  {isDaySelectable ? (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {isDaySelected ? "Sélectionné" : "Cliquer"}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>

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

            <div
              className="grid flex-1 grid-cols-7"
              style={{ height: gridHeight }}
            >
              {weekDays.map((dateKey) => {
                const dayIndex = getParisWeekdayIndex(parseParisDateTime(dateKey, "12:00"));
                const isDaySelected = selectedDays?.includes(dayIndex) ?? false;
                const dayExisting = sessionsByDate.existing.get(dateKey) ?? [];
                const dayPreview = sessionsByDate.preview.get(dateKey) ?? [];
                const dayEventLayouts = layoutOverlappingEvents([
                  ...dayExisting.map((session) => toTimedGridEvent(session, "existing")),
                  ...dayPreview.map((session) => toTimedGridEvent(session, "preview")),
                ]);

                return (
                  <div
                    key={dateKey}
                    ref={(node) => {
                      if (node) {
                        columnRefs.current.set(dateKey, node);
                      } else {
                        columnRefs.current.delete(dateKey);
                      }
                    }}
                    className={cn(
                      "relative border-r last:border-r-0",
                      isDaySelected && "bg-primary/[0.03]",
                      selectable && "cursor-crosshair",
                    )}
                    onPointerDown={(event) =>
                      handleColumnPointerDown(event, dateKey, dayIndex)
                    }
                  >
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="border-b border-black/5 pointer-events-none"
                        style={{ height: HOUR_HEIGHT_PX }}
                      />
                    ))}

                    {dayEventLayouts.map((layout, layoutIndex) =>
                      renderEvent(layout, layoutIndex),
                    )}
                    {renderDragOverlay(dateKey)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {onToggleDay && !selectable ? (
        <p className="text-xs text-muted-foreground">
          Cliquez sur un jour en haut du calendrier pour choisir où créer les sessions.
        </p>
      ) : null}
    </div>
  );
}
