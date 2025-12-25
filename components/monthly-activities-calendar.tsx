import { createClient } from "@/lib/supabase/server";
import { MonthlyCalendar } from "./monthly-calendar";

const PARIS_TIMEZONE = "Europe/Paris";

export async function MonthlyActivitiesCalendar() {
  const supabase = await createClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

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
  
  sessions?.forEach((session) => {
    const date = new Date(session.start_ts);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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

