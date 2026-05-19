"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar as CalendarIcon, CheckCircle2, Loader2 } from "lucide-react";

import { registerForSession } from "@/app/account/actions";
import { CancelRegistrationButton } from "@/components/cancel-registration-button";
import { ReservationAuthStep } from "@/components/reservation-auth-step";
import { SquareCheckoutButton } from "@/components/square-checkout-button";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import {
  buildParisHourSlots,
  PARIS_TIMEZONE,
  toParisDayKey,
} from "@/lib/paris-time";
import {
  ACCOMPAGNEMENT_ACTIVITY_TYPE,
  getMinPracticeReservationHours,
} from "@/lib/practice-reservation";
import { cn } from "@/lib/utils";

const HOUR_MS = 60 * 60 * 1000;

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: PARIS_TIMEZONE,
});

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: PARIS_TIMEZONE,
});

type SessionRow = {
  id: string;
  start_ts: string;
  end_ts: string;
  max_registrations: number | null;
};

type RegistrationRow = {
  id: string;
  user_id: string;
  session_id: string;
  reserved_start_ts: string | null;
  reserved_end_ts: string | null;
};

type RegistrationStatusRow = {
  registration_id: string;
  status: string;
  created_at: string;
};

type MyPracticeRegistration = {
  id: string;
  session_id: string;
  reserved_start_ts: string;
  reserved_end_ts: string;
};

type HourSlotOption = {
  key: string;
  iso: string;
  sessionId: string;
  label: string;
  disabled: boolean;
  available: number | null;
  bookedByMe: boolean;
};

function timeRangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
) {
  return startA < endB && endA > startB;
}

function isHourBookedByUser(
  hour: Date,
  sessionId: string,
  myRegistrations: MyPracticeRegistration[],
) {
  const hourStart = hour.getTime();
  const hourEnd = hourStart + HOUR_MS;

  return myRegistrations.some((registration) => {
    if (registration.session_id !== sessionId) {
      return false;
    }

    const reservationStart = new Date(registration.reserved_start_ts).getTime();
    const reservationEnd = new Date(registration.reserved_end_ts).getTime();
    return timeRangesOverlap(
      reservationStart,
      reservationEnd,
      hourStart,
      hourEnd,
    );
  });
}

interface PracticeReservationPickerProps {
  activityId: string;
  activityTitle: string;
  activityType?: string | null;
  credits?: number | null;
  squareProductId?: string | null;
  fixedHourCount?: number;
  isLoggedIn?: boolean;
  inModal?: boolean;
  modalOpen?: boolean;
  onAuthStepChange?: (showAuthStep: boolean) => void;
}

function getLatestActiveRegistrationIds(
  registrationIds: string[],
  statuses?: RegistrationStatusRow[] | null,
) {
  if (!registrationIds.length) return new Set<string>();
  if (!statuses?.length) return new Set(registrationIds);

  const seen = new Set<string>();
  const active = new Set<string>();
  statuses.forEach((status) => {
    if (seen.has(status.registration_id)) return;
    seen.add(status.registration_id);
    if (status.status !== "CANCELLED") {
      active.add(status.registration_id);
    }
  });
  registrationIds.forEach((id) => {
    if (!seen.has(id)) active.add(id);
  });
  return active;
}

function hourKey(date: Date) {
  return date.toISOString();
}

function hourSlotKey(sessionId: string, hour: Date) {
  return `${sessionId}:${hourKey(hour)}`;
}

function getOrderedSelectedHourSlots(
  selectedKeys: string[],
  slots: HourSlotOption[],
): HourSlotOption[] {
  return selectedKeys
    .map((key) => slots.find((slot) => slot.key === key))
    .filter((slot): slot is HourSlotOption => Boolean(slot))
    .sort((a, b) => new Date(a.iso).getTime() - new Date(b.iso).getTime());
}

function areHourSlotsConsecutive(slots: HourSlotOption[]): boolean {
  if (slots.length <= 1) {
    return slots.length === 1;
  }

  for (let index = 1; index < slots.length; index += 1) {
    const previous = slots[index - 1];
    const current = slots[index];
    if (
      new Date(current.iso).getTime() - new Date(previous.iso).getTime() !==
      HOUR_MS
    ) {
      return false;
    }
  }

  return true;
}

function splitIntoSessionBlocks(slots: HourSlotOption[]) {
  if (!slots.length) return [];

  const blocks: { sessionId: string; startIso: string; endIso: string }[] = [];
  let blockStart = 0;

  for (let index = 1; index <= slots.length; index += 1) {
    const previous = slots[index - 1];
    const current = slots[index];
    const breaksBlock =
      !current ||
      current.sessionId !== previous.sessionId ||
      new Date(current.iso).getTime() - new Date(previous.iso).getTime() !== HOUR_MS;

    if (!breaksBlock) continue;

    const chunk = slots.slice(blockStart, index);
    const last = chunk[chunk.length - 1];
    blocks.push({
      sessionId: chunk[0].sessionId,
      startIso: chunk[0].iso,
      endIso: new Date(new Date(last.iso).getTime() + HOUR_MS).toISOString(),
    });
    blockStart = index;
  }

  return blocks;
}

function countRegistrationsForHour(registrations: RegistrationRow[], hour: Date) {
  const start = hour.getTime();
  const end = start + HOUR_MS;
  return registrations.reduce((count, registration) => {
    if (!registration.reserved_start_ts || !registration.reserved_end_ts) {
      return count;
    }
    const reservationStart = new Date(registration.reserved_start_ts).getTime();
    const reservationEnd = new Date(registration.reserved_end_ts).getTime();
    return reservationStart < end && reservationEnd > start ? count + 1 : count;
  }, 0);
}

export function PracticeReservationPicker({
  activityId,
  activityTitle,
  activityType,
  credits,
  squareProductId,
  fixedHourCount,
  isLoggedIn,
  inModal = false,
  modalOpen,
  onAuthStepChange,
}: PracticeReservationPickerProps) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<MyPracticeRegistration[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedHourKeys, setSelectedHourKeys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState(0);
  const [showAuthStep, setShowAuthStep] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const effectiveIsLoggedIn = !!isLoggedIn || !!userId;
  const hasSelectedHours = selectedHourKeys.length > 0;

  const refreshUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const nextUserId = data.user?.id ?? null;
    setUserId(nextUserId);

    if (!nextUserId) {
      setUserCredits(0);
      return null;
    }

    const { data: creditsData, error } = await supabase
      .from("credit")
      .select("amount")
      .eq("user_id", nextUserId);

    if (error) {
      console.error("Error fetching credits:", error);
      setUserCredits(0);
      return nextUserId;
    }

    setUserCredits(
      creditsData?.reduce((sum, row) => {
        const amount =
          typeof row.amount === "number"
            ? row.amount
            : parseFloat(String(row.amount)) || 0;
        return sum + amount;
      }, 0) ?? 0,
    );
    return nextUserId;
  }, [supabase]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (modalOpen === false) {
      setShowAuthStep(false);
    }
  }, [modalOpen]);

  useEffect(() => {
    onAuthStepChange?.(showAuthStep);
  }, [showAuthStep, onAuthStepChange]);

  const fetchMyRegistrations = async (
    currentUserId: string,
    sessionIds: string[],
  ) => {
    if (!sessionIds.length) {
      setMyRegistrations([]);
      return;
    }

    const nowIso = new Date().toISOString();
    const { data: registrationData, error } = await supabase
      .from("registration")
      .select("id, session_id, reserved_start_ts, reserved_end_ts")
      .eq("user_id", currentUserId)
      .in("session_id", sessionIds)
      .gte("reserved_end_ts", nowIso)
      .order("reserved_start_ts", { ascending: true });

    if (error) {
      console.error("Error fetching user practice registrations:", error);
      setMyRegistrations([]);
      return;
    }

    const registrationIds =
      registrationData?.map((registration) => registration.id) ?? [];
    if (!registrationIds.length) {
      setMyRegistrations([]);
      return;
    }

    const { data: statuses, error: statusesError } = await supabase
      .from("registration_status")
      .select("registration_id, status, created_at")
      .in("registration_id", registrationIds)
      .order("created_at", { ascending: false });

    if (statusesError) {
      console.error("Error fetching user registration statuses:", statusesError);
      setMyRegistrations([]);
      return;
    }

    const activeRegistrationIds = getLatestActiveRegistrationIds(
      registrationIds,
      statuses,
    );

    setMyRegistrations(
      ((registrationData ?? []) as MyPracticeRegistration[]).filter(
        (registration) =>
          activeRegistrationIds.has(registration.id) &&
          registration.reserved_start_ts &&
          registration.reserved_end_ts,
      ),
    );
  };

  useEffect(() => {
    let ignore = false;
    const fetchAvailability = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      const { data: sessionData, error: sessionsError } = await supabase
        .from("session")
        .select("id, start_ts, end_ts, max_registrations")
        .eq("activity_id", activityId)
        .gte("end_ts", new Date().toISOString())
        .order("start_ts", { ascending: true });

      if (ignore) return;
      if (sessionsError) {
        console.error("Error fetching practice opening blocks:", sessionsError);
        setErrorMessage("Impossible de récupérer les créneaux disponibles.");
        setIsLoading(false);
        return;
      }

      const nextSessions = (sessionData ?? []) as SessionRow[];
      setSessions(nextSessions);

      const sessionIds = nextSessions.map((session) => session.id);
      if (!sessionIds.length) {
        setRegistrations([]);
        setIsLoading(false);
        return;
      }

      const { data: registrationData, error: registrationsError } =
        await supabase
          .from("registration")
          .select("id, user_id, session_id, reserved_start_ts, reserved_end_ts")
          .in("session_id", sessionIds);

      if (ignore) return;
      if (registrationsError) {
        console.error("Error fetching practice registrations:", registrationsError);
        setErrorMessage("Impossible de vérifier les places disponibles.");
        setIsLoading(false);
        return;
      }

      const registrationIds =
        registrationData?.map((registration) => registration.id) ?? [];
      const { data: statuses, error: statusesError } = registrationIds.length
        ? await supabase
            .from("registration_status")
            .select("registration_id, status, created_at")
            .in("registration_id", registrationIds)
            .order("created_at", { ascending: false })
        : { data: [], error: null };

      if (ignore) return;
      if (statusesError) {
        console.error("Error fetching registration statuses:", statusesError);
        setErrorMessage("Impossible de vérifier les places disponibles.");
        setIsLoading(false);
        return;
      }

      const activeRegistrationIds = getLatestActiveRegistrationIds(
        registrationIds,
        statuses,
      );
      setRegistrations(
        ((registrationData ?? []) as RegistrationRow[]).filter((registration) =>
          activeRegistrationIds.has(registration.id),
        ),
      );

      setIsLoading(false);
    };

    fetchAvailability();
    return () => {
      ignore = true;
    };
    // Sessions and global registrations do NOT depend on the current user, so
    // we deliberately omit `userId` from the deps. Re-fetching them when the
    // user signs up in the middle of the modal would blank the entire picker
    // (including their currently-selected hours) behind the loading spinner.
  }, [activityId, supabase]);

  // Fetch the signed-in user's own registrations whenever they (or the
  // available sessions) change, without toggling the global `isLoading` flag.
  // This keeps the rest of the picker (selected hours, success message,
  // checkout button) visible while we refresh per-user data after sign-up.
  useEffect(() => {
    const sessionIds = sessions.map((session) => session.id);
    if (!userId || !sessionIds.length) {
      setMyRegistrations([]);
      return;
    }
    void fetchMyRegistrations(userId, sessionIds);
    // `fetchMyRegistrations` is a stable closure over `supabase`, which is
    // already memoized, so it does not need to be in the deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, sessions]);

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, SessionRow[]>();
    sessions.forEach((session) => {
      const key = toParisDayKey(new Date(session.start_ts));
      map.set(key, [...(map.get(key) ?? []), session]);
    });
    return map;
  }, [sessions]);

  const dayOptions = useMemo(
    () =>
      Array.from(sessionsByDay.entries()).map(([key, daySessions]) => ({
        key,
        label: dateFormatter.format(new Date(daySessions[0].start_ts)),
      })),
    [sessionsByDay],
  );

  useEffect(() => {
    if (!selectedDay && dayOptions[0]) {
      setSelectedDay(dayOptions[0].key);
    }
  }, [dayOptions, selectedDay]);

  const sessionsForSelectedDay = useMemo(
    () => (selectedDay ? sessionsByDay.get(selectedDay) ?? [] : []),
    [selectedDay, sessionsByDay],
  );

  const hourSlotOptions = useMemo(() => {
    if (!sessionsForSelectedDay.length) return [];
    const now = Date.now();
    const options: HourSlotOption[] = [];

    for (const session of sessionsForSelectedDay) {
      const sessionRegistrations = registrations.filter(
        (registration) => registration.session_id === session.id,
      );

      for (const hour of buildParisHourSlots(session.start_ts, session.end_ts)) {
        const hourEnd = new Date(hour.getTime() + HOUR_MS);
        const registeredCount = countRegistrationsForHour(sessionRegistrations, hour);
        const available =
          session.max_registrations === null
            ? null
            : session.max_registrations - registeredCount;
        const bookedByMe = userId
          ? isHourBookedByUser(hour, session.id, myRegistrations)
          : false;

        options.push({
          key: hourSlotKey(session.id, hour),
          iso: hourKey(hour),
          sessionId: session.id,
          label: `${timeFormatter.format(hour)} - ${timeFormatter.format(hourEnd)}`,
          disabled:
            hour.getTime() <= now ||
            bookedByMe ||
            (available !== null && available <= 0),
          available,
          bookedByMe,
        });
      }
    }

    return options.sort(
      (left, right) => new Date(left.iso).getTime() - new Date(right.iso).getTime(),
    );
  }, [sessionsForSelectedDay, registrations, myRegistrations, userId]);

  const isSquareReservation = Boolean(squareProductId);
  const isAccompagnement = activityType === ACCOMPAGNEMENT_ACTIVITY_TYPE;
  const requiresExactHourCount = Boolean(isSquareReservation && fixedHourCount != null);
  const minHourCount = isAccompagnement
    ? 1
    : requiresExactHourCount
      ? fixedHourCount!
      : getMinPracticeReservationHours(activityType);

  useEffect(() => {
    const allowed = new Set(
      hourSlotOptions
        .filter((option) => !option.disabled && !option.bookedByMe)
        .map((option) => option.key),
    );
    setSelectedHourKeys((current) => current.filter((key) => allowed.has(key)));
  }, [hourSlotOptions]);

  const orderedSelectedSlots = useMemo(
    () => getOrderedSelectedHourSlots(selectedHourKeys, hourSlotOptions),
    [selectedHourKeys, hourSlotOptions],
  );

  const hasConsecutiveSelection = areHourSlotsConsecutive(orderedSelectedSlots);

  const selectedHourChecks = useMemo(
    () =>
      hourSlotOptions
        .filter((option) => selectedHourKeys.includes(option.key))
        .map((option) => ({
          key: option.key,
          label: option.label,
          available: option.available,
          isFull: option.available !== null && option.available <= 0,
        })),
    [hourSlotOptions, selectedHourKeys],
  );

  const hasSelectableHours = hourSlotOptions.some(
    (option) => !option.disabled && !option.bookedByMe,
  );

  const selectedHourCount = selectedHourKeys.length;
  const totalCredits = (credits ?? 0) * selectedHourCount;
  const hasFullHour = selectedHourChecks.some((check) => check.isFull);
  const hasEnoughCredits = totalCredits <= 0 || userCredits >= totalCredits;
  const hasRequiredHourCount = isAccompagnement
    ? selectedHourCount >= 1
    : requiresExactHourCount
      ? selectedHourCount === minHourCount && hasConsecutiveSelection
      : selectedHourCount >= minHourCount && hasConsecutiveSelection;
  const reservationRuleMessage =
    !isAccompagnement && selectedHourCount > 0 && !hasRequiredHourCount
      ? requiresExactHourCount
        ? selectedHourCount !== minHourCount
          ? `Ce pack découverte comprend exactement ${minHourCount} heures consécutives. Sélectionnez ${minHourCount} créneaux à la suite.`
          : `Les ${minHourCount} créneaux sélectionnés doivent être consécutifs pour réserver ce pack.`
        : selectedHourCount < minHourCount
          ? `Sélectionnez au moins ${minHourCount} heures consécutives pour réserver.`
          : "Les créneaux sélectionnés doivent être consécutifs pour réserver."
      : null;
  const selectedFirstHour = orderedSelectedSlots[0] ?? null;
  const selectedLastHour =
    orderedSelectedSlots[orderedSelectedSlots.length - 1] ?? null;
  const selectedReservationEnd = selectedLastHour
    ? new Date(new Date(selectedLastHour.iso).getTime() + HOUR_MS)
    : null;
  const checkoutStartIso = selectedFirstHour?.iso;
  const checkoutEndIso = selectedReservationEnd?.toISOString();
  const checkoutSessionId = selectedFirstHour?.sessionId;

  const handleAuthRequired = () => {
    if (!hasSelectedHours) {
      setErrorMessage("Sélectionnez un créneau avant de réserver.");
      return;
    }
    setShowAuthStep(true);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleAuthSuccess = async () => {
    const nextUserId = await refreshUser();
    if (!nextUserId) {
      return;
    }
    // Stay on this page with the modal open. Hide the auth step so the
    // "Payer et réserver" button (or credit-based "Réserver" button) is
    // shown again, ready for the user to manually finalize the checkout.
    //
    // NOTE: We intentionally do NOT call `router.refresh()` here. The parent
    // page (e.g. /pratique-libre) wraps its server content in <Suspense> with
    // `unstable_noStore()`, so a refresh re-suspends the tree and unmounts
    // this modal mid-flow — which looks like the page "reloads" and closes
    // the modal a few milliseconds after sign-up. The picker already tracks
    // the new session via its own `userId` state from `refreshUser()`, so the
    // server doesn't need to re-render for the checkout button to appear.
    setShowAuthStep(false);
    setErrorMessage(null);
    setSuccessMessage(
      isSquareReservation
        ? "Compte créé. Cliquez sur « Payer et réserver le pack découverte » pour finaliser le paiement."
        : "Vous êtes connecté. Vous pouvez maintenant finaliser votre réservation.",
    );
  };

  const toggleHourSelection = (key: string) => {
    const option = hourSlotOptions.find((slot) => slot.key === key);
    if (!option || option.disabled || option.bookedByMe) {
      return;
    }

    setShowAuthStep(false);
    setSelectedHourKeys((current) => {
      if (current.includes(key)) {
        return current.filter((value) => value !== key);
      }

      if (isAccompagnement || requiresExactHourCount) {
        return [...current, key].sort((a, b) => {
          const hourA =
            hourSlotOptions.find((slot) => slot.key === a)?.iso ?? a;
          const hourB =
            hourSlotOptions.find((slot) => slot.key === b)?.iso ?? b;
          return new Date(hourA).getTime() - new Date(hourB).getTime();
        });
      }

      const rangeSlots = getOrderedSelectedHourSlots(
        [...current, key],
        hourSlotOptions,
      );
      const rangeStart = new Date(rangeSlots[0].iso).getTime();
      const rangeEnd = new Date(rangeSlots[rangeSlots.length - 1].iso).getTime();

      const filledKeys = hourSlotOptions
        .filter((slot) => {
          const time = new Date(slot.iso).getTime();
          return (
            time >= rangeStart &&
            time <= rangeEnd &&
            !slot.disabled &&
            !slot.bookedByMe
          );
        })
        .map((slot) => slot.key);

      const filledSlots = getOrderedSelectedHourSlots(filledKeys, hourSlotOptions);
      if (
        areHourSlotsConsecutive(filledSlots) &&
        filledSlots.length >= minHourCount
      ) {
        return filledKeys;
      }

      return [...current, key].sort((a, b) => {
        const hourA = hourSlotOptions.find((slot) => slot.key === a)?.iso ?? a;
        const hourB = hourSlotOptions.find((slot) => slot.key === b)?.iso ?? b;
        return new Date(hourA).getTime() - new Date(hourB).getTime();
      });
    });
  };

  const handleRegister = async () => {
    if (!selectedHourKeys.length) return;

    if (!userId) {
      handleAuthRequired();
      return;
    }

    setIsRegistering(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!hasRequiredHourCount) {
      setIsRegistering(false);
      setErrorMessage(
        isAccompagnement
          ? "Sélectionnez au moins une heure."
          : requiresExactHourCount
            ? `Sélectionnez ${minHourCount} heures consécutives.`
            : `Sélectionnez au moins ${minHourCount} heures consécutives (ou plus).`,
      );
      return;
    }

    if (isAccompagnement) {
      for (const option of orderedSelectedSlots) {
        const hourStart = new Date(option.iso);
        if (isHourBookedByUser(hourStart, option.sessionId, myRegistrations)) {
          setIsRegistering(false);
          setErrorMessage("Une des heures sélectionnées est déjà réservée.");
          return;
        }

        const hourEnd = new Date(hourStart.getTime() + HOUR_MS);
        const result = await registerForSession(option.sessionId, "credits", {
          start: option.iso,
          end: hourEnd.toISOString(),
        });

        if (result.error) {
          setIsRegistering(false);
          setErrorMessage(result.error);
          return;
        }
      }
    } else {
      const blocks = splitIntoSessionBlocks(orderedSelectedSlots);
      if (!blocks.length) {
        setIsRegistering(false);
        return;
      }

      if (
        orderedSelectedSlots.some((slot) =>
          isHourBookedByUser(new Date(slot.iso), slot.sessionId, myRegistrations),
        )
      ) {
        setIsRegistering(false);
        setErrorMessage("Une des heures sélectionnées est déjà réservée.");
        return;
      }

      for (const block of blocks) {
        const result = await registerForSession(block.sessionId, "credits", {
          start: block.startIso,
          end: block.endIso,
        });

        if (result.error) {
          setIsRegistering(false);
          setErrorMessage(result.error);
          return;
        }
      }
    }

    const bookedCount = isAccompagnement
      ? selectedHourKeys.length
      : orderedSelectedSlots.length;
    setIsRegistering(false);
    setSelectedHourKeys([]);
    setSuccessMessage(
      bookedCount > 1
        ? `${bookedCount} créneaux réservés ! Nous vous attendons à l'atelier.`
        : "Réservation confirmée ! Nous vous attendons à l'atelier.",
    );
    if (userId) {
      await fetchMyRegistrations(
        userId,
        sessions.map((session) => session.id),
      );
    }

    const { data: registrationData } = await supabase
      .from("registration")
      .select("id, user_id, session_id, reserved_start_ts, reserved_end_ts")
      .in(
        "session_id",
        sessions.map((session) => session.id),
      );

    if (registrationData?.length) {
      const registrationIds = registrationData.map((registration) => registration.id);
      const { data: statuses } = await supabase
        .from("registration_status")
        .select("registration_id, status, created_at")
        .in("registration_id", registrationIds)
        .order("created_at", { ascending: false });

      const activeRegistrationIds = getLatestActiveRegistrationIds(
        registrationIds,
        statuses,
      );
      setRegistrations(
        (registrationData as RegistrationRow[]).filter((registration) =>
          activeRegistrationIds.has(registration.id),
        ),
      );
    }

    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement des créneaux...
      </div>
    );
  }

  if (!sessions.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun créneau de pratique libre n&apos;est disponible pour le moment.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {!inModal ? (
        <div>
          <h2 className="text-xl font-semibold text-black/85">
            Réserver en pratique libre
          </h2>
        <p className="mt-2 text-sm text-black/60">
          {isAccompagnement
            ? `Sélectionnez une ou plusieurs heures pour ${activityTitle}.`
            : `Sélectionnez au moins ${minHourCount} heures consécutives (ou plus) pour ${activityTitle}.`}
          </p>
        </div>
      ) : null}

      {userId && !isSquareReservation ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-white p-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-black/55">
              Mon solde de crédits
            </p>
            <p className="text-lg font-semibold text-black">
              {userCredits} crédit{userCredits > 1 ? "s" : ""}
            </p>
          </div>
          {credits !== null && credits !== undefined && selectedHourCount > 0 ? (
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-black/55">
                Coût de la réservation
              </p>
              <p
                className={cn(
                  "text-lg font-semibold",
                  hasEnoughCredits ? "text-black" : "text-destructive",
                )}
              >
                {totalCredits} crédit{totalCredits > 1 ? "s" : ""}
              </p>
              <p className="mt-0.5 text-xs text-black/55">
                Solde après: {Math.max(userCredits - totalCredits, 0)} crédit
                {userCredits - totalCredits > 1 ? "s" : ""}
              </p>
            </div>
          ) : credits !== null && credits !== undefined ? (
            <p className="text-right text-xs text-black/55">
              Tarif: {credits} crédit{credits > 1 ? "s" : ""} / heure
            </p>
          ) : null}
        </div>
      ) : null}

      {userId ? (
        <div className="rounded-lg border border-[#4a56dd]/25 bg-[#4a56dd]/5 p-4">
          <p className="text-sm font-semibold text-black/85">
            Mes réservations à venir
          </p>
          {myRegistrations.length === 0 ? (
            <p className="mt-2 text-sm text-black/60">
              Aucune réservation à venir pour cette activité.
            </p>
          ) : null}
          {myRegistrations.length > 0 ? (
          <div className="mt-3 space-y-3">
            {myRegistrations.map((registration) => {
              const start = new Date(registration.reserved_start_ts);
              const end = new Date(registration.reserved_end_ts);

              return (
                <div
                  key={registration.id}
                  className="flex items-start justify-between gap-4 rounded-lg border border-black/10 bg-white p-3"
                >
                  <div>
                    <p className="text-sm font-medium capitalize text-black">
                      {dateFormatter.format(start)}
                    </p>
                    <p className="text-sm text-black/65">
                      {timeFormatter.format(start)} - {timeFormatter.format(end)}
                    </p>
                  </div>
                  <CancelRegistrationButton
                    registrationId={registration.id}
                    onCancelled={() => {
                      if (userId) {
                        void fetchMyRegistrations(
                          userId,
                          sessions.map((session) => session.id),
                        );
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Jour</label>
          <Select
            value={selectedDay}
            onValueChange={(value) => {
              setSelectedDay(value);
              setSelectedHourKeys([]);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir un jour" />
            </SelectTrigger>
            <SelectContent>
              {dayOptions.map((day) => (
                <SelectItem key={day.key} value={day.key}>
                  {day.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {sessionsForSelectedDay.length > 0 ? (
          <div className="grid gap-3">
            <div>
              <p className="text-sm font-medium">
                Créneaux d&apos;une heure
              </p>
              <p className="mt-1 text-xs text-black/60">
                {isAccompagnement
                  ? "Sélectionnez une ou plusieurs heures disponibles."
                  : requiresExactHourCount
                    ? `Sélectionnez ${minHourCount} heures consécutives.`
                    : `Sélectionnez au moins ${minHourCount} heures consécutives (ou plus).`}
              </p>
            </div>
            <div className="grid gap-2">
              {hourSlotOptions.map((option) => {
                const isSelected = selectedHourKeys.includes(option.key);

                return (
                  <button
                    key={option.key}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => toggleHourSelection(option.key)}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-3 text-left transition",
                      option.bookedByMe
                        ? "cursor-not-allowed border-[#20b75a]/60 bg-[#20b75a]/10"
                        : option.disabled
                          ? "cursor-not-allowed opacity-50"
                          : isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "font-medium",
                        option.bookedByMe ? "text-[#1a8f47]" : undefined,
                      )}
                    >
                      {option.label}
                      {!option.bookedByMe && option.available !== null
                        ? ` · ${Math.max(option.available, 0)} place${
                            option.available > 1 ? "s" : ""
                          }`
                        : ""}
                    </span>
                    {option.bookedByMe ? (
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#1a8f47]">
                        Déjà réservé
                      </span>
                    ) : isSelected ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : null}
                  </button>
                );
              })}
              {hourSlotOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun créneau n&apos;est disponible ce jour.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {selectedHourChecks.length ? (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          <p className="font-medium">Places sur votre réservation</p>
          <div className="mt-2 space-y-1 text-muted-foreground">
            {selectedHourChecks.map((check) => (
              <p key={check.key} className={check.isFull ? "text-destructive" : ""}>
                {check.label}:{" "}
                {check.available === null
                  ? "places illimitées"
                  : `${Math.max(check.available, 0)} place${
                      check.available > 1 ? "s" : ""
                    } disponible${check.available > 1 ? "s" : ""}`}
              </p>
            ))}
          </div>
          {credits !== null && credits !== undefined && !isSquareReservation ? (
            <div className="mt-3 space-y-1">
              <p className="font-medium text-black">
                Total: {totalCredits} crédit{totalCredits > 1 ? "s" : ""}
              </p>
              <p
                className={cn(
                  "text-xs",
                  hasEnoughCredits ? "text-black/60" : "text-destructive",
                )}
              >
                Solde actuel: {userCredits} crédit{userCredits > 1 ? "s" : ""}
                {hasEnoughCredits
                  ? ` · solde après réservation: ${Math.max(
                      userCredits - totalCredits,
                      0,
                    )} crédit${userCredits - totalCredits > 1 ? "s" : ""}`
                  : ` · il manque ${totalCredits - userCredits} crédit${
                      totalCredits - userCredits > 1 ? "s" : ""
                    }`}
              </p>
            </div>
          ) : null}
          {isSquareReservation && minHourCount ? (
            <p className="mt-3 font-medium text-black">
              Pack découverte: {minHourCount} heures
            </p>
          ) : null}
          {reservationRuleMessage ? (
            <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {reservationRuleMessage}
            </p>
          ) : null}
        </div>
      ) : null}

      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}
      {successMessage ? (
        <p className="text-sm text-green-600">{successMessage}</p>
      ) : null}

      {showAuthStep && hasSelectedHours && !effectiveIsLoggedIn ? (
        <ReservationAuthStep
          onSuccess={handleAuthSuccess}
          description="Créez un compte ou connectez-vous. Vos créneaux restent sélectionnés et vous pourrez ensuite payer en ligne ou utiliser vos crédits."
        />
      ) : null}

      {isSquareReservation ? (
        !effectiveIsLoggedIn && !showAuthStep ? (
          <Button
            className="w-full"
            disabled={
              !hasSelectableHours ||
              selectedHourCount === 0 ||
              hasFullHour ||
              !hasRequiredHourCount
            }
            onClick={handleAuthRequired}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {reservationRuleMessage
              ? `Choisir ${minHourCount} heures consécutives`
              : "Payer et réserver le pack découverte"}
          </Button>
        ) : effectiveIsLoggedIn && squareProductId && checkoutSessionId && checkoutStartIso && checkoutEndIso ? (
          <SquareCheckoutButton
            productId={squareProductId}
            activityId={activityId}
            sessionId={checkoutSessionId}
            reservationStart={checkoutStartIso}
            reservationEnd={checkoutEndIso}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            disabled={
              isRegistering ||
              !hasSelectableHours ||
              selectedHourCount === 0 ||
              hasFullHour ||
              !hasRequiredHourCount
            }
          >
            {reservationRuleMessage
              ? `Choisir ${minHourCount} heures consécutives`
              : "Payer et réserver le pack découverte"}
          </SquareCheckoutButton>
        ) : (
          <Button className="w-full" disabled>
            <CalendarIcon className="mr-2 h-4 w-4" />
            Choisir deux créneaux
          </Button>
        )
      ) : effectiveIsLoggedIn || showAuthStep ? (
        effectiveIsLoggedIn ? (
          <Button
            className="w-full"
            disabled={
              isRegistering ||
              !hasSelectableHours ||
              selectedHourCount === 0 ||
              hasFullHour ||
              !hasRequiredHourCount ||
              !hasEnoughCredits
            }
            onClick={handleRegister}
          >
            {isRegistering ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CalendarIcon className="mr-2 h-4 w-4" />
            )}
            {selectedHourCount > 0
              ? `Réserver ${selectedHourCount} heure${selectedHourCount > 1 ? "s" : ""}${
                  totalCredits > 0
                    ? ` pour ${totalCredits} crédit${totalCredits > 1 ? "s" : ""}`
                    : ""
                }`
              : isAccompagnement
                ? "Choisir au moins une heure"
                : requiresExactHourCount
                  ? `Choisir ${minHourCount} heures consécutives`
                  : `Choisir au moins ${minHourCount} heures consécutives (ou plus)`}
          </Button>
        ) : null
      ) : (
        <Button
          className="w-full"
          disabled={
            !hasSelectableHours ||
            selectedHourCount === 0 ||
            hasFullHour ||
            !hasRequiredHourCount
          }
          onClick={handleAuthRequired}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedHourCount > 0
            ? `Réserver ${selectedHourCount} heure${selectedHourCount > 1 ? "s" : ""}${
                totalCredits > 0
                  ? ` pour ${totalCredits} crédit${totalCredits > 1 ? "s" : ""}`
                  : ""
              }`
            : isAccompagnement
              ? "Choisir au moins une heure"
              : requiresExactHourCount
                ? `Choisir ${minHourCount} heures consécutives`
                : `Choisir au moins ${minHourCount} heures consécutives (ou plus)`}
        </Button>
      )}
      {effectiveIsLoggedIn && !isSquareReservation && !hasEnoughCredits ? (
        <p className="text-xs text-destructive">
          Vous avez {userCredits} crédit{userCredits !== 1 ? "s" : ""}, il en
          faut {totalCredits}.
        </p>
      ) : null}
    </div>
  );
}
