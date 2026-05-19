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
}: {
  session: CalendarSessionItem;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
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
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={pillStyle}
        className={cn(
          "group/pill block w-full rounded-md border text-left font-medium leading-tight transition hover:brightness-95",
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
