"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const PARIS_TIMEZONE = "Europe/Paris";
const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: PARIS_TIMEZONE,
});

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: PARIS_TIMEZONE,
});

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
  return new Date(year, month, day, hour, minute, second);
}

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date: Date, delta: number) =>
  new Date(date.getFullYear(), date.getMonth() + delta, 1);

const toDayKey = (date: Date) => dayKeyFormatter.format(date);

const isSameDay = (a: Date, b?: Date) => !!b && toDayKey(a) === toDayKey(b);

const buildCalendarGrid = (month: Date) => {
  const firstOfMonth = startOfMonth(month);
  const weekday = (firstOfMonth.getDay() + 6) % 7; // convert Sunday(0) -> 6
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - weekday);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
};

interface SimpleCalendarProps {
  visibleMonth: Date;
  onMonthChange: (next: Date) => void;
  availableDays: Set<string>;
  selectedDate?: Date;
  onSelect?: (date: Date) => void;
}

function SimpleCalendar({
  visibleMonth,
  onMonthChange,
  availableDays,
  selectedDate,
  onSelect,
}: SimpleCalendarProps) {
  const calendarDays = useMemo(
    () => buildCalendarGrid(visibleMonth),
    [visibleMonth],
  );
  const todayKey = toDayKey(getNowInParis());

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(visibleMonth, -1))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition hover:bg-muted"
          aria-label="Mois précédent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold capitalize">
          {monthFormatter.format(visibleMonth)}
        </p>
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(visibleMonth, 1))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition hover:bg-muted"
          aria-label="Mois suivant"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-2 grid grid-cols-7 text-center text-xs uppercase text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const key = toDayKey(day);
          const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
          const isSelectable = availableDays.has(key);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const isToday = key === todayKey;
          return (
            <button
              key={key}
              type="button"
              disabled={!isSelectable}
              onClick={() => isSelectable && onSelect?.(day)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md text-sm transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isSelectable
                    ? "hover:bg-accent hover:text-accent-foreground"
                    : "text-muted-foreground/50",
                !isCurrentMonth && "text-muted-foreground/40",
                isToday && !isSelected && "ring-1 ring-primary/40",
                !isSelectable && "cursor-not-allowed",
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type SessionRow = {
  id: string;
  start_ts: string;
  end_ts: string;
  max_registrations: number | null;
  registrationCount?: number;
  isFull?: boolean;
};

interface ActivitySessionPickerProps {
  activityId?: string;
  activityTitle: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  credits?: number | null;
  price?: number | null;
  isLoggedIn?: boolean;
}

export function ActivitySessionPicker({
  activityId,
  activityTitle,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  credits,
  price,
  isLoggedIn,
}: ActivitySessionPickerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [visibleMonth, setVisibleMonth] = useState<Date>(
    () => startOfMonth(getNowInParis()),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasAppliedQuerySession, setHasAppliedQuerySession] = useState(false);
  const [hasAttemptedQueryOpen, setHasAttemptedQueryOpen] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let active = true;
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setUserId(data.user?.id ?? null);
    };
    fetchUser();
    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!open || !activityId) return;
    let ignore = false;
    const fetchSessions = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      const { data, error } = await supabase
        .from("session")
        .select("id, start_ts, end_ts, max_registrations")
        .eq("activity_id", activityId)
        .gte("start_ts", new Date().toISOString())
        .order("start_ts", { ascending: true });
      if (ignore) return;
      if (error) {
        setIsLoading(false);
        setErrorMessage("Impossible de récupérer les sessions disponibles.");
        console.error(error);
        return;
      }
      
      // Fetch registration counts for each session
      if (data && data.length > 0) {
        const sessionIds = data.map(s => s.id);
        const { data: registrations } = await supabase
          .from("registration")
          .select("id, session_id")
          .in("session_id", sessionIds);
        
        // Get active registrations (not cancelled)
        const registrationIds = registrations?.map(r => r.id) || [];
        const activeRegistrationIds = new Set<string>();
        
        if (registrationIds.length > 0) {
          const { data: statuses } = await supabase
            .from("registration_status")
            .select("registration_id, status, created_at")
            .in("registration_id", registrationIds)
            .order("created_at", { ascending: false });
          
          if (statuses) {
            const seenRegistrations = new Set<string>();
            statuses.forEach((status) => {
              if (!seenRegistrations.has(status.registration_id)) {
                seenRegistrations.add(status.registration_id);
                if (status.status !== "CANCELLED") {
                  activeRegistrationIds.add(status.registration_id);
                }
              }
            });
          } else {
            // If no statuses, all registrations are active
            registrationIds.forEach(id => {
              activeRegistrationIds.add(id);
            });
          }
        }
        
        // Count registrations per session
        const registrationCounts: Record<string, number> = {};
        registrations?.forEach(reg => {
          if (reg.session_id && activeRegistrationIds.has(reg.id)) {
            registrationCounts[reg.session_id] = (registrationCounts[reg.session_id] || 0) + 1;
          }
        });
        
        // Add registration count and isFull to each session
        const sessionsWithCounts = data.map(session => {
          const count = registrationCounts[session.id] || 0;
          const isFull = session.max_registrations !== null && count >= session.max_registrations;
          return {
            ...session,
            registrationCount: count,
            isFull,
          };
        });
        
        if (ignore) return;
        setSessions(sessionsWithCounts);
      } else {
        setSessions([]);
      }
      
      setIsLoading(false);
    };
    fetchSessions();
    return () => {
      ignore = true;
    };
  }, [open, activityId, supabase]);

  useEffect(() => {
    if (!sessions.length) {
      setSelectedDate(undefined);
      setSelectedSessionId(null);
      return;
    }
    setSelectedDate((current) => current ?? new Date(sessions[0].start_ts));
  }, [sessions]);

  useEffect(() => {
    if (selectedDate) {
      setVisibleMonth(startOfMonth(selectedDate));
    } else if (sessions.length) {
      setVisibleMonth(startOfMonth(new Date(sessions[0].start_ts)));
    }
  }, [selectedDate, sessions]);

  useEffect(() => {
    if (hasAppliedQuerySession || !sessions.length) return;
    const sessionFromQuery = searchParams?.get("session");
    if (!sessionFromQuery) return;
    const matchedSession = sessions.find(
      (session) => session.id === sessionFromQuery,
    );
    if (!matchedSession) return;
    setHasAppliedQuerySession(true);
    setSelectedDate(new Date(matchedSession.start_ts));
    setSelectedSessionId(matchedSession.id);
    setOpen(true);
  }, [sessions, searchParams, hasAppliedQuerySession]);

  useEffect(() => {
    if (hasAttemptedQueryOpen || !activityId) return;
    const sessionFromQuery = searchParams?.get("session");
    if (!sessionFromQuery) return;
    setHasAttemptedQueryOpen(true);
    setOpen(true);
  }, [activityId, searchParams, hasAttemptedQueryOpen]);

  const availableDays = useMemo(() => {
    if (!sessions.length) return new Set<string>();
    return sessions.reduce((acc, session) => {
      acc.add(toDayKey(new Date(session.start_ts)));
      return acc;
    }, new Set<string>());
  }, [sessions]);

  const sessionsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return sessions
      .filter((session) =>
        isSameDay(new Date(session.start_ts), selectedDate),
      )
      .sort(
        (a, b) =>
          new Date(a.start_ts).getTime() - new Date(b.start_ts).getTime(),
      );
  }, [selectedDate, sessions]);

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleRegister = async () => {
    if (!selectedSessionId) return;
    if (!userId) {
      const params = new URLSearchParams();
      params.set("next", `/activities?session=${selectedSessionId}`);
      router.push(`/auth/login?${params.toString()}`);
      return;
    }
    setIsRegistering(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    const { error } = await supabase
      .from("registrations")
      .insert({ session_id: selectedSessionId });
    setIsRegistering(false);
    if (error) {
      console.error(error);
      setErrorMessage("Votre inscription n'a pas pu être enregistrée.");
      return;
    }
    setSuccessMessage("Inscription confirmée ! Nous vous attendons à l'atelier.");
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button
            variant="secondary"
            size="lg"
            className="mt-4"
            disabled={!activityId}
          >
            <CalendarIcon className="h-4 w-4" />
            Sélectionner une session
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Sélectionnez une session</DialogTitle>
          <DialogDescription>
            Choisissez une date pour {activityTitle}. Les horaires sont affichés
            en heure locale.
          </DialogDescription>
        </DialogHeader>

        {!activityId ? (
          <p className="text-sm text-muted-foreground">
            Cette activité n&apos;est pas encore disponible à la réservation.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-[320px,1fr]">
            <div className="rounded-lg border">
              <SimpleCalendar
                visibleMonth={visibleMonth}
                onMonthChange={setVisibleMonth}
                availableDays={availableDays}
                selectedDate={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedSessionId(null);
                }}
              />
            </div>
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des sessions...
                </div>
              ) : sessionsForSelectedDate.length ? (
                <div className="space-y-3">
                  {sessionsForSelectedDate.map((session) => {
                    const start = new Date(session.start_ts);
                    const end = new Date(session.end_ts);
                    const isSelected = session.id === selectedSessionId;
                    const registeredCount = session.registrationCount || 0;
                    const available = session.max_registrations !== null 
                      ? session.max_registrations - registeredCount 
                      : null;
                    const isFull = session.max_registrations !== null && registeredCount >= session.max_registrations;
                    
                    return (
                      <button
                        key={session.id}
                        type="button"
                        disabled={isFull}
                        onClick={() => !isFull && handleSelectSession(session.id)}
                        className={cn(
                          "w-full rounded-lg border p-4 text-left transition-colors",
                          isFull && "opacity-60 cursor-not-allowed",
                          isSelected && !isFull
                            ? "border-primary bg-primary/5"
                            : !isFull && "hover:bg-muted",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {timeFormatter.format(start)} –{" "}
                              {timeFormatter.format(end)}
                            </p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {dateFormatter.format(start)}
                            </p>
                          </div>
                          {isSelected && !isFull && (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        {session.max_registrations !== null && (
                          <p className={cn(
                            "mt-2 text-xs",
                            isFull ? "text-destructive font-medium" : "text-muted-foreground"
                          )}>
                            {isFull 
                              ? "Complet" 
                              : `${available} place${available !== null && available > 1 ? "s" : ""} disponible${available !== null && available > 1 ? "s" : ""}`
                            }
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucune session prévue pour cette date. Sélectionnez une autre
                  journée disponible.
                </p>
              )}
              {errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}
              {successMessage && (
                <p className="text-sm text-green-600">{successMessage}</p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex-col gap-3 sm:flex-row">
          {isLoggedIn && selectedSessionId && (
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              {credits !== null && (
                <Button
                  variant="default"
                  className="w-full sm:w-auto"
                  disabled={isRegistering}
                  onClick={handleRegister}
                >
                  {isRegistering ? "Inscription..." : `Réserver pour ${credits} crédits`}
                </Button>
              )}
              {price !== null && (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  disabled={isRegistering}
                  onClick={handleRegister}
                >
                  {isRegistering ? "Inscription..." : `Réserver pour ${price.toFixed(2)}€`}
                </Button>
              )}
            </div>
          )}
          {(!isLoggedIn || (!credits && !price)) && (
            <Button
              className="w-full sm:w-auto"
              disabled={!selectedSessionId || isRegistering}
              onClick={handleRegister}
            >
              {isRegistering ? "Inscription..." : "Confirmer mon inscription"}
            </Button>
          )}
          {!userId && (
            <p className="text-xs text-muted-foreground">
              Connectez-vous pour finaliser votre inscription.
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


