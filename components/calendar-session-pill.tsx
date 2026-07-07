"use client";

import { useState, type CSSProperties } from "react";

import { ActivitySessionPicker } from "@/components/activity-session-picker";
import type { CalendarSessionItem } from "@/components/monthly-calendar";
import {
  COURSE_DISCIPLINE_COLORS,
  type CourseDiscipline,
} from "@/lib/course-disciplines";
import { PARIS_TIMEZONE } from "@/lib/paris-calendar";
import { cn } from "@/lib/utils";

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

export function CalendarSessionPill({
  session,
  compact = false,
  dense = false,
}: {
  session: CalendarSessionItem;
  compact?: boolean;
  dense?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const start = new Date(session.start_ts);
  const end = new Date(session.end_ts);
  const time = timeFormatter.format(start);
  const endTime = timeFormatter.format(end);
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
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={pillStyle}
        className={cn(
          "group/pill block w-full rounded-md border text-left font-medium leading-tight transition hover:brightness-95",
          dense
            ? "px-0.5 py-0 text-[9px]"
            : compact
              ? "px-1 py-0.5 text-[10px]"
              : "px-1.5 py-1 text-[11px]",
        )}
        title={`Réserver — ${time} – ${endTime} ${title}`}
      >
        <span className={cn("block font-semibold tabular-nums", dense && "text-[9px]")}>
          {time} – {endTime}
        </span>
        <span
          className={cn(
            "mt-0.5 break-words leading-snug",
            dense
              ? "line-clamp-1 text-[9px]"
              : compact
                ? "line-clamp-2 text-[10px]"
                : "line-clamp-3 text-[11px]",
          )}
        >
          {title}
        </span>
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
