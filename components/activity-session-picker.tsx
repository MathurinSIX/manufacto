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
  const todayKey = toDayKey(new Date());

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
    () => startOfMonth(new Date()),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState<boolean>(false);
  const [registeredSessionIds, setRegisteredSessionIds] = useState<Set<string>>(new Set());
  const [allRegisteredSessionIds, setAllRegisteredSessionIds] = useState<Set<string>>(new Set());
  const [registrationDates, setRegistrationDates] = useState<Map<string, string>>(new Map());
  const [sessionToRegistrationMap, setSessionToRegistrationMap] = useState<Map<string, string>>(new Map());
  const [isCancelling, setIsCancelling] = useState(false);
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
    if (!userId) {
      setUserCredits(0);
      return;
    }
    let active = true;
    const fetchUserCredits = async () => {
      const { data: creditsData, error } = await supabase
        .from("credit")
        .select("amount")
        .eq("user_id", userId);

      if (!active) return;

      if (error) {
        console.error("Error fetching credits:", error);
        setUserCredits(0);
        return;
      }

      if (creditsData && Array.isArray(creditsData)) {
        const totalCredits = creditsData.reduce((sum, row) => {
          let amount = 0;
          if (row.amount != null) {
            if (typeof row.amount === 'number') {
              amount = row.amount;
            } else if (typeof row.amount === 'string') {
              amount = parseFloat(row.amount) || 0;
            }
          }
          return sum + amount;
        }, 0);
        setUserCredits(totalCredits);
      } else {
        setUserCredits(0);
      }
    };
    fetchUserCredits();
    return () => {
      active = false;
    };
  }, [userId, supabase]);

  useEffect(() => {
    if (!selectedSessionId || !userId) {
      setIsAlreadyRegistered(false);
      return;
    }
    // Check if session has an ACTIVE registration (to show Cancel button)
    // This prevents the state from being reset when clicking/unclicking/reclicking
    setIsAlreadyRegistered(registeredSessionIds.has(selectedSessionId));
  }, [selectedSessionId, registeredSessionIds, userId]);

  useEffect(() => {
    if (!userId || !sessions.length) {
      setRegisteredSessionIds(new Set());
      setAllRegisteredSessionIds(new Set());
      return;
    }
    let active = true;
    const fetchUserRegistrations = async () => {
      const sessionIds = sessions.map(s => s.id);
      // First, get registrations for these sessions
      const { data: registrations, error: regError } = await supabase
        .from("registration")
        .select("id, session_id")
        .eq("user_id", userId)
        .in("session_id", sessionIds);

      if (!active) return;

      if (regError) {
        console.error("Error fetching registrations:", regError);
        setRegisteredSessionIds(new Set());
        setAllRegisteredSessionIds(new Set());
        return;
      }

      if (!registrations || registrations.length === 0) {
        setRegisteredSessionIds(new Set());
        setAllRegisteredSessionIds(new Set());
        return;
      }

      // Get the latest registration_status for each registration
      const registrationIds = registrations.map(reg => reg.id);
      const { data: statuses, error: statusError } = await supabase
        .from("registration_status")
        .select("registration_id, status, created_at")
        .in("registration_id", registrationIds)
        .order("created_at", { ascending: false });

      if (!active) return;

      if (statusError) {
        console.error("Error fetching registration statuses:", statusError);
        setRegisteredSessionIds(new Set());
        setAllRegisteredSessionIds(new Set());
        return;
      }

      // Create maps: session_id -> registration_id, and registration_id -> latest status
      const sessionToRegMap = new Map<string, string>();
      registrations.forEach((reg) => {
        if (reg.session_id) {
          sessionToRegMap.set(reg.session_id, reg.id);
        }
      });

      const registrationStatusMap = new Map<string, { status: string; created_at: string }>();
      if (statuses) {
        const seenRegistrations = new Set<string>();
        statuses.forEach((status) => {
          if (!seenRegistrations.has(status.registration_id)) {
            registrationStatusMap.set(status.registration_id, {
              status: status.status,
              created_at: status.created_at,
            });
            seenRegistrations.add(status.registration_id);
          }
        });
      }

      // Build the final sets and maps
      // Only consider sessions with latest status ACTIVE (or no status, default to ACTIVE) as registered
      const registeredSet = new Set<string>();
      const allRegisteredSet = new Set<string>();
      const registrationDateMap = new Map<string, string>();
      
      sessionToRegMap.forEach((registrationId, sessionId) => {
        // Track ALL sessions with any registration (to prevent rebooking)
        allRegisteredSet.add(sessionId);
        
        const latestStatus = registrationStatusMap.get(registrationId);
        // Only consider ACTIVE or no status (default to ACTIVE) as registered
        if (!latestStatus || latestStatus.status === "ACTIVE") {
          registeredSet.add(sessionId);
          if (latestStatus?.created_at) {
            registrationDateMap.set(sessionId, latestStatus.created_at);
          }
        }
      });

      setRegisteredSessionIds(registeredSet);
      setAllRegisteredSessionIds(allRegisteredSet);
      setRegistrationDates(registrationDateMap);
      setSessionToRegistrationMap(sessionToRegMap);
    };
    fetchUserRegistrations();
    return () => {
      active = false;
    };
  }, [userId, sessions, supabase]);

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
      setIsLoading(false);
      if (error) {
        setErrorMessage("Impossible de récupérer les sessions disponibles.");
        console.error(error);
        return;
      }
      setSessions(data ?? []);
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
    // Don't reset isAlreadyRegistered here - let the useEffect handle it based on registeredSessionIds
  };

  const handleRegister = async (paymentType?: string) => {
    if (!selectedSessionId) return;
    if (!userId) {
      const params = new URLSearchParams();
      params.set("next", `/activities?session=${selectedSessionId}`);
      router.push(`/auth/login?${params.toString()}`);
      return;
    }
    
    // Prevent rebooking if there's already an ACTIVE registration
    if (registeredSessionIds.has(selectedSessionId)) {
      setErrorMessage("Vous êtes déjà inscrit à cette session.");
      return;
    }
    
    // Check if user has enough credits when using credits
    if (credits != null && userCredits < credits) {
      setErrorMessage(`Vous n'avez pas assez de crédits. Vous avez ${userCredits} crédit(s), ${credits} crédit(s) requis.`);
      return;
    }

    setIsRegistering(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    const registrationData: { session_id: string; user_id: string; payment_type?: string } = {
      session_id: selectedSessionId,
      user_id: userId,
    };
    
    if (paymentType) {
      registrationData.payment_type = paymentType;
    }
    
    const { data: insertedRegistration, error: regError } = await supabase
      .from("registration")
      .insert(registrationData)
      .select("id")
      .single();
    
    setIsRegistering(false);
    if (regError || !insertedRegistration) {
      console.error(regError);
      setErrorMessage("Votre réservation n'a pas pu être enregistrée.");
      return;
    }

    // Fetch the automatically created registration_status from the backend
    const { data: statusData, error: statusError } = await supabase
      .from("registration_status")
      .select("created_at")
      .eq("registration_id", insertedRegistration.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Update registered sessions
    setRegisteredSessionIds(prev => new Set(prev).add(selectedSessionId));
    setAllRegisteredSessionIds(prev => new Set(prev).add(selectedSessionId));
    if (statusData?.created_at) {
      setRegistrationDates(prev => new Map(prev).set(selectedSessionId, statusData.created_at));
    }
    // Update sessionToRegistrationMap
    setSessionToRegistrationMap(prev => new Map(prev).set(selectedSessionId, insertedRegistration.id));
    setIsAlreadyRegistered(true);
    setSuccessMessage("Réservation confirmée ! Nous vous attendons à l'atelier.");
    router.refresh();
  };

  const handleCancel = async () => {
    if (!selectedSessionId || !userId) return;
    
    const registrationId = sessionToRegistrationMap.get(selectedSessionId);
    if (!registrationId) {
      setErrorMessage("Impossible de trouver la réservation à annuler.");
      return;
    }

    if (!confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) {
      return;
    }

    setIsCancelling(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Insert a CANCELLED status
    const { error: statusError } = await supabase
      .from("registration_status")
      .insert({
        registration_id: registrationId,
        status: "CANCELLED",
      });

    setIsCancelling(false);
    if (statusError) {
      console.error(statusError);
      setErrorMessage("L'annulation n'a pas pu être effectuée.");
      return;
    }

    // Update state to reflect cancellation
    // Remove from active registrations (but keep in allRegisteredSessionIds to prevent rebooking)
    setRegisteredSessionIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(selectedSessionId);
      return newSet;
    });
    // Keep in allRegisteredSessionIds to prevent rebooking
    // isAlreadyRegistered will remain true because the session is still in allRegisteredSessionIds
    setSuccessMessage("Réservation annulée avec succès.");
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
                    const isRegistered = registeredSessionIds.has(session.id);
                    const registrationDate = isRegistered && registrationDates.has(session.id) 
                      ? new Date(registrationDates.get(session.id)!) 
                      : null;
                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => handleSelectSession(session.id)}
                        className={cn(
                          "w-full rounded-lg border p-4 text-left transition-colors",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted",
                          isRegistered && "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
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
                            {isRegistered && (
                              <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                                Déjà inscrit
                              </p>
                            )}
                          </div>
                          {isSelected && !isRegistered && (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          )}
                          {isRegistered && (
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          )}
                        </div>
                        {session.max_registrations !== null && !isRegistered && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {session.max_registrations} places disponibles
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
          {userId && selectedSessionId && (
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              {isAlreadyRegistered ? (
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto"
                  disabled={isCancelling}
                  onClick={handleCancel}
                >
                  {isCancelling ? "Annulation..." : "Annuler la réservation"}
                </Button>
              ) : (
                <>
                  {credits != null && userCredits >= credits && (
                    <Button
                      variant="default"
                      className="w-full sm:w-auto"
                      disabled={isRegistering}
                      onClick={() => handleRegister("credit")}
                    >
                      {isRegistering ? "Réservation..." : `Réserver pour ${credits} crédits`}
                    </Button>
                  )}
                  {price != null && (
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      disabled={isRegistering}
                      onClick={handleRegister}
                    >
                      {isRegistering ? "Réservation..." : `Réserver pour ${price.toFixed(2)}€`}
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
          {(!isLoggedIn || (!credits && !price)) && !isAlreadyRegistered && (
            <Button
              className="w-full sm:w-auto"
              disabled={!selectedSessionId || isRegistering}
              onClick={handleRegister}
            >
              {isRegistering ? "Réservation..." : "Confirmer ma réservation"}
            </Button>
          )}
          {isAlreadyRegistered && !isLoggedIn && (
            <p className="text-xs text-muted-foreground">
              Vous êtes déjà inscrit à cette session.
            </p>
          )}
          {!userId && !isAlreadyRegistered && (
            <p className="text-xs text-muted-foreground">
              Connectez-vous pour finaliser votre réservation.
            </p>
          )}
          {userId && credits != null && userCredits < credits && !isAlreadyRegistered && (
            <p className="text-xs text-destructive">
              Crédits insuffisants. Vous avez {userCredits} crédit(s), {credits} crédit(s) requis.
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


