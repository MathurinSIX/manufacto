import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  COURSE_DISCIPLINE_COLORS,
  type CourseDiscipline,
} from "@/lib/course-disciplines";
import type { CSSProperties } from "react";
import type { CalendarSessionItem } from "@/components/monthly-calendar";
import { PARIS_TIMEZONE } from "@/lib/paris-calendar";

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

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: PARIS_TIMEZONE,
});

function stripDisciplinePrefix(
  name: string,
  discipline: CourseDiscipline | null,
) {
  if (!discipline) return name;
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  const candidates = [
    `${discipline}/`,
    `${discipline} /`,
    `${DISCIPLINE_LABEL[discipline].toLowerCase()}/`,
  ];
  for (const prefix of candidates) {
    if (lower.startsWith(prefix)) {
      return trimmed.slice(prefix.length).trim() || trimmed;
    }
  }
  return trimmed;
}

export function DisciplineLegend({ compact = false }: { compact?: boolean }) {
  const entries = Object.entries(COURSE_DISCIPLINE_COLORS) as Array<
    [CourseDiscipline, (typeof COURSE_DISCIPLINE_COLORS)[CourseDiscipline]]
  >;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-black/65",
        compact ? "mb-2 text-[10px]" : "mb-4 text-xs",
      )}
    >
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

export function CalendarSessionPill({
  session,
  compact = false,
}: {
  session: CalendarSessionItem;
  compact?: boolean;
}) {
  const href = `/reserver?activity=${encodeURIComponent(session.activityId)}&session=${encodeURIComponent(session.id)}`;
  const time = timeFormatter.format(new Date(session.start_ts));
  const title = stripDisciplinePrefix(session.activityName, session.discipline);
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
      href={href}
      scroll={false}
      style={pillStyle}
      className={cn(
        "group/pill block rounded-md border font-medium leading-tight transition hover:brightness-95",
        compact ? "px-1 py-0.5 text-[10px]" : "px-1.5 py-1 text-[11px]",
      )}
      title={`Réserver — ${time} ${title}`}
    >
      <span className="block font-semibold tabular-nums">{time}</span>
      <span
        className={cn(
          "mt-0.5 break-words leading-snug",
          compact ? "line-clamp-2 text-[10px]" : "line-clamp-3 text-[11px]",
        )}
      >
        {title}
      </span>
    </Link>
  );
}
