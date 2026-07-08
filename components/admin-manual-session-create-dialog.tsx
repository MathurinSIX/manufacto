"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { createSession } from "@/app/admin/actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminWeekCalendarSession } from "@/components/admin-week-calendar";
import type { CalendarSlotSelection } from "@/components/admin-week-time-grid";
import {
  addParisCalendarDays,
  formatParisTime,
  getParisWeekMonday,
  getParisWeekdayIndex,
  PARIS_TIMEZONE,
  parseParisDateTime,
} from "@/lib/paris-time";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;

export type ManualCreateActivity = {
  id: string;
  name: string;
};

type UseAdminManualSessionCreateOptions = {
  activities: ManualCreateActivity[];
  weekOffset: number;
  allowManualRepeat?: boolean;
  isPracticeMode?: boolean;
  defaultActivityId?: string;
  onCreated?: () => void;
};

export function useAdminManualSessionCreate({
  activities,
  weekOffset,
  allowManualRepeat = false,
  isPracticeMode = false,
  defaultActivityId,
  onCreated,
}: UseAdminManualSessionCreateOptions) {
  const [manualActivityId, setManualActivityId] = useState(defaultActivityId ?? "");
  const [manualStartTime, setManualStartTime] = useState("");
  const [manualDuration, setManualDuration] = useState("60");
  const [manualMaxRegistrations, setManualMaxRegistrations] = useState("");
  const [repeatInterval, setRepeatInterval] = useState("");
  const [repeatTimes, setRepeatTimes] = useState("1");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [manualPreview, setManualPreview] = useState<
    Array<{ date: string; start: string; end: string }>
  >([]);
  const [creatingManual, setCreatingManual] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [slotSelection, setSlotSelection] = useState<CalendarSlotSelection | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionWord = isPracticeMode ? "créneau" : "session";
  const sessionWordPlural = isPracticeMode ? "créneaux" : "sessions";

  useEffect(() => {
    if (defaultActivityId) {
      setManualActivityId(defaultActivityId);
    }
  }, [defaultActivityId]);

  const activityNameById = useMemo(
    () => new Map(activities.map((activity) => [activity.id, activity.name])),
    [activities],
  );

  const previewSessions = useMemo((): AdminWeekCalendarSession[] => {
    return manualPreview.map((session, index) => ({
      id: `preview-${index}`,
      date: session.date,
      start: session.start,
      end: session.end,
      activity_id: manualActivityId || undefined,
      activity_name: manualActivityId
        ? activityNameById.get(manualActivityId)
        : undefined,
    }));
  }, [manualPreview, manualActivityId, activityNameById]);

  const generatePreview = useCallback(() => {
    if (!manualStartTime || !manualDuration || selectedDays.length === 0) {
      setManualPreview([]);
      return;
    }

    const preview: Array<{ date: string; start: string; end: string }> = [];
    const durationMinutes = parseInt(manualDuration, 10) || 60;
    const intervalMinutes = !allowManualRepeat
      ? durationMinutes
      : repeatInterval.trim() === ""
        ? durationMinutes
        : parseInt(repeatInterval, 10) || durationMinutes;
    const times = allowManualRepeat ? parseInt(repeatTimes, 10) || 1 : 1;
    const weekMonday = getParisWeekMonday(weekOffset);

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
  }, [
    allowManualRepeat,
    manualDuration,
    manualStartTime,
    repeatInterval,
    repeatTimes,
    selectedDays,
    weekOffset,
  ]);

  useEffect(() => {
    generatePreview();
  }, [generatePreview]);

  const handleToggleDay = (day: number) => {
    setSelectedDays((previous) =>
      previous.includes(day)
        ? previous.filter((value) => value !== day)
        : [...previous, day].sort(),
    );
  };

  const handleSelectCalendarSlot = useCallback(
    (selection: CalendarSlotSelection) => {
      setSlotSelection(selection);
      setManualStartTime(selection.startTime);
      setError(null);

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

      if (!manualActivityId && defaultActivityId) {
        setManualActivityId(defaultActivityId);
      }

      if (allowManualRepeat && !repeatInterval) {
        setRepeatInterval("60");
      }

      setManualModalOpen(true);
    },
    [allowManualRepeat, defaultActivityId, manualActivityId, repeatInterval],
  );

  const slotDateLabel = useMemo(() => {
    if (!slotSelection) return null;
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: PARIS_TIMEZONE,
    }).format(parseParisDateTime(slotSelection.date, "12:00"));
  }, [slotSelection]);

  const handleCreate = async () => {
    if (!manualActivityId || manualPreview.length === 0) return;

    setCreatingManual(true);
    setError(null);

    try {
      const maxReg =
        manualMaxRegistrations.trim() === ""
          ? null
          : parseInt(manualMaxRegistrations, 10);
      if (maxReg !== null && (Number.isNaN(maxReg) || maxReg < 0)) {
        setError("Le nombre maximum d'inscriptions doit être un nombre positif");
        setCreatingManual(false);
        return;
      }

      const results = await Promise.all(
        manualPreview.map((session) => {
          const startDateTime = parseParisDateTime(session.date, session.start);
          const endDateTime = parseParisDateTime(session.date, session.end);
          return createSession(
            manualActivityId,
            startDateTime.toISOString(),
            endDateTime.toISOString(),
            maxReg,
          );
        }),
      );

      const errors = results.filter((result) => result.error);
      if (errors.length > 0) {
        setError(`Erreur lors de la création: ${errors[0].error}`);
      } else {
        setManualModalOpen(false);
        setSlotSelection(null);
        setManualStartTime("");
        setManualPreview([]);
        setSelectedDays([]);
        onCreated?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setCreatingManual(false);
    }
  };

  return {
    previewSessions,
    selectedDays,
    onToggleDay: handleToggleDay,
    onSelectSlot: handleSelectCalendarSlot,
    dialog: (
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
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}

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
                    value={
                      manualStartTime ? manualStartTime.split(":")[0] || "00" : ""
                    }
                    onValueChange={(hour) => {
                      const currentMinute =
                        manualStartTime && manualStartTime.includes(":")
                          ? manualStartTime.split(":")[1]
                          : "00";
                      setManualStartTime(
                        `${hour.padStart(2, "0")}:${currentMinute.padStart(2, "0")}`,
                      );
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Heure" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                        <SelectItem
                          key={hour}
                          value={hour.toString().padStart(2, "0")}
                        >
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
                      setManualStartTime(
                        `${currentHour.padStart(2, "0")}:${minute.padStart(2, "0")}`,
                      );
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                        <SelectItem
                          key={minute}
                          value={minute.toString().padStart(2, "0")}
                        >
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
                  onChange={(event) => setManualDuration(event.target.value)}
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
                    onChange={(event) => setRepeatInterval(event.target.value)}
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
                    onChange={(event) => setRepeatTimes(event.target.value)}
                    required
                  />
                </div>
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label>Jours de la semaine *</Label>
              <div className="grid grid-cols-7 gap-2">
                {WEEKDAY_LABELS.map((day, index) => (
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
                onChange={(event) => setManualMaxRegistrations(event.target.value)}
                placeholder="Illimité"
              />
            </div>

            {manualPreview.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {manualPreview.length}{" "}
                {manualPreview.length > 1 ? sessionWordPlural : sessionWord} seront créé
                {manualPreview.length > 1 ? "s" : ""} sur {selectedDays.length} jour
                {selectedDays.length > 1 ? "s" : ""}.
              </p>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setManualModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
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
    ),
  };
}
