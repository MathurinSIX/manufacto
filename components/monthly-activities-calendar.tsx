import { createClient } from "@/lib/supabase/server";
import { MonthlyCalendar } from "./monthly-calendar";

const PARIS_TIMEZONE = "Europe/Paris";

// Helper function to get current date/time in Paris timezone
function getNowInParis(): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === "year")!.value);
  const month = parseInt(parts.find(p => p.type === "month")!.value) - 1;
  const day = parseInt(parts.find(p => p.type === "day")!.value);
  const hour = parseInt(parts.find(p => p.type === "hour")!.value);
  const minute = parseInt(parts.find(p => p.type === "minute")!.value);
  const second = parseInt(parts.find(p => p.type === "second")!.value);
  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

export async function MonthlyActivitiesCalendar() {
  const supabase = await createClient();
  const now = getNowInParis();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));

  // Fetch all sessions for the current month
  const { data: sessions, error: sessionsError } = await supabase
    .from("session")
    .select("id, start_ts, end_ts, activity_id")
    .gte("start_ts", startOfMonth.toISOString())
    .lte("start_ts", endOfMonth.toISOString())
    .order("start_ts", { ascending: true });

  if (sessionsError) {
    console.error("Error fetching sessions:", sessionsError);
  }

  // Fetch activity names
  const activityIds = sessions
    ?.map((s) => s.activity_id)
    .filter((id): id is string => id !== null) || [];
  
  let activities = null;
  if (activityIds.length > 0) {
    const { data } = await supabase
      .from("activity")
      .select("id, name")
      .in("id", activityIds);
    activities = data;
  }

  const activityMap = new Map<string, string>(
    activities?.map((a) => [a.id, a.name] as [string, string]) || []
  );

  // Group sessions by date
  const sessionsByDate = new Map<string, Array<{ id: string; start_ts: string; end_ts: string; activityName: string }>>();
  
  // Helper to format date key in Paris timezone
  const dayKeyFormatter = new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: PARIS_TIMEZONE,
  });

  sessions?.forEach((session) => {
    const date = new Date(session.start_ts);
    const dateKey = dayKeyFormatter.format(date);
    const activityName = activityMap.get(session.activity_id) || "Activité";
    
    if (!sessionsByDate.has(dateKey)) {
      sessionsByDate.set(dateKey, []);
    }
    sessionsByDate.get(dateKey)!.push({
      id: session.id,
      start_ts: session.start_ts,
      end_ts: session.end_ts,
      activityName,
    });
  });

  return <MonthlyCalendar sessionsByDate={sessionsByDate} currentMonth={now} />;
}

