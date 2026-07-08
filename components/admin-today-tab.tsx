"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChevronLeft, ChevronRight, Loader2, RefreshCw, Users } from "lucide-react";

import {
  getTodayCoursesWithSubscriptions,
  type TodayCourseSession,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AdminDayTimeGrid,
  type AdminDayTimeGridSession,
} from "@/components/admin-day-time-grid";
import { getActivityColorClass } from "@/components/admin-week-calendar";
import {
  addParisCalendarDays,
  formatParisDate,
  PARIS_TIMEZONE,
  parseParisDateTime,
} from "@/lib/paris-time";

function parseDateParam(value: string | null): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return formatParisDate(new Date());
}

export function AdminTodayTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(() =>
    parseDateParam(searchParams.get("date")),
  );
  const [sessions, setSessions] = useState<TodayCourseSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<TodayCourseSession | null>(null);

  useEffect(() => {
    setSelectedDate(parseDateParam(searchParams.get("date")));
  }, [searchParams]);

  const syncDateToUrl = useCallback(
    (date: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "today");
      if (date === formatParisDate(new Date())) {
        params.delete("date");
      } else {
        params.set("date", date);
      }
      setTimeout(() => {
        router.replace(`/admin?${params.toString()}`, { scroll: false });
      }, 0);
    },
    [router, searchParams],
  );

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const result = await getTodayCoursesWithSubscriptions(selectedDate);
        if (result.error) {
          setError(result.error);
        } else {
          setSessions(result.sessions);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur s'est produite");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedDate],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const navigateDay = (direction: "prev" | "next") => {
    const nextDate = addParisCalendarDays(
      selectedDate,
      direction === "next" ? 1 : -1,
    );
    setSelectedDate(nextDate);
    syncDateToUrl(nextDate);
  };

  const goToToday = () => {
    const today = formatParisDate(new Date());
    setSelectedDate(today);
    syncDateToUrl(today);
  };

  const isToday = selectedDate === formatParisDate(new Date());

  const fullDateFormatter = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: PARIS_TIMEZONE,
  });

  const formatDate = (dateKey: string) =>
    fullDateFormatter.format(parseParisDateTime(dateKey, "12:00"));

  const activityColorIds = useMemo(() => {
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const session of sessions) {
      if (!seen.has(session.activity_id)) {
        seen.add(session.activity_id);
        ids.push(session.activity_id);
      }
    }
    return ids;
  }, [sessions]);

  const gridSessions: AdminDayTimeGridSession[] = useMemo(
    () =>
      sessions.map((session) => ({
        id: session.id,
        date: session.date,
        start: session.start,
        end: session.end,
        activity_id: session.activity_id,
        activity_name: session.activity_name,
        max_registrations: session.max_registrations,
        registrationCount: session.registrationCount,
      })),
    [sessions],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Aujourd&apos;hui</h3>
          <p className="text-sm text-muted-foreground">
            Cours avec au moins une inscription
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isToday ? (
            <Button type="button" size="sm" onClick={goToToday}>
              <Calendar className="mr-2 h-4 w-4" />
              Aujourd&apos;hui
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={refreshing}
          >
          {refreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Actualiser
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
        <Button variant="outline" size="sm" onClick={() => navigateDay("prev")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          jour précédent
        </Button>
        <div className="text-center">
          <p className="font-semibold capitalize">{formatDate(selectedDate)}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigateDay("next")}>
          jour suivant
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {error ? (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {sessions.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2">
            {activityColorIds.map((activityId) => {
              const session = sessions.find((item) => item.activity_id === activityId);
              if (!session) return null;
              const colorClass = getActivityColorClass(activityId, activityColorIds);
              const count = sessions.filter((item) => item.activity_id === activityId).length;
              return (
                <span
                  key={activityId}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${colorClass}`}
                >
                  <span className="max-w-[180px] truncate font-medium">
                    {session.activity_name}
                  </span>
                  <span className="text-muted-foreground">({count})</span>
                </span>
              );
            })}
          </div>

          <AdminDayTimeGrid
            date={selectedDate}
            sessions={gridSessions}
            activityColorIds={activityColorIds}
            onSessionClick={(session) => {
              const fullSession = sessions.find((item) => item.id === session.id) ?? null;
              setSelectedSession(fullSession);
            }}
          />
        </>
      ) : (
        <div className="rounded-lg border py-12 text-center text-muted-foreground">
          <p>Aucun cours avec inscription prévu pour ce jour</p>
        </div>
      )}

      <Dialog
        open={selectedSession !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedSession(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedSession?.activity_name} — {selectedSession?.start} –{" "}
              {selectedSession?.end}
            </DialogTitle>
            <DialogDescription>
              {selectedSession?.registrationCount} inscription
              {(selectedSession?.registrationCount ?? 0) > 1 ? "s" : ""}
              {selectedSession?.max_registrations != null
                ? ` / ${selectedSession.max_registrations} max`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {selectedSession?.registeredUsers.map((user, index) => (
              <div
                key={`${user.email}-${index}`}
                className="flex items-center gap-3 rounded-md border px-3 py-2"
              >
                <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{user.name}</p>
                  {user.email ? (
                    <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                  ) : null}
                </div>
              </div>
            ))}
            {selectedSession?.publicRegisteredUsers.map((user, index) => (
              <div
                key={`${user.phone}-${index}`}
                className="flex items-center gap-3 rounded-md border px-3 py-2"
              >
                <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{user.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{user.phone}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
