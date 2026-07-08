"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createActivitiesBatchMulti,
  getWeekSessionsForActivities,
  createSession,
} from "@/app/admin/actions";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  addParisCalendarDays,
  formatParisDate,
  formatParisTime,
  getParisWeekMonday,
  getParisWeekdayIndex,
  PARIS_TIMEZONE,
  parseParisDateTime,
  shiftParisTimestampByWeeks,
} from "@/lib/paris-time";
import { AdminWeekNavigator } from "@/components/admin-week-navigator";
import { AdminWeekCalendar } from "@/components/admin-week-calendar";
import { AdminWeekTimeGrid, type CalendarSlotSelection } from "@/components/admin-week-time-grid";
import { cn } from "@/lib/utils";

type Activity = {
  id: string;
  name: string;
  nb_credits: number | null;
  type: string | null;
  square_product_id: string | null;
  discipline: string | null;
};

const DISCOVERY_PACK_ACTIVITY_TYPE = "pack_decouverte";
const DISCOVERY_PACK_DISCIPLINE_ORDER = ["couture", "menuiserie"] as const;
const MANUAL_WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;
const PRACTICE_ACTIVITY_TYPES = new Set([
  "autonomie",
  "autonomie_encadree",
  "accompagnement",
  "cuisson",
]);

type WeekSessionRow = {
  id: string;
  start_ts: string;
  end_ts: string;
  activity_id: string;
  max_registrations: number | null;
};

interface AdminAddActivitiesTabProps {
  activityTypes?: string[];
  allowManualRepeat?: boolean;
  initialTargetWeekOffset?: number;
  initialActivityId?: string;
  onSessionsCreated?: () => void;
  mode?: "copy" | "all";
}

export function AdminAddActivitiesTab({
  activityTypes,
  allowManualRepeat = false,
  initialTargetWeekOffset = 0,
  initialActivityId,
  onSessionsCreated,
  mode = "all",
}: AdminAddActivitiesTabProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedWeekOffset, setSelectedWeekOffset] = useState<number>(-1);
  const [targetWeekOffset, setTargetWeekOffset] = useState<number>(initialTargetWeekOffset);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [showCopyNextWeek, setShowCopyNextWeek] = useState(false);
  const [weekSessions, setWeekSessions] = useState<WeekSessionRow[]>([]);
  const [selectedActivityIds, setSelectedActivityIds] = useState<Set<string>>(new Set());
  const [loadingPreview, setLoadingPreview] = useState(false);
  const initialSelectionAppliedRef = useRef(false);
  const [manualActivityId, setManualActivityId] = useState<string>(initialActivityId ?? "");
  const [manualWeekOffset, setManualWeekOffset] = useState<number>(initialTargetWeekOffset);
  const [manualStartTime, setManualStartTime] = useState<string>("");
  const [manualDuration, setManualDuration] = useState<string>("60"); // Duration in minutes
  const [manualMaxRegistrations, setManualMaxRegistrations] = useState<string>("");
  const [repeatInterval, setRepeatInterval] = useState<string>(""); // Repeat every X minutes (empty = use duration)
  const [repeatTimes, setRepeatTimes] = useState<string>("1");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [manualPreview, setManualPreview] = useState<Array<{date: string, start: string, end: string}>>([]);
  const [creatingManual, setCreatingManual] = useState(false);
  const [manualWeekSessions, setManualWeekSessions] = useState<WeekSessionRow[]>([]);
  const [loadingManualWeek, setLoadingManualWeek] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [slotSelection, setSlotSelection] = useState<CalendarSlotSelection | null>(null);
  const isDiscoveryPackMode =
    activityTypes?.length === 1 &&
    activityTypes[0] === DISCOVERY_PACK_ACTIVITY_TYPE;
  const isPracticeMode =
    activityTypes?.some((type) => PRACTICE_ACTIVITY_TYPES.has(type)) ?? false;
  const sessionWord = isPracticeMode ? "créneau" : "session";
  const sessionWordPlural = isPracticeMode ? "créneaux" : "sessions";

  useEffect(() => {
    setTargetWeekOffset(initialTargetWeekOffset);
    setManualWeekOffset(initialTargetWeekOffset);
  }, [initialTargetWeekOffset]);

  useEffect(() => {
    if (initialActivityId) {
      setManualActivityId(initialActivityId);
    }
  }, [initialActivityId]);

  useEffect(() => {
    const loadActivities = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("activity")
          .select("id, name, nb_credits, type, square_product_id, discipline")
          .is("deleted_at", null)
          .order("name");

        if (error) {
          setError(error.message);
        } else {
          const filteredActivities = (data || []).filter((activity) => {
            if (isDiscoveryPackMode) {
              return (
                activity.type === DISCOVERY_PACK_ACTIVITY_TYPE &&
                DISCOVERY_PACK_DISCIPLINE_ORDER.includes(
                  activity.discipline as (typeof DISCOVERY_PACK_DISCIPLINE_ORDER)[number],
                )
              );
            }

            if (activity.type === "cours") {
              return activityTypes?.includes("cours") ?? false;
            }

            return activityTypes?.length
              ? activity.type ? activityTypes.includes(activity.type) : false
              : true;
          });
          setActivities(
            isDiscoveryPackMode
              ? filteredActivities.sort((a, b) => {
                  const leftIndex = DISCOVERY_PACK_DISCIPLINE_ORDER.indexOf(
                    a.discipline as (typeof DISCOVERY_PACK_DISCIPLINE_ORDER)[number],
                  );
                  const rightIndex = DISCOVERY_PACK_DISCIPLINE_ORDER.indexOf(
                    b.discipline as (typeof DISCOVERY_PACK_DISCIPLINE_ORDER)[number],
                  );
                  const normalizedLeftIndex = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
                  const normalizedRightIndex = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
                  return normalizedLeftIndex - normalizedRightIndex || a.name.localeCompare(b.name, "fr");
                })
              : filteredActivities,
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur s'est produite");
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [activityTypes, isDiscoveryPackMode]);

  // Sync repeat interval with duration when duration changes (if repeat interval is empty)
  useEffect(() => {
    if (repeatInterval.trim() === "" && manualDuration) {
      // Don't update state here to avoid infinite loop, just let the preview use duration
    }
    generatePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualWeekOffset, manualStartTime, manualDuration, repeatInterval, repeatTimes, selectedDays]);

  const activityNameById = useMemo(
    () => new Map(activities.map((activity) => [activity.id, activity.name])),
    [activities],
  );

  const loadWeekSessions = useCallback(async () => {
    if (activities.length === 0) return;

    setLoadingPreview(true);
    setError(null);

    try {
      const result = await getWeekSessionsForActivities(
        activities.map((activity) => activity.id),
        selectedWeekOffset,
      );

      if (result.error) {
        setError(result.error);
        setWeekSessions([]);
        setSelectedActivityIds(new Set());
        return;
      }

      const sessions = result.sessions as WeekSessionRow[];
      setWeekSessions(sessions);

      const idsWithSessions = new Set(sessions.map((session) => session.activity_id));

      if (
        !initialSelectionAppliedRef.current &&
        initialActivityId &&
        idsWithSessions.has(initialActivityId)
      ) {
        setSelectedActivityIds(new Set([initialActivityId]));
        initialSelectionAppliedRef.current = true;
      } else {
        setSelectedActivityIds(idsWithSessions);
      }

      if (sessions.length === 0) {
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
      setWeekSessions([]);
      setSelectedActivityIds(new Set());
    } finally {
      setLoadingPreview(false);
    }
  }, [activities, initialActivityId, selectedWeekOffset]);

  // Load all sessions when source week changes
  useEffect(() => {
    if (activities.length > 0) {
      loadWeekSessions();
    }
  }, [activities, loadWeekSessions]);

  const loadManualWeekSessions = useCallback(async () => {
    if (activities.length === 0) return;

    setLoadingManualWeek(true);
    try {
      const result = await getWeekSessionsForActivities(
        activities.map((activity) => activity.id),
        manualWeekOffset,
      );
      if (result.error) {
        setManualWeekSessions([]);
      } else {
        setManualWeekSessions(result.sessions as WeekSessionRow[]);
      }
    } catch {
      setManualWeekSessions([]);
    } finally {
      setLoadingManualWeek(false);
    }
  }, [activities, manualWeekOffset]);

  useEffect(() => {
    if (activities.length > 0) {
      loadManualWeekSessions();
    }
  }, [activities, loadManualWeekSessions]);

  const sourceEqualsTarget = selectedWeekOffset === targetWeekOffset;

  const activitiesInWeek = useMemo(() => {
    const activityMap = new Map(activities.map((activity) => [activity.id, activity]));
    const groups = new Map<string, WeekSessionRow[]>();

    for (const session of weekSessions) {
      const existing = groups.get(session.activity_id) ?? [];
      existing.push(session);
      groups.set(session.activity_id, existing);
    }

    return Array.from(groups.entries())
      .map(([activityId, sessions]) => ({
        activity: activityMap.get(activityId)!,
        sessions: sessions.sort(
          (left, right) =>
            new Date(left.start_ts).getTime() - new Date(right.start_ts).getTime(),
        ),
      }))
      .filter((group) => group.activity)
      .sort((left, right) => left.activity.name.localeCompare(right.activity.name, "fr"));
  }, [weekSessions, activities]);

  const selectedSessions = useMemo(
    () => weekSessions.filter((session) => selectedActivityIds.has(session.activity_id)),
    [weekSessions, selectedActivityIds],
  );

  const toggleActivitySelection = (activityId: string) => {
    setSelectedActivityIds((previous) => {
      const next = new Set(previous);
      if (next.has(activityId)) {
        next.delete(activityId);
      } else {
        next.add(activityId);
      }
      return next;
    });
  };

  const selectAllActivities = () => {
    setSelectedActivityIds(new Set(activitiesInWeek.map((group) => group.activity.id)));
  };

  const deselectAllActivities = () => {
    setSelectedActivityIds(new Set());
  };

  const handleCreateBatch = async () => {
    if (selectedSessions.length === 0 || sourceEqualsTarget) return;

    setCreating(true);
    setError(null);
    setSuccess(null);
    setWarning(null);
    setShowCopyNextWeek(false);

    try {
      const result = await createActivitiesBatchMulti(
        Array.from(selectedActivityIds),
        selectedWeekOffset,
        targetWeekOffset,
      );
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(
          `${result.created} session${result.created > 1 ? "s" : ""} créée${result.created > 1 ? "s" : ""} avec succès`,
        );
        if (result.warning) {
          setWarning(result.warning);
        }
        setShowCopyNextWeek(true);
        await loadWeekSessions();
        onSessionsCreated?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setCreating(false);
    }
  };

  const handleCopyToNextWeek = () => {
    setTargetWeekOffset((prev) => prev + 1);
    setSuccess(null);
    setWarning(null);
    setShowCopyNextWeek(false);
  };

  const toSourcePreviewSession = (session: WeekSessionRow) => ({
    id: session.id,
    date: formatParisDate(new Date(session.start_ts)),
    start: formatParisTime(new Date(session.start_ts)),
    end: formatParisTime(new Date(session.end_ts)),
    max_registrations: session.max_registrations,
    activity_id: session.activity_id,
    activity_name: activityNameById.get(session.activity_id),
  });

  const toTargetPreviewSession = (session: WeekSessionRow) => {
    const weeksAhead = targetWeekOffset - selectedWeekOffset;
    const targetStart = shiftParisTimestampByWeeks(session.start_ts, weeksAhead);
    const targetEnd = shiftParisTimestampByWeeks(session.end_ts, weeksAhead);
    return {
      id: session.id,
      date: formatParisDate(new Date(targetStart)),
      start: formatParisTime(new Date(targetStart)),
      end: formatParisTime(new Date(targetEnd)),
      max_registrations: session.max_registrations,
      activity_id: session.activity_id,
      activity_name: activityNameById.get(session.activity_id),
    };
  };

  const sourceCalendarSessions = useMemo(
    () => weekSessions.map(toSourcePreviewSession),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weekSessions, activityNameById],
  );

  const targetCalendarSessions = useMemo(
    () => selectedSessions.map(toTargetPreviewSession),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedSessions, targetWeekOffset, selectedWeekOffset, activityNameById],
  );

  const activityLegend = useMemo(
    () =>
      activitiesInWeek.map(({ activity, sessions }) => ({
        id: activity.id,
        name: activity.name,
        sessionCount: sessions.length,
      })),
    [activitiesInWeek],
  );

  const activityColorIds = useMemo(
    () => activityLegend.map((item) => item.id),
    [activityLegend],
  );

  const selectedActivityLegend = useMemo(
    () => activityLegend.filter((item) => selectedActivityIds.has(item.id)),
    [activityLegend, selectedActivityIds],
  );

  const manualCalendarSessions = useMemo(
    () =>
      manualPreview.map((session, index) => ({
        id: `preview-${index}`,
        date: session.date,
        start: session.start,
        end: session.end,
        activity_id: manualActivityId || undefined,
        activity_name: manualActivityId
          ? activityNameById.get(manualActivityId)
          : undefined,
      })),
    [manualPreview, manualActivityId, activityNameById],
  );

  const manualExistingCalendarSessions = useMemo(
    () =>
      manualWeekSessions.map((session) => ({
        id: session.id,
        date: formatParisDate(new Date(session.start_ts)),
        start: formatParisTime(new Date(session.start_ts)),
        end: formatParisTime(new Date(session.end_ts)),
        activity_id: session.activity_id,
        activity_name: activityNameById.get(session.activity_id),
        max_registrations: session.max_registrations,
      })),
    [manualWeekSessions, activityNameById],
  );

  const manualActivityColorIds = useMemo(
    () => activities.map((activity) => activity.id),
    [activities],
  );

  const generatePreview = () => {
    if (!manualStartTime || !manualDuration || selectedDays.length === 0) {
      setManualPreview([]);
      return;
    }

    const preview: Array<{date: string, start: string, end: string}> = [];
    const durationMinutes = parseInt(manualDuration) || 60;
    const intervalMinutes = !allowManualRepeat
      ? durationMinutes
      : repeatInterval.trim() === ""
        ? durationMinutes
        : parseInt(repeatInterval) || durationMinutes;
    const times = allowManualRepeat ? parseInt(repeatTimes) || 1 : 1;

    const weekMonday = getParisWeekMonday(manualWeekOffset);

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const dateStr = addParisCalendarDays(weekMonday, dayOffset);
      const normalizedDay = getParisWeekdayIndex(parseParisDateTime(dateStr, "12:00"));

      if (selectedDays.includes(normalizedDay)) {
        let currentStart = parseParisDateTime(dateStr, manualStartTime);

        for (let i = 0; i < times; i++) {
          const sessionStart = new Date(currentStart);
          const sessionEnd = new Date(
            sessionStart.getTime() + durationMinutes * 60 * 1000,
          );

          preview.push({
            date: dateStr,
            start: formatParisTime(sessionStart),
            end: formatParisTime(sessionEnd),
          });

          currentStart = new Date(
            sessionStart.getTime() + intervalMinutes * 60 * 1000,
          );
        }
      }
    }
    
    setManualPreview(preview);
  };

  const handleToggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const handleSelectCalendarSlot = useCallback((selection: CalendarSlotSelection) => {
    setSlotSelection(selection);
    setManualStartTime(selection.startTime);

    const [startHour, startMinute] = selection.startTime.split(":").map(Number);
    const [endHour, endMinute] = selection.endTime.split(":").map(Number);
    const durationMinutes =
      endHour * 60 + endMinute - (startHour * 60 + startMinute);
    if (durationMinutes >= 15) {
      setManualDuration(String(durationMinutes));
    }

    setSelectedDays((previous) =>
      previous.includes(selection.dayIndex)
        ? previous
        : [...previous, selection.dayIndex].sort(),
    );

    if (!manualActivityId && initialActivityId) {
      setManualActivityId(initialActivityId);
    }

    if (allowManualRepeat && !repeatInterval) {
      setRepeatInterval("60");
    }

    setManualModalOpen(true);
  }, [allowManualRepeat, initialActivityId, manualActivityId, repeatInterval]);

  const slotDateLabel = useMemo(() => {
    if (!slotSelection) return null;
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: PARIS_TIMEZONE,
    }).format(parseParisDateTime(slotSelection.date, "12:00"));
  }, [slotSelection]);

  const handleCreateManualSession = async () => {
    if (!manualActivityId || manualPreview.length === 0) return;
    
    setCreatingManual(true);
    setError(null);
    setSuccess(null);
    
    try {
      const maxReg = manualMaxRegistrations.trim() === "" ? null : parseInt(manualMaxRegistrations);
      if (maxReg !== null && (Number.isNaN(maxReg) || maxReg < 0)) {
        setError("Le nombre maximum d'inscriptions doit être un nombre positif");
        setCreatingManual(false);
        return;
      }
      
      // Create all sessions
      const results = await Promise.all(
        manualPreview.map(session => {
          const startDateTime = parseParisDateTime(session.date, session.start);
          const endDateTime = parseParisDateTime(session.date, session.end);
          return createSession(
            manualActivityId,
            startDateTime.toISOString(),
            endDateTime.toISOString(),
            maxReg
          );
        })
      );
      
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        setError(`Erreur lors de la création: ${errors[0].error}`);
      } else {
        setSuccess(`${manualPreview.length} session${manualPreview.length > 1 ? "s" : ""} créée${manualPreview.length > 1 ? "s" : ""} avec succès`);
        setManualActivityId("");
        setManualWeekOffset(0);
        setManualStartTime("");
        setManualDuration("60");
        setManualMaxRegistrations("");
        setRepeatInterval("");
        setRepeatTimes("1");
        setSelectedDays([]);
        setManualPreview([]);
        await loadManualWeekSessions();
        setManualModalOpen(false);
        setSlotSelection(null);
        onSessionsCreated?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setCreatingManual(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", mode === "all" && "border-t pt-8")}>
      <div>
        <h3 className="text-lg font-semibold mb-2">
          {mode === "copy"
            ? "Recopier des semaines complètes"
            : isPracticeMode
              ? "ajouter des créneaux"
              : "ajouter des sessions"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {mode === "copy"
            ? isPracticeMode
              ? "Sélectionnez une semaine source, choisissez les activités et copiez les créneaux vers une semaine cible."
              : "Sélectionnez une semaine source et copiez les sessions vers une semaine cible."
            : isPracticeMode
              ? "Naviguez semaine par semaine, visualisez le calendrier horaire et créez ou copiez des créneaux d'ouverture."
              : "Naviguez semaine par semaine, visualisez le calendrier et créez ou copiez des sessions."}
        </p>
      </div>

      {error && (
        <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="space-y-2">
          <div className="text-sm text-green-600 p-4 bg-green-50 rounded-md">
            {success}
          </div>
          {warning ? (
            <div className="text-sm text-amber-700 p-4 bg-amber-50 rounded-md">
              {warning}
            </div>
          ) : null}
          {showCopyNextWeek && selectedActivityIds.size > 0 ? (
            <Button type="button" variant="outline" onClick={handleCopyToNextWeek}>
              Copier vers la semaine suivante
            </Button>
          ) : null}
        </div>
      )}

      <Tabs defaultValue="batch" className="w-full">
        {mode === "all" ? (
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="batch">Par copie</TabsTrigger>
            <TabsTrigger value="manual">Manuelle</TabsTrigger>
          </TabsList>
        ) : null}

        <TabsContent value="batch" className="space-y-4">
          <div className="space-y-6">
            <AdminWeekNavigator
              label="Semaine source"
              hint={
                isPracticeMode
                  ? "naviguez pour voir tous les créneaux de la semaine"
                  : "naviguez pour voir toutes les sessions de la semaine"
              }
              weekOffset={selectedWeekOffset}
              onWeekOffsetChange={setSelectedWeekOffset}
              id="source-week"
            />

            {loadingPreview ? (
              <div className="flex items-center justify-center gap-2 rounded-lg border py-16 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Chargement du calendrier…
              </div>
            ) : isPracticeMode ? (
              <AdminWeekTimeGrid
                weekOffset={selectedWeekOffset}
                existingSessions={sourceCalendarSessions}
                activityColorIds={activityColorIds}
                activityLegend={activityLegend}
                selectedActivityIds={selectedActivityIds}
                onToggleActivity={toggleActivitySelection}
                onSelectAllActivities={selectAllActivities}
                onDeselectAllActivities={deselectAllActivities}
              />
            ) : (
              <AdminWeekCalendar
                weekOffset={selectedWeekOffset}
                sessions={sourceCalendarSessions}
                emptyDayLabel="Aucune session"
                selectedActivityIds={selectedActivityIds}
                activityLegend={activityLegend}
                activityColorIds={activityColorIds}
                onToggleActivity={toggleActivitySelection}
                onSelectAllActivities={selectAllActivities}
                onDeselectAllActivities={deselectAllActivities}
              />
            )}

            <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
              <AdminWeekNavigator
                label="Semaine cible"
                hint="aperçu de ce qui sera créé"
                weekOffset={targetWeekOffset}
                onWeekOffsetChange={setTargetWeekOffset}
                id="target-week"
              />

              {sourceEqualsTarget ? (
                <p className="text-sm text-destructive">
                  La semaine source et la semaine cible doivent être différentes.
                </p>
              ) : null}

              {!loadingPreview && selectedSessions.length > 0 ? (
                isPracticeMode ? (
                  <AdminWeekTimeGrid
                    weekOffset={targetWeekOffset}
                    previewSessions={targetCalendarSessions}
                    title="Aperçu semaine cible"
                    activityColorIds={activityColorIds}
                    activityLegend={selectedActivityLegend}
                    legendReadOnly
                  />
                ) : (
                  <AdminWeekCalendar
                    weekOffset={targetWeekOffset}
                    sessions={targetCalendarSessions}
                    title="Aperçu semaine cible"
                    emptyDayLabel="—"
                    sessionVariant="target"
                    minDayHeight="min-h-[160px]"
                    activityColorIds={activityColorIds}
                    activityLegend={selectedActivityLegend}
                    legendReadOnly
                  />
                )
              ) : !loadingPreview ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Sélectionnez des activités dans le calendrier source pour voir l&apos;aperçu.
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {selectedSessions.length > 0 && !sourceEqualsTarget && (
                  <Button
                    onClick={handleCreateBatch}
                    disabled={creating || selectedActivityIds.size === 0}
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      `Créer ${selectedSessions.length} ${selectedSessions.length > 1 ? sessionWordPlural : sessionWord} (${selectedActivityIds.size} activité${selectedActivityIds.size > 1 ? "s" : ""})`
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {mode === "all" ? (
        <TabsContent value="manual" className="space-y-4">
          <div className="space-y-4">
            <AdminWeekNavigator
              label="Semaine"
              weekOffset={manualWeekOffset}
              onWeekOffsetChange={setManualWeekOffset}
              id="manual-week"
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
                previewSessions={manualCalendarSessions}
                activityColorIds={manualActivityColorIds}
                selectedDays={selectedDays}
                onToggleDay={handleToggleDay}
                selectable
                onSelectSlot={handleSelectCalendarSlot}
              />
            )}
          </div>

          <Dialog open={manualModalOpen} onOpenChange={setManualModalOpen}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {isPracticeMode ? "Nouveau créneau" : "Nouvelle session"}
                </DialogTitle>
                <DialogDescription>
                  {slotDateLabel && manualStartTime
                    ? `${slotDateLabel} · ${manualStartTime} (${manualDuration} min)`
                    : isPracticeMode
                      ? "Configurez le créneau à créer"
                      : "Configurez la session à créer"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="manual-activity">Activité *</Label>
                  <Select value={manualActivityId} onValueChange={setManualActivityId}>
                    <SelectTrigger id="manual-activity">
                      <SelectValue placeholder="Sélectionner une activité" />
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
                    <Label htmlFor="manual-start-time">Heure de début *</Label>
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
                          {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                            <SelectItem key={minute} value={minute.toString().padStart(2, "0")}>
                              {minute.toString().padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="manual-duration">Durée (minutes) *</Label>
                    <Input
                      id="manual-duration"
                      type="number"
                      min="15"
                      step="15"
                      value={manualDuration}
                      onChange={(e) => setManualDuration(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {allowManualRepeat ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="repeat-interval">Répéter toutes les (min)</Label>
                      <Input
                        id="repeat-interval"
                        type="number"
                        min="0"
                        step="15"
                        value={repeatInterval}
                        onChange={(e) => setRepeatInterval(e.target.value)}
                        placeholder={manualDuration || "60"}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="repeat-times">Nombre de créneaux</Label>
                      <Input
                        id="repeat-times"
                        type="number"
                        min="1"
                        value={repeatTimes}
                        onChange={(e) => setRepeatTimes(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-2">
                  <Label>Jours de la semaine *</Label>
                  <div className="grid grid-cols-7 gap-2">
                    {MANUAL_WEEKDAY_LABELS.map((day, index) => (
                      <div key={day} className="flex flex-col items-center gap-1">
                        <Checkbox
                          id={`modal-day-${index}`}
                          checked={selectedDays.includes(index)}
                          onCheckedChange={() => handleToggleDay(index)}
                        />
                        <Label
                          htmlFor={`modal-day-${index}`}
                          className="text-xs font-normal cursor-pointer"
                        >
                          {day}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="manual-max-registrations">Places max</Label>
                  <Input
                    id="manual-max-registrations"
                    type="number"
                    min="0"
                    value={manualMaxRegistrations}
                    onChange={(e) => setManualMaxRegistrations(e.target.value)}
                    placeholder="Illimité"
                  />
                </div>

                {manualPreview.length > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {manualPreview.length} {manualPreview.length > 1 ? sessionWordPlural : sessionWord}{" "}
                    seront créé{manualPreview.length > 1 ? "s" : ""} sur {selectedDays.length} jour
                    {selectedDays.length > 1 ? "s" : ""}.
                  </p>
                ) : null}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setManualModalOpen(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={handleCreateManualSession}
                  disabled={
                    creatingManual ||
                    !manualActivityId ||
                    manualPreview.length === 0 ||
                    selectedDays.length === 0
                  }
                >
                  {creatingManual ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    `Créer ${manualPreview.length} ${manualPreview.length > 1 ? sessionWordPlural : sessionWord}`
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}

