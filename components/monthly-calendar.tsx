"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  COURSE_DISCIPLINE_COLORS,
  type CourseDiscipline,
} from "@/lib/course-disciplines";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo, type CSSProperties } from "react";

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
  discipline: CourseDiscipline | null;
};

const DISCIPLINE_LABEL: Record<CourseDiscipline, string> = {
  menuiserie: "Menuiserie",
  couture: "Couture",
  electronique: "Électronique",
  ceramique: "Céramique",
};

const NEUTRAL_PILL_STYLE: CSSProperties = {
  color: "#1f1f1f",
  backgroundColor: "#f1f1f1",
  borderColor: "rgba(0,0,0,0.08)",
};

/** Strip the optional "Discipline/" or "Discipline /" prefix from session titles. */
function stripDisciplinePrefix(name: string, discipline: CourseDiscipline | null) {
  if (!discipline) return name;
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  const candidates = [`${discipline}/`, `${discipline} /`, `${DISCIPLINE_LABEL[discipline].toLowerCase()}/`];
  for (const prefix of candidates) {
    if (lower.startsWith(prefix)) {
      return trimmed.slice(prefix.length).trim() || trimmed;
    }
  }
  return trimmed;
}

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
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setVisibleMonth(addMonthsUTC(visibleMonth, -1))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black/70 transition hover:bg-black/5"
          aria-label="Mois précédent"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-xl font-semibold capitalize text-black/85 md:text-2xl">
          {monthFormatter.format(visibleMonth)}
        </p>
        <button
          type="button"
          onClick={() => setVisibleMonth(addMonthsUTC(visibleMonth, 1))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black/70 transition hover:bg-black/5"
          aria-label="Mois suivant"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <DisciplineLegend />

      <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wide text-black/45">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={`${i}-${label}`} className="py-2">
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 md:gap-2">
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
                "flex flex-col rounded-xl border bg-white p-2 text-sm transition-colors",
                "min-h-[110px] md:min-h-[150px] lg:min-h-[170px]",
                !isCurrentMonth && "border-black/[0.04] bg-black/[0.015] text-black/30",
                isCurrentMonth && "border-black/10",
                isToday && "border-black/30 ring-2 ring-black/20",
              )}
            >
              <span
                className={cn(
                  "mb-1.5 inline-flex h-6 w-6 items-center justify-center text-xs font-semibold",
                  isToday && isCurrentMonth
                    ? "rounded-full bg-black text-white"
                    : "text-black/70",
                  !isCurrentMonth && "text-black/30",
                )}
              >
                {day.getUTCDate()}
              </span>
              {hasSessions && (
                <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                  {sessions.map((session) => {
                    const href = `/reserver?activity=${encodeURIComponent(session.activityId)}&session=${encodeURIComponent(session.id)}`;
                    const time = timeFormatter.format(new Date(session.start_ts));
                    const title = stripDisciplinePrefix(
                      session.activityName,
                      session.discipline,
                    );
                    const palette = session.discipline
                      ? COURSE_DISCIPLINE_COLORS[session.discipline]
                      : null;
                    const pillStyle: CSSProperties = palette
                      ? {
                          color: palette.fg,
                          backgroundColor: palette.tint,
                          borderColor: `${palette.fg}33`,
                        }
                      : NEUTRAL_PILL_STYLE;
                    return (
                      <Link
                        key={session.id}
                        href={href}
                        scroll={false}
                        style={pillStyle}
                        className="group/pill block rounded-md border px-1.5 py-1 text-[11px] font-medium leading-tight transition hover:brightness-95"
                        title={`Réserver — ${time} ${title}`}
                      >
                        <span className="block font-semibold tabular-nums">
                          {time}
                        </span>
                        <span className="mt-0.5 line-clamp-3 break-words text-[11px] leading-snug">
                          {title}
                        </span>
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

function DisciplineLegend() {
  const entries = Object.entries(COURSE_DISCIPLINE_COLORS) as Array<[
    CourseDiscipline,
    (typeof COURSE_DISCIPLINE_COLORS)[CourseDiscipline],
  ]>;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-black/65">
      {entries.map(([discipline, palette]) => (
        <span key={discipline} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: palette.fg }}
          />
          {DISCIPLINE_LABEL[discipline]}
        </span>
      ))}
    </div>
  );
}
