import { cn } from "@/lib/utils";
import {
  COURSE_DISCIPLINE_COLORS,
  type CourseDiscipline,
} from "@/lib/course-disciplines";

const DISCIPLINE_LABEL: Record<CourseDiscipline, string> = {
  menuiserie: "Menuiserie",
  couture: "Couture",
  electronique: "Électronique",
  ceramique: "Céramique",
};

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

export { CalendarSessionPill } from "@/components/calendar-session-pill";
