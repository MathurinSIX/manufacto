"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

import {
  createActivitiesBatch,
  createActivity,
  createSession,
  deletePublicSessionSubscription,
  deleteSession,
  getPreviousWeekSessions,
  getVisitManagementData,
} from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

import {
  addParisCalendarDays,
  formatParisDate,
  getParisMondayDate,
  getParisWeekdayIndex,
  PARIS_TIMEZONE,
  parseParisDateTime,
  parseParisDatetimeLocal,
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

function getDefaultStart() {
  const today = formatParisDate(new Date());
  const weekday = getParisWeekdayIndex(parseParisDateTime(today, "12:00"));
  const daysUntilTuesday = (1 - weekday + 7) % 7 || 7;
  const nextTuesday = addParisCalendarDays(today, daysUntilTuesday);
  return `${nextTuesday}T18:30`;
}

function getIsoFromParisDatetime(value: string) {
  return parseParisDatetimeLocal(value).toISOString();
}

export function AdminVisitsTab() {
  const [activities, setActivities] = useState<VisitActivity[]>([]);
  const [sessions, setSessions] = useState<VisitSession[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [startValue, setStartValue] = useState(getDefaultStart);
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

  const upcomingSessions = useMemo(
    () =>
      sessions.filter(
        (session) => new Date(session.start_ts).getTime() >= Date.now(),
      ),
    [sessions],
  );

  const pastSessions = useMemo(
    () =>
      sessions.filter(
        (session) => new Date(session.start_ts).getTime() < Date.now(),
      ),
    [sessions],
  );

  const shortDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "short",
        timeZone: PARIS_TIMEZONE,
      }),
    [],
  );

  const getWeekLabel = useCallback(
    (offset: number): string => {
      const selectedWeekMonday = addParisCalendarDays(getParisMondayDate(), offset * 7);
      const selectedWeekSunday = addParisCalendarDays(selectedWeekMonday, 6);

      const formatWeekDate = (dateKey: string) =>
        shortDateFormatter.format(parseParisDateTime(dateKey, "12:00"));

      if (offset === 0) {
        return `cette semaine (${formatWeekDate(selectedWeekMonday)} - ${formatWeekDate(selectedWeekSunday)})`;
      }
      if (offset === -1) {
        return `semaine précédente (${formatWeekDate(selectedWeekMonday)} - ${formatWeekDate(selectedWeekSunday)})`;
      }
      if (offset > 0) {
        return `dans ${offset} semaine${offset > 1 ? "s" : ""} (${formatWeekDate(selectedWeekMonday)} - ${formatWeekDate(selectedWeekSunday)})`;
      }
      return `${Math.abs(offset)} semaines précédentes (${formatWeekDate(selectedWeekMonday)} - ${formatWeekDate(selectedWeekSunday)})`;
    },
    [shortDateFormatter],
  );

  const getTargetWeekDate = useCallback(
    (dateString: string) => {
      const date = new Date(dateString);
      const weeksAhead = batchTargetWeekOffset - batchSelectedWeekOffset;
      const weekInMs = weeksAhead * 7 * 24 * 60 * 60 * 1000;
      return new Date(date.getTime() + weekInMs);
    },
    [batchSelectedWeekOffset, batchTargetWeekOffset],
  );

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
        const result = await getPreviousWeekSessions(
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
          if (rows.length === 0) {
            setError(
              "aucun créneau dans la semaine sélectionnée pour cette activité.",
            );
          }
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

  const handleCreateBatch = async () => {
    if (!selectedActivityId || batchPreviewSessions.length === 0) return;

    setBatchCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await createActivitiesBatch(
        selectedActivityId,
        batchSelectedWeekOffset,
        batchTargetWeekOffset,
      );
      if (result.error) {
        setError(
          result.error === "No sessions found in selected week to duplicate"
            ? "aucune session dans la semaine sélectionnée à dupliquer."
            : result.error,
        );
      } else {
        setSuccess(
          `${result.created} créneau${result.created > 1 ? "x" : ""} créé${result.created > 1 ? "s" : ""}.`,
        );
        setBatchPreviewSessions([]);
        await loadData();
        setShowAddVisits(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setBatchCreating(false);
    }
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

  const handleCreateSession = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedActivityId || !startValue) {
      setError("Sélectionnez une visite et une date.");
      return;
    }

    const duration = parseInt(durationMinutes, 10);
    if (!Number.isFinite(duration) || duration <= 0) {
      setError("La durée doit être supérieure à 0.");
      return;
    }

    const start = new Date(startValue);
    const end = new Date(start.getTime() + duration * 60 * 1000);
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
        getIsoFromParisDatetime(startValue),
        end.toISOString(),
        max,
      );

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Créneau de visite créé.");
        await loadData();
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
            Ajoutez un créneau manuellement ou dupliquez ceux d&apos;une semaine
            passée vers une semaine cible, comme pour les sessions de cours.
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
              <div className="space-y-4 rounded-[16px] border border-black/10 p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
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
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="visit-source-week">semaine à copier</Label>
                    <Select
                      value={batchSelectedWeekOffset.toString()}
                      onValueChange={(value) =>
                        setBatchSelectedWeekOffset(parseInt(value, 10))
                      }
                    >
                      <SelectTrigger id="visit-source-week">
                        <SelectValue placeholder="semaine source" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 8 }, (_, i) => -(i + 1)).map(
                          (offset) => (
                            <SelectItem key={offset} value={offset.toString()}>
                              {getWeekLabel(offset)}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-black/55">
                      créneaux existants sur cette semaine (ex. semaine
                      précédente).
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="visit-target-week">semaine cible</Label>
                    <Select
                      value={batchTargetWeekOffset.toString()}
                      onValueChange={(value) =>
                        setBatchTargetWeekOffset(parseInt(value, 10))
                      }
                    >
                      <SelectTrigger id="visit-target-week">
                        <SelectValue placeholder="semaine cible" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 8 }, (_, i) => i - 1).map(
                          (offset) => (
                            <SelectItem key={offset} value={offset.toString()}>
                              {getWeekLabel(offset)}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-black/55">
                      les nouveaux créneaux seront créés à la même date/heure
                      relative dans cette semaine.
                    </p>
                  </div>
                </div>

                {batchLoadingPreview ? (
                  <div className="flex items-center gap-2 text-sm text-black/60">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    chargement de l&apos;aperçu…
                  </div>
                ) : null}

                {!batchLoadingPreview && batchPreviewSessions.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-black">
                      aperçu ({batchPreviewSessions.length} créneau
                      {batchPreviewSessions.length > 1 ? "x" : ""} à créer)
                    </p>
                    <ul className="max-h-48 space-y-2 overflow-y-auto rounded-[12px] border border-black/10 bg-black/[0.02] p-3 text-sm text-black/80">
                      {batchPreviewSessions.map((session) => {
                        const targetStart = getTargetWeekDate(session.start_ts);
                        const targetEnd = getTargetWeekDate(session.end_ts);
                        return (
                          <li key={session.id}>
                            <span>
                              {dateFormatter.format(targetStart)}
                            </span>
                            {" · "}
                            {timeFormatter.format(targetStart)} –{" "}
                            {timeFormatter.format(targetEnd)}
                            {session.max_registrations != null
                              ? ` · ${session.max_registrations} places max`
                              : ""}
                          </li>
                        );
                      })}
                    </ul>
                    <Button
                      type="button"
                      onClick={handleCreateBatch}
                      disabled={batchCreating || !selectedActivityId}
                    >
                      {batchCreating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      créer {batchPreviewSessions.length} créneau
                      {batchPreviewSessions.length > 1 ? "x" : ""}
                    </Button>
                  </div>
                ) : null}
              </div>
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              <form
                onSubmit={handleCreateSession}
                className="grid gap-4 rounded-[16px] border border-black/10 p-5 md:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_auto] md:items-end"
              >
                <div className="grid gap-2">
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

                <div className="grid gap-2">
                  <Label htmlFor="visit-start">date et heure</Label>
                  <Input
                    id="visit-start"
                    type="datetime-local"
                    value={startValue}
                    onChange={(event) => setStartValue(event.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="visit-duration">durée (min)</Label>
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

                <div className="grid gap-2">
                  <Label htmlFor="visit-capacity">places max</Label>
                  <Input
                    id="visit-capacity"
                    type="number"
                    min="0"
                    value={maxRegistrations}
                    onChange={(event) =>
                      setMaxRegistrations(event.target.value)
                    }
                    placeholder="Illimité"
                  />
                </div>

                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  ajouter
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      ) : !activities.length ? (
        <p className="rounded-[16px] border border-dashed border-black/10 p-5 text-sm text-black/60">
          aucune activité de type visite n&apos;existe encore. créez-la pour
          pouvoir ajouter des créneaux de découverte.
        </p>
      ) : null}

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-black">créneaux à venir</h3>
        {upcomingSessions.length ? (
          <div className="space-y-4">{upcomingSessions.map(renderSession)}</div>
        ) : (
          <p className="rounded-[16px] border border-dashed border-black/10 p-5 text-sm text-black/60">
            aucun créneau de visite à venir.
          </p>
        )}
      </section>

      {pastSessions.length ? (
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-black">créneaux récents passés</h3>
          <div className="space-y-4">{pastSessions.map(renderSession)}</div>
        </section>
      ) : null}
    </div>
  );
}
