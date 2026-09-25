"use client";

import { loadPracticeCalendarMonthSessions } from "@/app/calendar/actions";
import type { CalendarSessionItem } from "@/components/monthly-calendar";
import {
  scrollableDialogBodyClass,
  scrollableDialogContentClass,
} from "@/components/reservation-modal";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  COURSE_DISCIPLINE_COLORS,
  type CourseDiscipline,
} from "@/lib/course-disciplines";
import { getCalendarMonthKey } from "@/lib/paris-calendar";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const PARIS_TIMEZONE = "Europe/Paris";
const WEEKDAY_SHORT = ["L", "M", "M", "J", "V", "S", "D"];

const PRACTICE_DISCIPLINES: CourseDiscipline[] = [
  "menuiserie",
  "couture",
  "ceramique",
];

const DISCIPLINE_LABEL: Record<CourseDiscipline, string> = {
  menuiserie: "Menuiserie",
  couture: "Couture",
  electronique: "Électronique",
  ceramique: "Céramique",
  autre: "Autre",
};

const TYPE_LABEL: Record<string, string> = {
  autonomie: "Autonomie complète",
  autonomie_encadree: "Autonomie encadrée",
  accompagnement: "Accompagnement",
  cuisson: "Cuisson",
};

const monthFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
  timeZone: PARIS_TIMEZONE,
});

const dayHeadingFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
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

type SessionsByDate = Record<string, CalendarSessionItem[]>;

const startOfMonthUTC = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12, 0, 0));

const addMonthsUTC = (date: Date, delta: number) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1, 12, 0, 0),
  );

const toDayKey = (date: Date) => dayKeyFormatter.format(date);

function buildCalendarGrid(month: Date) {
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
}

function formatType(session: CalendarSessionItem) {
  const type = session.activityType?.trim();
  if (type && TYPE_LABEL[type]) return TYPE_LABEL[type];
  return session.activityName;
}

function formatTimeRange(start: string, end: string) {
  return `${timeFormatter.format(new Date(start))} – ${timeFormatter.format(new Date(end))}`;
}

function currentMonthAnchor() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = Number(parts.find((p) => p.type === "year")!.value);
  const month = Number(parts.find((p) => p.type === "month")!.value);
  return new Date(Date.UTC(year, month - 1, 1, 12, 0, 0));
}

function PracticeAvailabilityCalendar({
  onClose,
}: {
  onClose?: () => void;
}) {
  const [visibleMonth, setVisibleMonth] = useState(currentMonthAnchor);
  const [sessionsByDate, setSessionsByDate] = useState<SessionsByDate>({});
  const [loadingMonthKey, setLoadingMonthKey] = useState<string | null>(null);
  const [activeDiscipline, setActiveDiscipline] =
    useState<CourseDiscipline | null>(null);
  const loadedMonthKeysRef = useRef(new Set<string>());
  const todayKey = toDayKey(new Date());

  const calendarDays = useMemo(
    () => buildCalendarGrid(visibleMonth),
    [visibleMonth],
  );

  useEffect(() => {
    const monthKey = getCalendarMonthKey(visibleMonth);
    if (loadedMonthKeysRef.current.has(monthKey)) return;

    let cancelled = false;
    setLoadingMonthKey(monthKey);

    void loadPracticeCalendarMonthSessions(
      visibleMonth.getUTCFullYear(),
      visibleMonth.getUTCMonth() + 1,
    ).then((next) => {
      if (cancelled) return;
      loadedMonthKeysRef.current.add(monthKey);
      setSessionsByDate((prev) => ({ ...prev, ...next }));
      setLoadingMonthKey(null);
    });

    return () => {
      cancelled = true;
    };
  }, [visibleMonth]);

  const matchFilter = (session: CalendarSessionItem) =>
    activeDiscipline == null || session.discipline === activeDiscipline;

  const firstBusyKey = useMemo(() => {
    for (const day of calendarDays) {
      if (day.getUTCMonth() !== visibleMonth.getUTCMonth()) continue;
      const sessions = (sessionsByDate[toDayKey(day)] ?? []).filter(
        (session) =>
          activeDiscipline == null || session.discipline === activeDiscipline,
      );
      if (sessions.length > 0) return toDayKey(day);
    }
    return todayKey;
  }, [calendarDays, visibleMonth, sessionsByDate, todayKey, activeDiscipline]);

  const [selectedKey, setSelectedKey] = useState(firstBusyKey);
  useEffect(() => {
    setSelectedKey(firstBusyKey);
  }, [firstBusyKey]);

  const selectedSessions = (sessionsByDate[selectedKey] ?? []).filter(
    matchFilter,
  );
  const selectedDate =
    calendarDays.find((d) => toDayKey(d) === selectedKey) ?? new Date();
  const loading = loadingMonthKey === getCalendarMonthKey(visibleMonth);

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[26px] font-bold leading-tight text-black">
            Disponibilités
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-normal text-black/65">
            Parcourez le calendrier pour voir les créneaux de pratique libre et
            trouver un moment qui colle à votre agenda.
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setVisibleMonth(addMonthsUTC(visibleMonth, -1))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black/70 transition hover:bg-black/5"
          aria-label="Mois précédent"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 text-lg font-semibold capitalize text-black/85">
          {monthFormatter.format(visibleMonth)}
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-black/40" />
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setVisibleMonth(addMonthsUTC(visibleMonth, 1))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black/70 transition hover:bg-black/5"
          aria-label="Mois suivant"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {PRACTICE_DISCIPLINES.map((value) => {
          const active = activeDiscipline === value;
          const palette = COURSE_DISCIPLINE_COLORS[value];
          const dimmed = activeDiscipline != null && !active;
          return (
            <button
              key={value}
              type="button"
              onClick={() =>
                setActiveDiscipline((current) =>
                  current === value ? null : value,
                )
              }
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition",
                active
                  ? "border-transparent"
                  : dimmed
                    ? "border-black/10 bg-white text-black/30"
                    : "border-black/15 bg-white text-black/70 hover:border-black/25",
              )}
              style={
                active
                  ? { color: palette.fg, backgroundColor: palette.tint }
                  : undefined
              }
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: dimmed ? "#c4c4c4" : palette.fg,
                }}
              />
              {DISCIPLINE_LABEL[value]}
            </button>
          );
        })}
      </div>

      <div className="mt-4 mb-2 grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wide text-black/45">
        {WEEKDAY_SHORT.map((label, i) => (
          <span key={`${i}-${label}`} className="py-2">
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 md:gap-2">
        {calendarDays.map((day) => {
          const key = toDayKey(day);
          const inMonth =
            day.getUTCMonth() === visibleMonth.getUTCMonth() &&
            day.getUTCFullYear() === visibleMonth.getUTCFullYear();
          const sessions = (sessionsByDate[key] ?? []).filter(matchFilter);
          const isSelected = key === selectedKey;
          const isToday = key === todayKey;
          const disciplines = [
            ...new Set(
              sessions
                .map((s) => s.discipline)
                .filter((d): d is CourseDiscipline => Boolean(d)),
            ),
          ];

          return (
            <button
              key={key}
              type="button"
              disabled={!inMonth}
              onClick={() => setSelectedKey(key)}
              className={cn(
                "relative flex min-h-[64px] flex-col overflow-hidden rounded-[12px] border transition md:min-h-[76px]",
                !inMonth && "pointer-events-none opacity-25",
                isSelected
                  ? "border-[#4a56dd] ring-2 ring-[#4a56dd]/25"
                  : sessions.length
                    ? "border-black/10 bg-white hover:border-black/25"
                    : "border-black/6 bg-[#fafafa] hover:border-black/15",
                isToday && !isSelected && "ring-1 ring-black/30",
              )}
            >
              <span className="relative z-10 flex flex-1 flex-col items-center px-1 py-2">
                <span
                  className={cn(
                    "rounded-full px-1.5 text-sm font-semibold",
                    isToday
                      ? "bg-[#4a56dd] text-white"
                      : "text-black/75",
                  )}
                >
                  {day.getUTCDate()}
                </span>
                <div className="mt-auto flex flex-wrap justify-center gap-0.5 pb-0.5">
                  {disciplines.slice(0, 3).map((d) => (
                    <span
                      key={d}
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: COURSE_DISCIPLINE_COLORS[d].fg,
                      }}
                    />
                  ))}
                </div>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-[19px] border border-black/10 bg-[#fff8f0] p-5">
        <h3 className="text-lg font-bold capitalize text-black/85">
          {dayHeadingFormatter.format(selectedDate)}
        </h3>
        {selectedSessions.length === 0 ? (
          <p className="mt-3 text-sm text-black/55">
            Aucune ouverture de pratique libre ce jour-là
            {activeDiscipline
              ? ` en ${DISCIPLINE_LABEL[activeDiscipline].toLowerCase()}`
              : ""}
            .
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {selectedSessions.map((session) => {
              const palette = session.discipline
                ? COURSE_DISCIPLINE_COLORS[session.discipline]
                : COURSE_DISCIPLINE_COLORS.autre;
              return (
                <li
                  key={session.id}
                  className="flex flex-col gap-3 rounded-[14px] border border-black/8 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {session.discipline ? (
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{
                            color: palette.fg,
                            backgroundColor: palette.tint,
                          }}
                        >
                          {DISCIPLINE_LABEL[session.discipline]}
                        </span>
                      ) : null}
                      <span className="text-sm font-semibold text-black/85">
                        {formatType(session)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-black/60">
                      {formatTimeRange(session.start_ts, session.end_ts)}
                    </p>
                  </div>
                  <Link
                    href={`/reserver?activity=${encodeURIComponent(session.activityId)}`}
                    scroll={false}
                    onClick={onClose}
                    className="inline-flex shrink-0 items-center justify-center rounded-[12px] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
                    style={{ backgroundColor: palette.fg }}
                  >
                    Réserver
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export function PracticeAvailabilityCalendarButton({
  className,
}: {
  className?: string;
} = {}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-[12px] border-2 border-[#4a56dd] bg-white/90 px-5 py-3 text-lg font-semibold text-[#4a56dd] transition hover:bg-[#f0f1ff]",
            className,
          )}
          aria-label="Voir le calendrier des disponibilités"
        >
          <CalendarDays className="h-5 w-5" aria-hidden />
          <span>Voir le calendrier</span>
        </button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          scrollableDialogContentClass,
          "w-[calc(100vw-2rem)] max-w-3xl border-none bg-white text-black shadow-2xl sm:rounded-[24px]",
        )}
      >
        <DialogTitle className="sr-only">
          Calendrier des disponibilités pratique libre
        </DialogTitle>
        <div className={cn(scrollableDialogBodyClass, "p-5 md:p-6")}>
          {open ? (
            <PracticeAvailabilityCalendar onClose={() => setOpen(false)} />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
