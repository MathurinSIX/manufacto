"use client";

import { loadCalendarMonthSessions } from "@/app/calendar/actions";
import { ActivitySessionPicker } from "@/components/activity-session-picker";
import type { CalendarSessionItem } from "@/components/monthly-calendar";
import { P } from "@/components/mockups/shared";
import {
  COURSE_DISCIPLINE_COLORS,
  COURSE_DISCIPLINE_OPTIONS,
  type CourseDiscipline,
} from "@/lib/course-disciplines";
import { getCalendarMonthKey } from "@/lib/paris-calendar";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const PARIS_TIMEZONE = "Europe/Paris";
const WEEKDAY_SHORT = ["L", "M", "M", "J", "V", "S", "D"];

const FALLBACK_BY_DISCIPLINE: Record<CourseDiscipline, string> = {
  menuiserie: P.heroMenuiserie,
  couture: P.heroCoutureNew,
  electronique: P.heroElecNew,
  ceramique: P.heroCeramique,
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

const DISCIPLINE_LABEL: Record<CourseDiscipline, string> = {
  menuiserie: "Menuiserie",
  couture: "Couture",
  electronique: "Électronique",
  ceramique: "Céramique",
};

export type SessionsByDate = Record<string, CalendarSessionItem[]>;

const startOfMonthUTC = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12, 0, 0));

const addMonthsUTC = (date: Date, delta: number) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1, 12, 0, 0));

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

function stripName(name: string, discipline: CourseDiscipline | null) {
  if (!discipline) return name;
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  const prefixes = [
    `${discipline}/`,
    `${discipline} /`,
    `${DISCIPLINE_LABEL[discipline].toLowerCase()}/`,
  ];
  for (const prefix of prefixes) {
    if (lower.startsWith(prefix)) return trimmed.slice(prefix.length).trim() || trimmed;
  }
  return trimmed;
}

function sessionImage(session: CalendarSessionItem) {
  if (session.imageUrl?.trim()) return session.imageUrl.trim();
  if (session.discipline) return FALLBACK_BY_DISCIPLINE[session.discipline];
  return P.atelierWide;
}

function useMonthSessions(initialSessionsByDate: SessionsByDate, currentMonthIso: string) {
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonthUTC(new Date(currentMonthIso)),
  );
  const [sessionsByDate, setSessionsByDate] = useState(initialSessionsByDate);
  const [loadingMonthKey, setLoadingMonthKey] = useState<string | null>(null);
  const loadedMonthKeysRef = useRef(
    new Set([getCalendarMonthKey(startOfMonthUTC(new Date(currentMonthIso)))]),
  );

  useEffect(() => {
    const monthKey = getCalendarMonthKey(visibleMonth);
    if (loadedMonthKeysRef.current.has(monthKey)) return;

    let cancelled = false;
    setLoadingMonthKey(monthKey);
    void loadCalendarMonthSessions(
      visibleMonth.getUTCFullYear(),
      visibleMonth.getUTCMonth() + 1,
    ).then((data) => {
      if (cancelled) return;
      setSessionsByDate((current) => ({ ...current, ...data }));
      loadedMonthKeysRef.current.add(monthKey);
      setLoadingMonthKey(null);
    });

    return () => {
      cancelled = true;
    };
  }, [visibleMonth]);

  return {
    visibleMonth,
    setVisibleMonth,
    sessionsByDate,
    loading: loadingMonthKey === getCalendarMonthKey(visibleMonth),
    todayKey: toDayKey(new Date()),
  };
}

function MonthNav({
  visibleMonth,
  loading,
  onPrev,
  onNext,
}: {
  visibleMonth: Date;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onPrev}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black/70 hover:bg-black/5"
        aria-label="Mois précédent"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-2">
        <p className="text-xl font-semibold capitalize text-black/85 md:text-2xl">
          {monthFormatter.format(visibleMonth)}
        </p>
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-black/40" /> : null}
      </div>
      <button
        type="button"
        onClick={onNext}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black/70 hover:bg-black/5"
        aria-label="Mois suivant"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

function DisciplineChip({
  discipline,
  active = true,
  onClick,
}: {
  discipline: CourseDiscipline | null;
  active?: boolean;
  onClick?: () => void;
}) {
  if (!discipline) {
    return (
      <span className="rounded-full bg-[#f2f2f2] px-2.5 py-0.5 text-xs font-medium text-black/60">
        Autre
      </span>
    );
  }
  const palette = COURSE_DISCIPLINE_COLORS[discipline];
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold transition",
        !active && "opacity-35",
      )}
      style={{ color: palette.fg, backgroundColor: palette.tint }}
    >
      {DISCIPLINE_LABEL[discipline]}
    </Tag>
  );
}

function SessionRow({ session }: { session: CalendarSessionItem }) {
  const [open, setOpen] = useState(false);
  const start = timeFormatter.format(new Date(session.start_ts));
  const end = timeFormatter.format(new Date(session.end_ts));
  const title = stripName(session.activityName, session.discipline);
  const palette = session.discipline
    ? COURSE_DISCIPLINE_COLORS[session.discipline]
    : { fg: "#454545", tint: "#f2f2f2", border: "#d9d9d9" };
  const img = sessionImage(session);
  const durationMin = Math.max(
    0,
    Math.round(
      (new Date(session.end_ts).getTime() - new Date(session.start_ts).getTime()) /
        60_000,
    ),
  );
  const durationLabel =
    durationMin >= 60
      ? `${Math.floor(durationMin / 60)}h${
          durationMin % 60 ? String(durationMin % 60).padStart(2, "0") : ""
        }`
      : durationMin > 0
        ? `${durationMin} min`
        : null;
  const meta = [
    durationLabel,
    session.nbCredits != null ? `${session.nbCredits} crédits` : null,
    session.price != null ? `${session.price} €` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full flex-col overflow-hidden rounded-[14px] border border-black/8 bg-white text-left transition hover:border-black/20 hover:shadow-sm sm:flex-row sm:gap-0"
        style={{ borderLeftWidth: 4, borderLeftColor: palette.fg }}
      >
        <div className="relative h-36 w-full shrink-0 sm:h-auto sm:aspect-[4/5] sm:w-[120px] md:w-[140px]">
          <Image
            src={img}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 140px"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 px-3.5 py-3 sm:flex-row sm:gap-4 sm:px-0 sm:py-4 sm:pr-4 sm:pl-4">
          <div className="flex shrink-0 items-baseline gap-2 text-sm font-semibold text-black/80 sm:w-[88px] sm:flex-col sm:items-start sm:gap-0">
            <p>{start}</p>
            <span className="font-normal text-black/35 sm:hidden">–</span>
            <p className="font-normal text-black/45">{end}</p>
          </div>
          <div className="min-w-0 flex-1">
            <DisciplineChip discipline={session.discipline} />
            <p className="mt-1.5 text-base font-semibold leading-snug text-black/90 sm:text-lg">
              {title}
            </p>
            {meta ? (
              <p className="mt-1 text-sm text-black/55">{meta}</p>
            ) : null}
            <p
              className="mt-2 text-sm font-semibold underline underline-offset-2"
              style={{ color: palette.fg }}
            >
              <span className="sm:hidden">S&apos;inscrire →</span>
              <span className="hidden sm:inline">
                Voir le détail / s&apos;inscrire →
              </span>
            </p>
          </div>
        </div>
      </button>
      {open ? (
        <ActivitySessionPicker
          activityId={session.activityId}
          activityTitle={title}
          activityType="cours"
          initialSessionId={session.id}
          open={open}
          onOpenChange={setOpen}
          credits={session.nbCredits}
          price={session.price}
          squareProductId={session.squareProductId}
        />
      ) : null}
    </>
  );
}

export function CalendarSwitcher({
  active,
}: {
  active: "hub" | "agenda" | "points" | "filtres";
}) {
  const links = [
    { href: "/mockups/calendrier", id: "hub" as const, label: "Hub", short: "Hub" },
    { href: "/mockups/calendrier/agenda", id: "agenda" as const, label: "A · Agenda", short: "Agenda" },
    { href: "/mockups/calendrier/points", id: "points" as const, label: "B · Mois + détail", short: "Points" },
    { href: "/mockups/calendrier/filtres", id: "filtres" as const, label: "C · Filtres", short: "Filtres" },
  ];
  return (
    <div className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1274px] flex-wrap items-center gap-2 px-4 py-2.5 md:px-5">
        <Link
          href="/mockups"
          className="rounded-md bg-[#f2f2f2] px-3 py-1.5 text-sm font-semibold text-black/70 hover:bg-[#e8e8e8]"
        >
          ← Mockups
        </Link>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-semibold",
              active === link.id
                ? "bg-[#4a56dd] text-white"
                : "bg-[#f2f2f2] text-black/80 hover:bg-[#e8e8e8]",
            )}
          >
            <span className="md:hidden">{link.short}</span>
            <span className="hidden md:inline">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** A — Chronological agenda list (most readable) */
export function CalendarAgendaMock({
  sessionsByDate: initial,
  currentMonthIso,
}: {
  sessionsByDate: SessionsByDate;
  currentMonthIso: string;
}) {
  const { visibleMonth, setVisibleMonth, sessionsByDate, loading, todayKey } =
    useMonthSessions(initial, currentMonthIso);

  const daysInMonth = useMemo(() => {
    const year = visibleMonth.getUTCFullYear();
    const month = visibleMonth.getUTCMonth();
    const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return Array.from({ length: count }, (_, i) => {
      const date = new Date(Date.UTC(year, month, i + 1, 12, 0, 0));
      const key = toDayKey(date);
      return { date, key, sessions: sessionsByDate[key] ?? [] };
    }).filter((d) => d.sessions.length > 0);
  }, [visibleMonth, sessionsByDate]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#f56800]">
        Proposition A · Agenda
      </p>
      <h1 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl">
        Calendrier des cours
      </h1>
      <p className="mt-3 text-lg text-black/65">
        Liste chronologique par jour — photo, horaires et titres lisibles.
      </p>

      <div className="mt-8">
        <MonthNav
          visibleMonth={visibleMonth}
          loading={loading}
          onPrev={() => setVisibleMonth(addMonthsUTC(visibleMonth, -1))}
          onNext={() => setVisibleMonth(addMonthsUTC(visibleMonth, 1))}
        />
      </div>

      {daysInMonth.length === 0 ? (
        <p className="rounded-[14px] bg-[#fff8f0] p-8 text-center text-lg text-black/60">
          Aucun cours prévu ce mois-ci.
        </p>
      ) : (
        <div className="space-y-10">
          {daysInMonth.map(({ date, key, sessions }) => (
            <section key={key}>
              <h2
                className={cn(
                  "mb-3 text-lg font-bold capitalize text-black/85",
                  key === todayKey && "text-[#4a56dd]",
                )}
              >
                {dayHeadingFormatter.format(date)}
                {key === todayKey ? (
                  <span className="ml-2 text-sm font-semibold normal-case text-[#4a56dd]">
                    · aujourd&apos;hui
                  </span>
                ) : null}
              </h2>
              <div className="space-y-3">
                {sessions.map((session) => (
                  <SessionRow key={session.id} session={session} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/** B — Compact month dots + selected day detail (+ discipline filters) */
export function CalendarPointsMock({
  sessionsByDate: initial,
  currentMonthIso,
  embedded = false,
}: {
  sessionsByDate: SessionsByDate;
  currentMonthIso: string;
  /** Hide proposal chrome when used inside site mockups */
  embedded?: boolean;
}) {
  const { visibleMonth, setVisibleMonth, sessionsByDate, loading, todayKey } =
    useMonthSessions(initial, currentMonthIso);
  const calendarDays = useMemo(() => buildCalendarGrid(visibleMonth), [visibleMonth]);

  const [activeDiscipline, setActiveDiscipline] = useState<CourseDiscipline | null>(
    null,
  );

  const matchFilter = (session: CalendarSessionItem) =>
    activeDiscipline == null || session.discipline === activeDiscipline;

  const firstBusyKey = useMemo(() => {
    for (const day of calendarDays) {
      if (day.getUTCMonth() !== visibleMonth.getUTCMonth()) continue;
      const sessions = sessionsByDate[toDayKey(day)] ?? [];
      if (
        sessions.some(
          (s) => activeDiscipline == null || s.discipline === activeDiscipline,
        )
      ) {
        return toDayKey(day);
      }
    }
    return todayKey;
  }, [calendarDays, visibleMonth, sessionsByDate, todayKey, activeDiscipline]);

  const [selectedKey, setSelectedKey] = useState(firstBusyKey);
  useEffect(() => {
    setSelectedKey(firstBusyKey);
  }, [firstBusyKey]);

  const selectedSessions = (sessionsByDate[selectedKey] ?? []).filter(matchFilter);
  const selectedDate = calendarDays.find((d) => toDayKey(d) === selectedKey) ?? new Date();

  return (
    <div className={cn(!embedded && "mx-auto max-w-4xl px-5 py-10")}>
      {!embedded ? (
        <>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#4a56dd]">
            Proposition B · Mois + détail
          </p>
          <h1 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl">
            Calendrier des cours
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-black/65">
            Vue mois allégée : aperçu photo + points. Cliquez une discipline pour
            ne voir que celle-ci, puis un jour pour le détail.
          </p>
        </>
      ) : null}

      <div className={cn(!embedded && "mt-8")}>
        <MonthNav
          visibleMonth={visibleMonth}
          loading={loading}
          onPrev={() => setVisibleMonth(addMonthsUTC(visibleMonth, -1))}
          onNext={() => setVisibleMonth(addMonthsUTC(visibleMonth, 1))}
        />
      </div>

      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {COURSE_DISCIPLINE_OPTIONS.map((opt) => {
          const active = activeDiscipline === opt.value;
          const palette = COURSE_DISCIPLINE_COLORS[opt.value];
          const dimmed = activeDiscipline != null && !active;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                setActiveDiscipline((current) =>
                  current === opt.value ? null : opt.value,
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
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wide text-black/45">
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
          const thumb = sessions[0] ? sessionImage(sessions[0]) : null;

          return (
            <button
              key={key}
              type="button"
              disabled={!inMonth}
              onClick={() => setSelectedKey(key)}
              className={cn(
                "relative flex min-h-[72px] flex-col overflow-hidden rounded-[12px] border transition md:min-h-[88px]",
                !inMonth && "opacity-25",
                isSelected
                  ? "border-[#4a56dd] ring-2 ring-[#4a56dd]/25"
                  : "border-black/8 hover:border-black/20",
                isToday && !isSelected && "ring-1 ring-black/30",
              )}
            >
              {thumb ? (
                <Image
                  src={thumb}
                  alt=""
                  fill
                  className="object-cover opacity-40"
                  sizes="80px"
                />
              ) : (
                <span className="absolute inset-0 bg-white" />
              )}
              <span className="relative z-10 flex flex-1 flex-col items-center px-1 py-2">
                <span
                  className={cn(
                    "rounded-full px-1.5 text-sm font-semibold",
                    isToday
                      ? "bg-[#4a56dd] text-white"
                      : "bg-white/90 text-black/75",
                  )}
                >
                  {day.getUTCDate()}
                </span>
                <div className="mt-auto flex flex-wrap justify-center gap-0.5 pb-0.5">
                  {disciplines.slice(0, 4).map((d) => (
                    <span
                      key={d}
                      className="h-2 w-2 rounded-full ring-1 ring-white"
                      style={{ backgroundColor: COURSE_DISCIPLINE_COLORS[d].fg }}
                    />
                  ))}
                </div>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 rounded-[19px] border border-black/10 bg-[#fff8f0] p-5 md:p-8">
        <h2 className="text-xl font-bold capitalize text-black/85">
          {dayHeadingFormatter.format(selectedDate)}
        </h2>
        {selectedSessions.length === 0 ? (
          <p className="mt-4 text-black/55">Aucun cours ce jour-là pour ces filtres.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {selectedSessions.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** C — Discipline filters + agenda */
export function CalendarFiltersMock({
  sessionsByDate: initial,
  currentMonthIso,
}: {
  sessionsByDate: SessionsByDate;
  currentMonthIso: string;
}) {
  const { visibleMonth, setVisibleMonth, sessionsByDate, loading, todayKey } =
    useMonthSessions(initial, currentMonthIso);
  const [filters, setFilters] = useState<Set<CourseDiscipline>>(
    () => new Set(COURSE_DISCIPLINE_OPTIONS.map((o) => o.value)),
  );

  const toggle = (d: CourseDiscipline) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(d)) {
        if (next.size > 1) next.delete(d);
      } else {
        next.add(d);
      }
      return next;
    });
  };

  const daysInMonth = useMemo(() => {
    const year = visibleMonth.getUTCFullYear();
    const month = visibleMonth.getUTCMonth();
    const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return Array.from({ length: count }, (_, i) => {
      const date = new Date(Date.UTC(year, month, i + 1, 12, 0, 0));
      const key = toDayKey(date);
      const sessions = (sessionsByDate[key] ?? []).filter(
        (s) => s.discipline && filters.has(s.discipline),
      );
      return { date, key, sessions };
    }).filter((d) => d.sessions.length > 0);
  }, [visibleMonth, sessionsByDate, filters]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#d73459]">
        Proposition C · Filtres
      </p>
      <h1 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl">
        Calendrier des cours
      </h1>
      <p className="mt-3 text-lg text-black/65">
        Filtrez par discipline, puis parcourez l&apos;agenda avec photos.
      </p>

      <div className="mt-8">
        <MonthNav
          visibleMonth={visibleMonth}
          loading={loading}
          onPrev={() => setVisibleMonth(addMonthsUTC(visibleMonth, -1))}
          onNext={() => setVisibleMonth(addMonthsUTC(visibleMonth, 1))}
        />
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {COURSE_DISCIPLINE_OPTIONS.map((opt) => {
          const active = filters.has(opt.value);
          const palette = COURSE_DISCIPLINE_COLORS[opt.value];
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                active ? "border-transparent" : "border-black/15 bg-white text-black/40",
              )}
              style={
                active
                  ? { color: palette.fg, backgroundColor: palette.tint }
                  : undefined
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {daysInMonth.length === 0 ? (
        <p className="rounded-[14px] bg-[#fff8f0] p-8 text-center text-lg text-black/60">
          Aucun cours pour ces filtres ce mois-ci.
        </p>
      ) : (
        <div className="space-y-10">
          {daysInMonth.map(({ date, key, sessions }) => (
            <section key={key}>
              <h2
                className={cn(
                  "mb-3 text-lg font-bold capitalize text-black/85",
                  key === todayKey && "text-[#4a56dd]",
                )}
              >
                {dayHeadingFormatter.format(date)}
              </h2>
              <div className="space-y-3">
                {sessions.map((session) => (
                  <SessionRow key={session.id} session={session} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
