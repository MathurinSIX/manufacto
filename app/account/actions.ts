"use server";

import { createClient } from "@/lib/supabase/server";
import {
  cancelSquareSubscription,
  resolveSquareSubscriptionId,
} from "@/lib/square/subscriptions";
import { parseSquarePaymentId } from "@/lib/format-payment-type";
import { getAdminClient, refundSquarePayment, retrieveSquarePayment } from "@/lib/square/server";
import { getPracticeHourlyCounts } from "@/lib/practice-capacity";
import {
  clampParticipantCount,
  sumParticipantCount,
} from "@/lib/participant-count";
import { revalidatePath } from "next/cache";
import { notifyRegistrationConfirmed } from "@/lib/email/registration-emails";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PaymentType = "credits" | "stripe";

type RegistrationStatusRow = {
  registration_id: string;
  status: string;
  created_at: string;
};

type ActivityRow = {
  id: string;
  nb_credits: number | string | null;
  type: string | null;
};

type RegistrationRow = {
  id: string;
  user_id: string;
  reserved_start_ts: string | null;
  reserved_end_ts: string | null;
  participant_count?: number | null;
};

import {
  canUserCancelRegistration,
  getRegistrationStartTime,
  USER_CANCELLATION_DEADLINE_ERROR,
} from "@/lib/cancellation-policy";
import {
  ACCOMPAGNEMENT_ACTIVITY_TYPE,
  getMinPracticeReservationHours,
} from "@/lib/practice-reservation";

const PRACTICE_ACTIVITY_TYPES = new Set([
  "autonomie",
  "autonomie_encadree",
  "accompagnement",
  "cuisson",
]);

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  return 0;
}

function activityFromSession(
  activity: ActivityRow | ActivityRow[] | null | undefined,
) {
  if (Array.isArray(activity)) return activity[0] ?? null;
  return activity ?? null;
}

function isWholeHour(date: Date) {
  return (
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

function getLatestActiveRegistrationIds(
  registrationIds: string[],
  statuses?: RegistrationStatusRow[] | null,
) {
  if (!registrationIds.length) {
    return new Set<string>();
  }

  if (!statuses?.length) {
    return new Set(registrationIds);
  }

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
    if (!seen.has(id)) {
      active.add(id);
    }
  });

  return active;
}

export async function registerForSession(
  sessionId: string,
  paymentType: PaymentType,
  reservation?: { start: string; end: string },
  participantCountInput = 1,
) {
  const participantCount = clampParticipantCount(participantCountInput);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié", registrationId: null };
  }

  if (!UUID_RE.test(sessionId)) {
    return { error: "Session invalide", registrationId: null };
  }

  const { data: session, error: sessionError } = await supabase
    .from("session")
    .select(
      "id, start_ts, end_ts, max_registrations, activity:activity_id(id, nb_credits, type)",
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError || !session) {
    console.error("Error fetching session:", sessionError);
    return { error: "Session introuvable", registrationId: null };
  }

  const sessionStart = new Date(session.start_ts);
  const sessionEnd = new Date(session.end_ts);
  const activity = activityFromSession(session.activity as ActivityRow | ActivityRow[] | null);
  const isPracticeActivity = PRACTICE_ACTIVITY_TYPES.has(activity?.type ?? "");
  const reservationStart = reservation?.start
    ? new Date(reservation.start)
    : null;
  const reservationEnd = reservation?.end ? new Date(reservation.end) : null;

  if (isPracticeActivity) {
    if (
      !reservationStart ||
      !reservationEnd ||
      Number.isNaN(reservationStart.getTime()) ||
      Number.isNaN(reservationEnd.getTime())
    ) {
      return { error: "Créneau de pratique libre invalide", registrationId: null };
    }

    if (!isWholeHour(reservationStart) || !isWholeHour(reservationEnd)) {
      return { error: "La réservation doit être faite par heure entière.", registrationId: null };
    }

    if (
      reservationStart.getTime() < sessionStart.getTime() ||
      reservationEnd.getTime() > sessionEnd.getTime() ||
      reservationEnd.getTime() <= reservationStart.getTime()
    ) {
      return { error: "Le créneau choisi n'est pas disponible.", registrationId: null };
    }

    const durationHours =
      (reservationEnd.getTime() - reservationStart.getTime()) / (60 * 60 * 1000);
    const minHours = getMinPracticeReservationHours(activity?.type);
    if (!Number.isInteger(durationHours) || durationHours < minHours) {
      return {
        error:
          minHours === 1
            ? "Choisissez au moins une heure de réservation."
            : `La réservation minimale est de ${minHours} heures consécutives.`,
        registrationId: null,
      };
    }

    if (
      activity?.type === ACCOMPAGNEMENT_ACTIVITY_TYPE &&
      durationHours !== 1
    ) {
      return {
        error: "Les séances d'accompagnement se réservent heure par heure.",
        registrationId: null,
      };
    }

    if (reservationStart.getTime() <= Date.now()) {
      return { error: "Ce créneau n'est plus réservable", registrationId: null };
    }
  } else if (sessionStart.getTime() <= Date.now()) {
    return { error: "Cette session n'est plus réservable", registrationId: null };
  } else if (reservationStart || reservationEnd) {
    return { error: "Cette activité se réserve sur une session fixe.", registrationId: null };
  }

  const { data: registrations, error: registrationsError } = await supabase
    .from("registration")
    .select("id, user_id, reserved_start_ts, reserved_end_ts, participant_count")
    .eq("session_id", sessionId);

  if (registrationsError) {
    console.error("Error fetching registrations:", registrationsError);
    return { error: "Impossible de vérifier les inscriptions", registrationId: null };
  }

  const registrationIds = registrations?.map((registration) => registration.id) ?? [];
  const { data: statuses, error: statusesError } = registrationIds.length
    ? await supabase
        .from("registration_status")
        .select("registration_id, status, created_at")
        .in("registration_id", registrationIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (statusesError) {
    console.error("Error fetching registration statuses:", statusesError);
    return { error: "Impossible de vérifier les inscriptions", registrationId: null };
  }

  const activeRegistrationIds = getLatestActiveRegistrationIds(
    registrationIds,
    statuses,
  );
  const activeRegistrations =
    registrations?.filter((registration) => activeRegistrationIds.has(registration.id)) ?? [];

  if (
    !isPracticeActivity &&
    activeRegistrations.some((registration) => registration.user_id === user.id)
  ) {
    return { error: "Vous êtes déjà inscrit à cette session.", registrationId: null };
  }

  if (isPracticeActivity) {
    const overlappingOwnRegistration = activeRegistrations.some((registration) => {
      if (registration.user_id !== user.id) return false;
      if (!registration.reserved_start_ts || !registration.reserved_end_ts) {
        return false;
      }
      return (
        new Date(registration.reserved_start_ts).getTime() < reservationEnd!.getTime() &&
        new Date(registration.reserved_end_ts).getTime() > reservationStart!.getTime()
      );
    });

    if (overlappingOwnRegistration) {
      return { error: "Vous avez déjà une réservation sur ce créneau.", registrationId: null };
    }

    if (session.max_registrations !== null) {
      const counts = getPracticeHourlyCounts(
        reservationStart!,
        reservationEnd!,
        activeRegistrations.map((registration) => ({
          reservedStartTs: registration.reserved_start_ts,
          reservedEndTs: registration.reserved_end_ts,
          participantCount: registration.participant_count,
        })),
      );
      const isAnyHourFull = Array.from(counts.values()).some(
        (count) => count + participantCount > session.max_registrations!,
      );

      if (isAnyHourFull) {
        return { error: "Ce créneau est complet sur au moins une heure.", registrationId: null };
      }
    }
  } else {
    if (
      session.max_registrations !== null &&
      sumParticipantCount(activeRegistrations) + participantCount >
        session.max_registrations
    ) {
      return { error: "Cette session est complète.", registrationId: null };
    }
  }

  if (paymentType === "credits") {
    const durationHours =
      isPracticeActivity && reservationStart && reservationEnd
        ? (reservationEnd.getTime() - reservationStart.getTime()) /
          (60 * 60 * 1000)
        : 1;
    const requiredCredits =
      toNumber(activity?.nb_credits) * durationHours * participantCount;

    if (requiredCredits > 0) {
      const { data: credits, error: creditsError } = await supabase
        .from("credit")
        .select("amount")
        .eq("user_id", user.id);

      if (creditsError) {
        console.error("Error fetching credits:", creditsError);
        return { error: "Impossible de vérifier vos crédits", registrationId: null };
      }

      const availableCredits =
        credits?.reduce((total, credit) => total + toNumber(credit.amount), 0) ?? 0;

      if (availableCredits < requiredCredits) {
        return {
          error: `Vous n'avez pas assez de crédits. Vous avez ${availableCredits} crédit${availableCredits !== 1 ? "s" : ""} et il en faut ${requiredCredits}.`,
          registrationId: null,
        };
      }
    }
  }

  const { data, error } = await supabase
    .from("registration")
    .insert({
      session_id: sessionId,
      user_id: user.id,
      payment_type: paymentType,
      participant_count: participantCount,
      reserved_start_ts: isPracticeActivity ? reservationStart!.toISOString() : null,
      reserved_end_ts: isPracticeActivity ? reservationEnd!.toISOString() : null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating registration:", error);
    return { error: "Votre inscription n'a pas pu être enregistrée.", registrationId: null };
  }

  revalidatePath("/account");
  revalidatePath("/cours");
  revalidatePath("/reserver");
  revalidatePath("/admin");
  revalidatePath(`/admin/users/${user.id}`);

  void notifyRegistrationConfirmed(data.id).catch((err) => {
    console.error("Failed to send registration confirmation email:", err);
  });

  return { error: null, registrationId: data.id };
}

const HOUR_MS = 60 * 60 * 1000;

type PracticeReservationBlock = { sessionId: string; start: string; end: string };

type SessionWithActivity = {
  id: string;
  start_ts: string;
  end_ts: string;
  max_registrations: number | null;
  activity_id: string;
  activity: ActivityRow | ActivityRow[] | null;
};

/**
 * Atomically register a practice reservation that may span multiple contiguous
 * sessions. The minimum-duration rule is enforced on the *total* contiguous
 * span, not per-block, so a user booking 2h that crosses a session boundary
 * (e.g. 18-19 in session A and 19-20 in session B) is accepted as a single
 * 2-hour reservation rather than rejected as two separate 1-hour ones.
 */
export async function registerForPracticeReservation(
  blocks: PracticeReservationBlock[],
  paymentType: PaymentType,
  participantCountInput = 1,
) {
  const participantCount = clampParticipantCount(participantCountInput);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié", registrationIds: [] as string[] };
  }

  if (!blocks.length) {
    return { error: "Aucun créneau sélectionné.", registrationIds: [] };
  }

  for (const block of blocks) {
    if (!UUID_RE.test(block.sessionId)) {
      return { error: "Session invalide", registrationIds: [] };
    }
  }

  const sortedBlocks = [...blocks]
    .map((block) => ({
      sessionId: block.sessionId,
      start: new Date(block.start),
      end: new Date(block.end),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  for (const block of sortedBlocks) {
    if (
      Number.isNaN(block.start.getTime()) ||
      Number.isNaN(block.end.getTime()) ||
      block.end.getTime() <= block.start.getTime() ||
      !isWholeHour(block.start) ||
      !isWholeHour(block.end)
    ) {
      return {
        error: "La réservation doit être faite par heure entière.",
        registrationIds: [],
      };
    }
  }

  for (let index = 1; index < sortedBlocks.length; index += 1) {
    const previous = sortedBlocks[index - 1];
    const current = sortedBlocks[index];
    if (current.start.getTime() !== previous.end.getTime()) {
      return {
        error: "Les créneaux sélectionnés doivent être consécutifs.",
        registrationIds: [],
      };
    }
  }

  const sessionIds = Array.from(new Set(sortedBlocks.map((block) => block.sessionId)));
  const { data: sessionRows, error: sessionsError } = await supabase
    .from("session")
    .select(
      "id, start_ts, end_ts, max_registrations, activity_id, activity:activity_id(id, nb_credits, type)",
    )
    .in("id", sessionIds);

  if (sessionsError) {
    console.error("Error fetching sessions for practice reservation:", sessionsError);
    return { error: "Session introuvable", registrationIds: [] };
  }

  const sessions = (sessionRows ?? []) as SessionWithActivity[];
  if (sessions.length !== sessionIds.length) {
    return { error: "Session introuvable", registrationIds: [] };
  }

  const sessionsById = new Map(sessions.map((session) => [session.id, session]));
  const firstActivity = activityFromSession(sessions[0].activity);
  if (!firstActivity) {
    return { error: "Activité introuvable", registrationIds: [] };
  }

  for (const session of sessions) {
    const activity = activityFromSession(session.activity);
    if (!activity || activity.id !== firstActivity.id) {
      return {
        error: "Les créneaux doivent appartenir à la même activité.",
        registrationIds: [],
      };
    }
  }

  if (!PRACTICE_ACTIVITY_TYPES.has(firstActivity.type ?? "")) {
    return {
      error: "Cette activité ne se réserve pas en pratique libre.",
      registrationIds: [],
    };
  }

  for (const block of sortedBlocks) {
    const session = sessionsById.get(block.sessionId)!;
    const sessionStart = new Date(session.start_ts);
    const sessionEnd = new Date(session.end_ts);
    if (
      block.start.getTime() < sessionStart.getTime() ||
      block.end.getTime() > sessionEnd.getTime()
    ) {
      return { error: "Le créneau choisi n'est pas disponible.", registrationIds: [] };
    }
    if (block.start.getTime() <= Date.now()) {
      return { error: "Ce créneau n'est plus réservable", registrationIds: [] };
    }
  }

  const totalStart = sortedBlocks[0].start;
  const totalEnd = sortedBlocks[sortedBlocks.length - 1].end;
  const totalDurationHours =
    (totalEnd.getTime() - totalStart.getTime()) / HOUR_MS;
  const minHours = getMinPracticeReservationHours(firstActivity.type);

  if (
    firstActivity.type === ACCOMPAGNEMENT_ACTIVITY_TYPE &&
    !sortedBlocks.every(
      (block) => block.end.getTime() - block.start.getTime() === HOUR_MS,
    )
  ) {
    return {
      error: "Les séances d'accompagnement se réservent heure par heure.",
      registrationIds: [],
    };
  }

  if (!Number.isInteger(totalDurationHours) || totalDurationHours < minHours) {
    return {
      error:
        minHours === 1
          ? "Choisissez au moins une heure de réservation."
          : `La réservation minimale est de ${minHours} heures consécutives.`,
      registrationIds: [],
    };
  }

  const { data: existingRegistrations, error: registrationsError } = await supabase
    .from("registration")
    .select("id, user_id, session_id, reserved_start_ts, reserved_end_ts, participant_count")
    .in("session_id", sessionIds);

  if (registrationsError) {
    console.error("Error fetching registrations:", registrationsError);
    return { error: "Impossible de vérifier les inscriptions", registrationIds: [] };
  }

  const existingIds = existingRegistrations?.map((row) => row.id) ?? [];
  const { data: statuses, error: statusesError } = existingIds.length
    ? await supabase
        .from("registration_status")
        .select("registration_id, status, created_at")
        .in("registration_id", existingIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (statusesError) {
    console.error("Error fetching registration statuses:", statusesError);
    return { error: "Impossible de vérifier les inscriptions", registrationIds: [] };
  }

  const activeRegistrationIds = getLatestActiveRegistrationIds(existingIds, statuses);
  const activeRegistrations =
    (existingRegistrations ?? []).filter((registration) =>
      activeRegistrationIds.has(registration.id),
    );

  const ownOverlaps = activeRegistrations.some((registration) => {
    if (registration.user_id !== user.id) return false;
    if (!registration.reserved_start_ts || !registration.reserved_end_ts) {
      return false;
    }
    const existingStart = new Date(registration.reserved_start_ts).getTime();
    const existingEnd = new Date(registration.reserved_end_ts).getTime();
    return sortedBlocks.some(
      (block) =>
        existingStart < block.end.getTime() &&
        existingEnd > block.start.getTime(),
    );
  });

  if (ownOverlaps) {
    return {
      error: "Vous avez déjà une réservation sur ce créneau.",
      registrationIds: [],
    };
  }

  for (const block of sortedBlocks) {
    const session = sessionsById.get(block.sessionId)!;
    if (session.max_registrations === null) continue;
    const sessionRegistrations = activeRegistrations.filter(
      (registration) => registration.session_id === block.sessionId,
    );
    const counts = getPracticeHourlyCounts(
      block.start,
      block.end,
      sessionRegistrations.map((registration) => ({
        reservedStartTs: registration.reserved_start_ts,
        reservedEndTs: registration.reserved_end_ts,
        participantCount: registration.participant_count,
      })),
    );
    const isAnyHourFull = Array.from(counts.values()).some(
      (count) => count + participantCount > session.max_registrations!,
    );
    if (isAnyHourFull) {
      return {
        error: "Ce créneau est complet sur au moins une heure.",
        registrationIds: [],
      };
    }
  }

  if (paymentType === "credits") {
    const requiredCredits =
      toNumber(firstActivity.nb_credits) * totalDurationHours * participantCount;
    if (requiredCredits > 0) {
      const { data: credits, error: creditsError } = await supabase
        .from("credit")
        .select("amount")
        .eq("user_id", user.id);

      if (creditsError) {
        console.error("Error fetching credits:", creditsError);
        return {
          error: "Impossible de vérifier vos crédits",
          registrationIds: [],
        };
      }

      const availableCredits =
        credits?.reduce((total, credit) => total + toNumber(credit.amount), 0) ?? 0;

      if (availableCredits < requiredCredits) {
        return {
          error: `Vous n'avez pas assez de crédits. Vous avez ${availableCredits} crédit${availableCredits !== 1 ? "s" : ""} et il en faut ${requiredCredits}.`,
          registrationIds: [],
        };
      }
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from("registration")
    .insert(
      sortedBlocks.map((block) => ({
        session_id: block.sessionId,
        user_id: user.id,
        payment_type: paymentType,
        participant_count: participantCount,
        reserved_start_ts: block.start.toISOString(),
        reserved_end_ts: block.end.toISOString(),
      })),
    )
    .select("id");

  if (insertError || !inserted) {
    console.error("Error creating practice reservation:", insertError);
    return {
      error: "Votre inscription n'a pas pu être enregistrée.",
      registrationIds: [],
    };
  }

  revalidatePath("/account");
  revalidatePath("/cours");
  revalidatePath("/reserver");
  revalidatePath("/admin");
  revalidatePath(`/admin/users/${user.id}`);

  return {
    error: null as string | null,
    registrationIds: inserted.map((row) => row.id),
  };
}

export async function cancelRegistration(registrationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  const { data: registration, error: regError } = await supabase
    .from("registration")
    .select(
      "id, user_id, payment_type, reserved_start_ts, session:session_id(id, start_ts)",
    )
    .eq("id", registrationId)
    .eq("user_id", user.id)
    .single();

  if (regError) {
    console.error("Error fetching registration:", regError);
    const { data: existingReg } = await supabase
      .from("registration")
      .select("id")
      .eq("id", registrationId)
      .single();

    if (existingReg) {
      return { error: "Réservation introuvable" };
    }
    return { error: "Réservation introuvable" };
  }

  if (!registration) {
    return { error: "Réservation introuvable" };
  }

  const session = Array.isArray(registration.session)
    ? registration.session[0]
    : registration.session;
  const registrationStart = getRegistrationStartTime(
    registration.reserved_start_ts,
    session?.start_ts ?? null,
  );

  if (
    registrationStart &&
    !canUserCancelRegistration(registrationStart)
  ) {
    return { error: USER_CANCELLATION_DEADLINE_ERROR };
  }

  const refundableStart = registration.reserved_start_ts ?? session?.start_ts ?? null;
  const refundableStartTs = refundableStart
    ? new Date(refundableStart).getTime()
    : null;
  const isFutureSession =
    refundableStartTs !== null &&
    !Number.isNaN(refundableStartTs) &&
    refundableStartTs > Date.now();

  const squarePaymentId = parseSquarePaymentId(registration.payment_type);

  if (squarePaymentId && isFutureSession) {
    try {
      await refundSquarePayment({
        paymentId: squarePaymentId,
        idempotencyKey: `rf-${registrationId}`,
        reason: "Annulation de réservation Manufacto",
      });
    } catch (refundError) {
      console.error("Square refund on cancellation failed:", refundError);
      return {
        error:
          "Le remboursement Square n'a pas pu être effectué. Réessayez ou contactez l'atelier.",
      };
    }
  }

  // Insert a new registration_status with CANCELLED status
  const { error: statusError } = await supabase
    .from("registration_status")
    .insert({
      registration_id: registrationId,
      status: "CANCELLED",
    });

  if (statusError) {
    console.error("Error cancelling registration:", statusError);
    return { error: "Erreur lors de l'annulation" };
  }

  revalidatePath("/account");
  return { success: true };
}

export async function cancelSubscriptionPurchase(purchaseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  if (!UUID_RE.test(purchaseId)) {
    return { error: "Formule invalide" };
  }

  const { data: purchase, error: purchaseError } = await supabase
    .from("square_purchase")
    .select(
      "id, status, product_kind, square_subscription_id, square_customer_id, square_payment_id, fulfilled_at",
    )
    .eq("id", purchaseId)
    .eq("user_id", user.id)
    .eq("product_kind", "subscription")
    .maybeSingle();

  if (purchaseError) {
    console.error("Error fetching subscription purchase:", purchaseError);
    return { error: "Formule introuvable" };
  }

  if (!purchase) {
    return { error: "Formule introuvable" };
  }

  if (purchase.status === "cancelled") {
    revalidatePath("/account");
    return { success: true };
  }

  if (purchase.status !== "completed") {
    return { error: "Seule une formule confirmée peut être résiliée" };
  }

  let squareSubscriptionId: string | null = null;

  try {
    squareSubscriptionId = await resolveSquareSubscriptionId({
      squareSubscriptionId: purchase.square_subscription_id,
      squareCustomerId: purchase.square_customer_id,
      squarePaymentId: purchase.square_payment_id,
      fulfilledAt: purchase.fulfilled_at,
      retrievePayment: retrieveSquarePayment,
    });
  } catch (error) {
    console.error("Error resolving Square subscription:", error);
    return {
      error:
        "Impossible de retrouver l'abonnement Square. Réessayez ou contactez l'atelier.",
    };
  }

  if (!squareSubscriptionId) {
    const admin = getAdminClient();
    const { error: updateError } = await admin
      .from("square_purchase")
      .update({ status: "cancelled" })
      .eq("id", purchaseId)
      .eq("user_id", user.id)
      .eq("product_kind", "subscription")
      .eq("status", "completed");

    if (updateError) {
      console.error("Error marking subscription purchase cancelled:", updateError);
      return { error: "Erreur lors de la résiliation" };
    }

    revalidatePath("/account");
    return { success: true };
  }

  try {
    await cancelSquareSubscription(squareSubscriptionId);
  } catch (error) {
    console.error("Error cancelling Square subscription:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Square n'a pas pu annuler le prélèvement récurrent",
    };
  }

  const admin = getAdminClient();
  const { error: updateError } = await admin
    .from("square_purchase")
    .update({
      status: "cancelled",
      square_subscription_id: squareSubscriptionId ?? purchase.square_subscription_id,
      square_customer_id: purchase.square_customer_id,
    })
    .eq("id", purchaseId)
    .eq("user_id", user.id)
    .eq("product_kind", "subscription")
    .eq("status", "completed");

  if (updateError) {
    console.error("Error cancelling subscription purchase:", updateError);
    return {
      error:
        squareSubscriptionId
          ? "Le prélèvement Square est annulé, mais la mise à jour du compte a échoué. Contactez l'atelier."
          : "Erreur lors de la résiliation",
    };
  }

  revalidatePath("/account");
  return { success: true };
}


