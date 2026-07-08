"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

import {
  createActivitiesBatch,
  createActivity,
  createSession,
  deletePublicSessionSubscription,
  deleteSession,
  getWeekSessions,
  getVisitManagementData,
} from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getParticipantCount, sumParticipantCount } from "@/lib/participant-count";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { AdminWeekCalendarSession } from "@/components/admin-week-calendar";
import { AdminWeekNavigator } from "@/components/admin-week-navigator";
import {
  AdminWeekTimeGrid,
  type CalendarSlotSelection,
} from "@/components/admin-week-time-grid";

import {
  addParisCalendarDays,
  formatParisDate,
  formatParisTime,
  getParisWeekMonday,
  PARIS_TIMEZONE,
  parseParisDateTime,
  shiftParisTimestampByWeeks,
} from "@/lib/paris-time";

type VisitActivity = {
  id: string;
  name: string;
  nb_credits: number | null;
  type: string | null;
  price: number | null;
  description: string | null;
};

type VisitSubscription = {
  id: string;
  session_id: string;
  name: string;
  phone: string;
  created_at: string;
  participant_count?: number | null;
};

type VisitSession = {
  id: string;
  activity_id: string;
  activity_name: string;
  start_ts: string;
  end_ts: string;
  max_registrations: number | null;
  subscriptions: VisitSubscription[];
};

type WeekSourceSession = {
  id: string;
  start_ts: string;
  end_ts: string;
  max_registrations: number | null;
  activity_id: string;
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: PARIS_TIMEZONE,
});

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: PARIS_TIMEZONE,
});

const createdAtFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: PARIS_TIMEZONE,
});

function toCalendarSession(
  session: WeekSourceSession | VisitSession,
  activityName?: string,
): AdminWeekCalendarSession {
  return {
    id: session.id,
    date: formatParisDate(new Date(session.start_ts)),
    start: formatParisTime(new Date(session.start_ts)),
    end: formatParisTime(new Date(session.end_ts)),
    activity_id: session.activity_id,
    activity_name: activityName ?? ("activity_name" in session ? session.activity_name : undefined),
    max_registrations: session.max_registrations,
  };
}

export function AdminVisitsTab() {
  const [activities, setActivities] = useState<VisitActivity[]>([]);
  const [sessions, setSessions] = useState<VisitSession[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [mainWeekOffset, setMainWeekOffset] = useState(0);
  const [manualWeekOffset, setManualWeekOffset] = useState(0);
  const [manualStartTime, setManualStartTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [maxRegistrations, setMaxRegistrations] = useState("20");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingDefaultActivity, setCreatingDefaultActivity] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddVisits, setShowAddVisits] = useState(false);
  const [visitAddTab, setVisitAddTab] = useState<"batch" | "manual">("batch");
  const [batchSelectedWeekOffset, setBatchSelectedWeekOffset] = useState(-1);
  const [batchTargetWeekOffset, setBatchTargetWeekOffset] = useState(0);
  const [batchPreviewSessions, setBatchPreviewSessions] = useState<
    WeekSourceSession[]
  >([]);
  const [batchLoadingPreview, setBatchLoadingPreview] = useState(false);
  const [batchCreating, setBatchCreating] = useState(false);
  const [batchWarning, setBatchWarning] = useState<string | null>(null);
  const [showCopyNextWeek, setShowCopyNextWeek] = useState(false);
  const [manualWeekSessions, setManualWeekSessions] = useState<WeekSourceSession[]>([]);
  const [loadingManualWeek, setLoadingManualWeek] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [slotSelection, setSlotSelection] = useState<CalendarSlotSelection | null>(null);
  const [detailSession, setDetailSession] = useState<VisitSession | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const batchSourceEqualsTarget = batchSelectedWeekOffset === batchTargetWeekOffset;

  const getTargetWeekDate = useCallback(
    (dateString: string) => {
      const weeksAhead = batchTargetWeekOffset - batchSelectedWeekOffset;
      return new Date(shiftParisTimestampByWeeks(dateString, weeksAhead));
    },
    [batchSelectedWeekOffset, batchTargetWeekOffset],
  );

  const activityNameById = useMemo(
    () => new Map(activities.map((activity) => [activity.id, activity.name])),
    [activities],
  );

  const activityColorIds = useMemo(
    () => activities.map((activity) => activity.id),
    [activities],
  );

  const mainWeekDays = useMemo(() => {
    const weekMonday = getParisWeekMonday(mainWeekOffset);
    return Array.from({ length: 7 }, (_, index) => addParisCalendarDays(weekMonday, index));
  }, [mainWeekOffset]);

  const sessionsForMainWeek = useMemo(
    () =>
      sessions.filter((session) => {
        const dateKey = formatParisDate(new Date(session.start_ts));
        return mainWeekDays.includes(dateKey);
      }),
    [sessions, mainWeekDays],
  );

  const mainWeekCalendarSessions = useMemo(
    () => sessionsForMainWeek.map((session) => toCalendarSession(session)),
    [sessionsForMainWeek],
  );

  const sessionById = useMemo(
    () => new Map(sessions.map((session) => [session.id, session])),
    [sessions],
  );

  const batchSourceCalendarSessions = useMemo(
    () =>
      batchPreviewSessions.map((session) =>
        toCalendarSession(session, activityNameById.get(session.activity_id)),
      ),
    [batchPreviewSessions, activityNameById],
  );

  const batchTargetCalendarSessions = useMemo(
    () =>
      batchPreviewSessions.map((session) => {
        const targetStart = getTargetWeekDate(session.start_ts);
        const targetEnd = getTargetWeekDate(session.end_ts);
        return {
          id: session.id,
          date: formatParisDate(targetStart),
          start: formatParisTime(targetStart),
          end: formatParisTime(targetEnd),
          activity_id: session.activity_id,
          activity_name: activityNameById.get(session.activity_id),
          max_registrations: session.max_registrations,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [batchPreviewSessions, batchSelectedWeekOffset, batchTargetWeekOffset, activityNameById],
  );

  const manualExistingCalendarSessions = useMemo(
    () =>
      manualWeekSessions.map((session) =>
        toCalendarSession(session, activityNameById.get(session.activity_id)),
      ),
    [manualWeekSessions, activityNameById],
  );

  const manualPreviewCalendarSessions = useMemo((): AdminWeekCalendarSession[] => {
    if (!slotSelection || !manualStartTime || !selectedActivityId) return [];

    const duration = parseInt(durationMinutes, 10);
    if (!Number.isFinite(duration) || duration <= 0) return [];

    const startDateTime = parseParisDateTime(slotSelection.date, manualStartTime);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000);

    return [
      {
        id: "preview",
        date: slotSelection.date,
        start: formatParisTime(startDateTime),
        end: formatParisTime(endDateTime),
        activity_id: selectedActivityId,
        activity_name: activityNameById.get(selectedActivityId),
      },
    ];
  }, [
    slotSelection,
    manualStartTime,
    selectedActivityId,
    durationMinutes,
    activityNameById,
  ]);

  const slotDateLabel = useMemo(() => {
    if (!slotSelection) return null;
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: PARIS_TIMEZONE,
    }).format(parseParisDateTime(slotSelection.date, "12:00"));
  }, [slotSelection]);

  const upcomingSessions = useMemo(
    () =>
      sessionsForMainWeek.filter(
        (session) => new Date(session.start_ts).getTime() >= Date.now(),
      ),
    [sessionsForMainWeek],
  );

  const pastSessions = useMemo(
    () =>
      sessions.filter(
        (session) => new Date(session.start_ts).getTime() < Date.now(),
      ),
    [sessions],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getVisitManagementData();
      if (result.error) {
        setError(result.error);
      } else {
        setActivities(result.activities as VisitActivity[]);
        setSessions(result.sessions as VisitSession[]);
        setSelectedActivityId((current) => {
          if (current && result.activities.some((activity) => activity.id === current)) {
            return current;
          }
          return result.activities[0]?.id ?? "";
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!showAddVisits || visitAddTab !== "batch" || !selectedActivityId) {
      setBatchPreviewSessions([]);
      return;
    }

    let cancelled = false;

    (async () => {
      setBatchLoadingPreview(true);
      setError(null);
      try {
        const result = await getWeekSessions(
          selectedActivityId,
          batchSelectedWeekOffset,
        );
        if (cancelled) return;
        if (result.error) {
          setError(result.error);
          setBatchPreviewSessions([]);
        } else {
          const rows = (result.sessions ?? []) as WeekSourceSession[];
          setBatchPreviewSessions(rows);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Une erreur s'est produite",
          );
          setBatchPreviewSessions([]);
        }
      } finally {
        if (!cancelled) {
          setBatchLoadingPreview(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    showAddVisits,
    visitAddTab,
    selectedActivityId,
    batchSelectedWeekOffset,
  ]);

  const loadManualWeekSessions = useCallback(async () => {
    if (!selectedActivityId) {
      setManualWeekSessions([]);
      return;
    }

    setLoadingManualWeek(true);
    try {
      const result = await getWeekSessions(selectedActivityId, manualWeekOffset);
      if (result.error) {
        setManualWeekSessions([]);
      } else {
        setManualWeekSessions((result.sessions ?? []) as WeekSourceSession[]);
      }
    } catch {
      setManualWeekSessions([]);
    } finally {
      setLoadingManualWeek(false);
    }
  }, [selectedActivityId, manualWeekOffset]);

  useEffect(() => {
    if (showAddVisits && visitAddTab === "manual" && selectedActivityId) {
      loadManualWeekSessions();
    }
  }, [showAddVisits, visitAddTab, selectedActivityId, loadManualWeekSessions]);

  const handleSelectCalendarSlot = useCallback((selection: CalendarSlotSelection) => {
    setSlotSelection(selection);
    setManualStartTime(selection.startTime);

    const [startHour, startMinute] = selection.startTime.split(":").map(Number);
    const [endHour, endMinute] = selection.endTime.split(":").map(Number);
    const selectedDuration =
      endHour * 60 + endMinute - (startHour * 60 + startMinute);
    if (selectedDuration >= 15) {
      setDurationMinutes(String(selectedDuration));
    }

    setManualModalOpen(true);
  }, []);

  const handleCreateBatch = async () => {
    if (!selectedActivityId || batchPreviewSessions.length === 0 || batchSourceEqualsTarget) {
      return;
    }

    setBatchCreating(true);
    setError(null);
    setSuccess(null);
    setBatchWarning(null);
    setShowCopyNextWeek(false);

    try {
      const result = await createActivitiesBatch(
        selectedActivityId,
        batchSelectedWeekOffset,
        batchTargetWeekOffset,
      );
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(
          `${result.created} créneau${result.created > 1 ? "x" : ""} créé${result.created > 1 ? "s" : ""}.`,
        );
        if (result.warning) {
          setBatchWarning(result.warning);
        }
        setShowCopyNextWeek(true);
        await loadData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setBatchCreating(false);
    }
  };

  const handleCopyToNextWeek = () => {
    setBatchTargetWeekOffset((prev) => prev + 1);
    setSuccess(null);
    setBatchWarning(null);
    setShowCopyNextWeek(false);
  };

  const handleCreateDefaultActivity = async () => {
    setCreatingDefaultActivity(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await createActivity(
        "Venez découvrir l'atelier",
        null,
        "visite",
        null,
        "Visite gratuite de l'atelier et présentation du fonctionnement.",
      );

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("activité de visite créée.");
        await loadData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setCreatingDefaultActivity(false);
    }
  };

  const handleCreateSession = async () => {
    if (!selectedActivityId || !slotSelection || !manualStartTime) {
      setError("Sélectionnez une visite et un créneau sur le calendrier.");
      return;
    }

    const duration = parseInt(durationMinutes, 10);
    if (!Number.isFinite(duration) || duration <= 0) {
      setError("La durée doit être supérieure à 0.");
      return;
    }

    const startDateTime = parseParisDateTime(slotSelection.date, manualStartTime);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000);
    const max =
      maxRegistrations.trim() === ""
        ? null
        : Math.max(parseInt(maxRegistrations, 10) || 0, 0);

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await createSession(
        selectedActivityId,
        startDateTime.toISOString(),
        endDateTime.toISOString(),
        max,
      );

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Créneau de visite créé.");
        setManualModalOpen(false);
        setSlotSelection(null);
        setManualStartTime("");
        await loadData();
        await loadManualWeekSessions();
        setShowAddVisits(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSession = async (session: VisitSession) => {
    if (
      !confirm(
        `supprimer le créneau du ${dateFormatter.format(new Date(session.start_ts))} ?`,
      )
    ) {
      return;
    }

    setError(null);
    setSuccess(null);

    const result = await deleteSession(session.id);
    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess("Créneau supprimé.");
    setDetailDialogOpen(false);
    setDetailSession(null);
    await loadData();
  };

  const handleDeleteSubscription = async (subscription: VisitSubscription) => {
    if (!confirm(`supprimer l'inscription de ${subscription.name} ?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    const result = await deletePublicSessionSubscription(subscription.id);
    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess("Inscription supprimée.");
    await loadData();
  };

  const renderSession = (session: VisitSession) => {
    const start = new Date(session.start_ts);
    const end = new Date(session.end_ts);
    const bookedCount = sumParticipantCount(session.subscriptions);
    const isFull =
      session.max_registrations !== null &&
      bookedCount >= session.max_registrations;

    return (
      <article key={session.id} className="rounded-[16px] border border-black/10 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-black">
                {dateFormatter.format(start)}
              </h3>
              {isFull ? (
                <Badge variant="destructive">complet</Badge>
              ) : (
                <Badge variant="secondary">ouvert</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-black/65">
              {timeFormatter.format(start)} - {timeFormatter.format(end)}
            </p>
            <p className="mt-1 text-sm text-black/65">
              {bookedCount} personne{bookedCount > 1 ? "s" : ""}
              {session.max_registrations !== null
                ? ` / ${session.max_registrations} places`
                : ""}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleDeleteSession(session)}
            disabled={session.subscriptions.length > 0}
            title={
              session.subscriptions.length > 0
                ? "Supprimez d'abord les inscriptions publiques"
                : undefined
            }
          >
            <Trash2 className="mr-2 h-4 w-4" />
            supprimer
          </Button>
        </div>

        <div className="mt-5">
          {session.subscriptions.length ? (
            <div className="divide-y rounded-[14px] border border-black/10">
              {session.subscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-black">
                      {subscription.name}
                      {getParticipantCount(subscription) > 1
                        ? ` · ${getParticipantCount(subscription)} personnes`
                        : ""}
                    </p>
                    <p className="text-sm text-black/65">
                      {subscription.phone.trim()
                        ? subscription.phone
                        : "—"}
                    </p>
                    <p className="text-xs text-black/45">
                      inscrit le{" "}
                      {createdAtFormatter.format(new Date(subscription.created_at))}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="self-start text-destructive hover:text-destructive md:self-auto"
                    onClick={() => handleDeleteSubscription(subscription)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    retirer
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-[14px] border border-dashed border-black/10 p-4 text-sm text-black/55">
              aucun inscrit pour le moment.
            </p>
          )}
        </div>
      </article>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        chargement des visites...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-black">
            visites de l&apos;atelier
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-black/65">
            Gérez les créneaux gratuits affichés sur “Venez découvrir
            l&apos;atelier” et les inscriptions publiques (nom, téléphone
            optionnel).
          </p>
        </div>
        {activities.length ? (
          <Button
            type="button"
            onClick={() => {
              setError(null);
              setVisitAddTab("batch");
              setBatchSelectedWeekOffset(-1);
              setBatchTargetWeekOffset(0);
              setManualWeekOffset(mainWeekOffset);
              setShowAddVisits(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            ajouter des visites
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleCreateDefaultActivity}
            disabled={creatingDefaultActivity}
          >
            {creatingDefaultActivity ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            créer l&apos;activité visite
          </Button>
        )}
      </div>

      {error ? (
        <p className="rounded-[14px] bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-[14px] bg-green-50 p-4 text-sm font-medium text-green-700">
          {success}
        </p>
      ) : null}

      {showAddVisits && activities.length ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setShowAddVisits(false);
              setError(null);
            }}
            className="text-sm font-semibold text-[#4a56dd] hover:underline"
          >
            retour aux visites
          </button>
          <p className="text-sm text-black/65">
            Naviguez semaine par semaine, visualisez le calendrier horaire et créez
            ou copiez des créneaux de visite.
          </p>
          <Tabs
            value={visitAddTab}
            onValueChange={(value) => {
              setVisitAddTab(value as "batch" | "manual");
              setError(null);
            }}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="batch">par copie</TabsTrigger>
              <TabsTrigger value="manual">manuelle</TabsTrigger>
            </TabsList>

            <TabsContent value="batch" className="mt-4 space-y-4">
              <div className="space-y-6 rounded-[16px] border border-black/10 p-5">
                <div className="grid gap-2 max-w-md">
                  <Label htmlFor="visit-batch-activity">activité visite</Label>
                  <Select
                    value={selectedActivityId}
                    onValueChange={setSelectedActivityId}
                  >
                    <SelectTrigger id="visit-batch-activity">
                      <SelectValue placeholder="Choisir une visite" />
                    </SelectTrigger>
                    <SelectContent>
                      {activities.map((activity) => (
                        <SelectItem key={activity.id} value={activity.id}>
                          {activity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <AdminWeekNavigator
                  label="Semaine source"
                  hint="créneaux existants sur cette semaine"
                  weekOffset={batchSelectedWeekOffset}
                  onWeekOffsetChange={setBatchSelectedWeekOffset}
                  id="visit-source-week"
                />

                {batchLoadingPreview ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg border py-16 text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Chargement du calendrier…
                  </div>
                ) : (
                  <AdminWeekTimeGrid
                    weekOffset={batchSelectedWeekOffset}
                    existingSessions={batchSourceCalendarSessions}
                    activityColorIds={
                      selectedActivityId ? [selectedActivityId] : activityColorIds
                    }
                  />
                )}

                <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
                  <AdminWeekNavigator
                    label="Semaine cible"
                    hint="aperçu de ce qui sera créé"
                    weekOffset={batchTargetWeekOffset}
                    onWeekOffsetChange={setBatchTargetWeekOffset}
                    id="visit-target-week"
                  />

                  {batchSourceEqualsTarget ? (
                    <p className="text-sm text-destructive">
                      La semaine source et la semaine cible doivent être différentes.
                    </p>
                  ) : null}

                  {batchWarning ? (
                    <p className="text-sm text-amber-700">{batchWarning}</p>
                  ) : null}

                  {!batchLoadingPreview && batchPreviewSessions.length > 0 ? (
                    <AdminWeekTimeGrid
                      weekOffset={batchTargetWeekOffset}
                      previewSessions={batchTargetCalendarSessions}
                      title="Aperçu semaine cible"
                      activityColorIds={
                        selectedActivityId ? [selectedActivityId] : activityColorIds
                      }
                    />
                  ) : !batchLoadingPreview ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Aucun créneau dans la semaine source pour cette activité.
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {batchPreviewSessions.length > 0 && !batchSourceEqualsTarget ? (
                      <>
                        <Button
                          type="button"
                          onClick={handleCreateBatch}
                          disabled={batchCreating || !selectedActivityId}
                        >
                          {batchCreating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Création...
                            </>
                          ) : (
                            `Créer ${batchPreviewSessions.length} créneau${batchPreviewSessions.length > 1 ? "x" : ""}`
                          )}
                        </Button>
                        {showCopyNextWeek && selectedActivityId ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCopyToNextWeek}
                          >
                            Copier vers la semaine suivante
                          </Button>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="mt-4 space-y-4">
              <div className="space-y-4 rounded-[16px] border border-black/10 p-5">
                <div className="grid gap-2 max-w-md">
                  <Label htmlFor="visit-activity">activité visite</Label>
                  <Select
                    value={selectedActivityId}
                    onValueChange={setSelectedActivityId}
                  >
                    <SelectTrigger id="visit-activity">
                      <SelectValue placeholder="Choisir une visite" />
                    </SelectTrigger>
                    <SelectContent>
                      {activities.map((activity) => (
                        <SelectItem key={activity.id} value={activity.id}>
                          {activity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <AdminWeekNavigator
                  label="Semaine"
                  weekOffset={manualWeekOffset}
                  onWeekOffsetChange={setManualWeekOffset}
                  id="visit-manual-week"
                />

                {loadingManualWeek ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg border py-20 text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Chargement du calendrier…
                  </div>
                ) : (
                  <AdminWeekTimeGrid
                    weekOffset={manualWeekOffset}
                    existingSessions={manualExistingCalendarSessions}
                    previewSessions={manualPreviewCalendarSessions}
                    activityColorIds={
                      selectedActivityId ? [selectedActivityId] : activityColorIds
                    }
                    selectable
                    onSelectSlot={handleSelectCalendarSlot}
                  />
                )}
              </div>

              <Dialog open={manualModalOpen} onOpenChange={setManualModalOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nouveau créneau de visite</DialogTitle>
                    <DialogDescription>
                      {slotDateLabel && manualStartTime
                        ? `${slotDateLabel} · ${manualStartTime} (${durationMinutes} min)`
                        : "Configurez le créneau à créer"}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                      <Label htmlFor="manual-visit-activity">Activité *</Label>
                      <Select value={selectedActivityId} onValueChange={setSelectedActivityId}>
                        <SelectTrigger id="manual-visit-activity">
                          <SelectValue placeholder="Choisir une visite" />
                        </SelectTrigger>
                        <SelectContent>
                          {activities.map((activity) => (
                            <SelectItem key={activity.id} value={activity.id}>
                              {activity.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="manual-visit-start">Heure de début *</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={manualStartTime ? (manualStartTime.split(":")[0] || "00") : ""}
                            onValueChange={(hour) => {
                              const currentMinute =
                                manualStartTime && manualStartTime.includes(":")
                                  ? manualStartTime.split(":")[1]
                                  : "00";
                              setManualStartTime(`${hour.padStart(2, "0")}:${currentMinute.padStart(2, "0")}`);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Heure" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                <SelectItem key={hour} value={hour.toString().padStart(2, "0")}>
                                  {hour.toString().padStart(2, "0")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={
                              manualStartTime && manualStartTime.includes(":")
                                ? manualStartTime.split(":")[1] || "00"
                                : ""
                            }
                            onValueChange={(minute) => {
                              const currentHour =
                                manualStartTime && manualStartTime.includes(":")
                                  ? manualStartTime.split(":")[0]
                                  : "00";
                              setManualStartTime(`${currentHour.padStart(2, "0")}:${minute.padStart(2, "0")}`);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Min" />
                            </SelectTrigger>
                            <SelectContent>
                              {["00", "15", "30", "45"].map((minute) => (
                                <SelectItem key={minute} value={minute}>
                                  {minute}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="visit-duration">Durée (min) *</Label>
                        <Input
                          id="visit-duration"
                          type="number"
                          min="5"
                          step="5"
                          value={durationMinutes}
                          onChange={(event) => setDurationMinutes(event.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="visit-capacity">Places max</Label>
                      <Input
                        id="visit-capacity"
                        type="number"
                        min="0"
                        value={maxRegistrations}
                        onChange={(event) => setMaxRegistrations(event.target.value)}
                        placeholder="Illimité"
                      />
                    </div>
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" onClick={() => setManualModalOpen(false)}>
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCreateSession}
                      disabled={
                        saving ||
                        !selectedActivityId ||
                        !slotSelection ||
                        !manualStartTime
                      }
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Création...
                        </>
                      ) : (
                        "Créer le créneau"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
        </div>
      ) : !activities.length ? (
        <p className="rounded-[16px] border border-dashed border-black/10 p-5 text-sm text-black/60">
          aucune activité de type visite n&apos;existe encore. créez-la pour
          pouvoir ajouter des créneaux de découverte.
        </p>
      ) : null}

      {!showAddVisits && activities.length ? (
        <section className="space-y-4">
          <AdminWeekNavigator
            weekOffset={mainWeekOffset}
            onWeekOffsetChange={setMainWeekOffset}
          />
          <AdminWeekTimeGrid
            weekOffset={mainWeekOffset}
            existingSessions={mainWeekCalendarSessions}
            activityColorIds={activityColorIds}
            onExistingSessionClick={(session) => {
              const fullSession = session.id ? sessionById.get(session.id) : undefined;
              if (fullSession) {
                setDetailSession(fullSession);
                setDetailDialogOpen(true);
              }
            }}
          />
        </section>
      ) : null}

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-black">créneaux à venir</h3>
        {upcomingSessions.length ? (
          <div className="space-y-4">{upcomingSessions.map(renderSession)}</div>
        ) : (
          <p className="rounded-[16px] border border-dashed border-black/10 p-5 text-sm text-black/60">
            aucun créneau de visite à venir cette semaine.
          </p>
        )}
      </section>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailSession ? renderSession(detailSession) : null}
        </DialogContent>
      </Dialog>

      {pastSessions.length ? (
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-black">créneaux récents passés</h3>
          <div className="space-y-4">{pastSessions.map(renderSession)}</div>
        </section>
      ) : null}
    </div>
  );
}
