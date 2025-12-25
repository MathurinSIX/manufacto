"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createActivitiesBatch, getPreviousWeekSessions, createSession } from "@/app/admin/actions";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const PARIS_TIMEZONE = "Europe/Paris";

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

// Helper function to get Monday of a week in Paris timezone
function getMondayInParis(date: Date): Date {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parseInt(parts.find(p => p.type === "year")!.value);
  const month = parseInt(parts.find(p => p.type === "month")!.value) - 1;
  const day = parseInt(parts.find(p => p.type === "day")!.value);
  const d = new Date(year, month, day);
  const dayOfWeek = d.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  d.setDate(d.getDate() - daysFromMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

type Activity = {
  id: string;
  name: string;
  nb_credits: number | null;
};

type PreviewSession = {
  date: string;
  start: string;
  end: string;
  max_registrations?: number | null;
};

interface WeekCalendarPreviewProps {
  sessions: PreviewSession[];
  weekOffset: number;
}

function WeekCalendarPreview({ sessions, weekOffset }: WeekCalendarPreviewProps) {
  const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  
  // Calculate the Monday of the selected week in Paris timezone
  const weekDays = useMemo(() => {
    const now = getNowInParis();
    const currentMonday = getMondayInParis(now);
    
    const selectedWeekMonday = new Date(currentMonday);
    selectedWeekMonday.setDate(currentMonday.getDate() + weekOffset * 7);
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(selectedWeekMonday);
      date.setDate(selectedWeekMonday.getDate() + i);
      return date;
    });
  }, [weekOffset]);

  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, PreviewSession[]>();
    sessions.forEach(session => {
      const dateKey = session.date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(session);
    });
    return map;
  }, [sessions]);

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: PARIS_TIMEZONE,
  });

  const formatDayLabel = (date: Date) => {
    return dateFormatter.format(date);
  };

  return (
    <div className="border rounded-lg p-4 bg-background">
      <div className="grid grid-cols-7 gap-2 items-start">
        {WEEKDAY_LABELS.map((label, index) => {
          const day = weekDays[index];
          const dateKey = formatDateKey(day);
          const daySessions = sessionsByDate.get(dateKey) || [];
          const isToday = formatDateKey(getNowInParis()) === dateKey;

          return (
            <div
              key={index}
              className={cn(
                "flex flex-col w-full rounded-md border p-2 text-sm transition-colors",
                isToday && "ring-2 ring-primary bg-primary/5",
                daySessions.length > 0 && "bg-primary/5 border-primary/20",
                daySessions.length === 0 && "bg-muted/30"
              )}
            >
              <div className="mb-2 border-b pb-1 flex-shrink-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  {label}
                </p>
                <p className="text-sm font-medium">
                  {formatDayLabel(day)}
                </p>
              </div>
              <div className="space-y-1 w-full">
                {daySessions.length > 0 ? (
                  daySessions.map((session, sessionIndex) => (
                    <div
                      key={sessionIndex}
                      className="text-xs bg-primary/20 text-primary-foreground rounded px-2 py-1.5 border border-primary/30 w-full"
                    >
                      <p className="font-medium">
                        {session.start} - {session.end}
                      </p>
                      {session.max_registrations && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Max: {session.max_registrations}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground/50 italic">Aucune session</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AdminAddActivitiesTab() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");
  const [selectedWeekOffset, setSelectedWeekOffset] = useState<number>(-1);
  const [targetWeekOffset, setTargetWeekOffset] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewSessions, setPreviewSessions] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [manualActivityId, setManualActivityId] = useState<string>("");
  const [manualWeekOffset, setManualWeekOffset] = useState<number>(0);
  const [manualStartTime, setManualStartTime] = useState<string>("");
  const [manualDuration, setManualDuration] = useState<string>("60"); // Duration in minutes
  const [manualMaxRegistrations, setManualMaxRegistrations] = useState<string>("");
  const [repeatInterval, setRepeatInterval] = useState<string>(""); // Repeat every X minutes (empty = use duration)
  const [repeatTimes, setRepeatTimes] = useState<string>("1");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [manualPreview, setManualPreview] = useState<Array<{date: string, start: string, end: string}>>([]);
  const [creatingManual, setCreatingManual] = useState(false);

  useEffect(() => {
    const loadActivities = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("activity")
          .select("id, name, nb_credits")
          .order("name");

        if (error) {
          setError(error.message);
        } else {
          setActivities(data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur s'est produite");
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, []);

  // Sync repeat interval with duration when duration changes (if repeat interval is empty)
  useEffect(() => {
    if (repeatInterval.trim() === "" && manualDuration) {
      // Don't update state here to avoid infinite loop, just let the preview use duration
    }
    generatePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualWeekOffset, manualStartTime, manualDuration, repeatInterval, repeatTimes, selectedDays]);

  // Auto-preview for batch tab when activity and week are selected
  useEffect(() => {
    if (selectedActivityId && selectedWeekOffset !== undefined) {
      handlePreview();
    } else {
      setPreviewSessions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedActivityId, selectedWeekOffset]);

  const shortDateFormatter = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: PARIS_TIMEZONE,
  });

  const getWeekLabel = (offset: number): string => {
    const now = getNowInParis();
    const currentMonday = getMondayInParis(now);
    
    const selectedWeekMonday = new Date(currentMonday);
    selectedWeekMonday.setDate(currentMonday.getDate() + offset * 7);
    
    const selectedWeekSunday = new Date(selectedWeekMonday);
    selectedWeekSunday.setDate(selectedWeekMonday.getDate() + 6);
    
    const formatDate = (date: Date) => {
      return shortDateFormatter.format(date);
    };
    
    if (offset === 0) {
      return `Cette semaine (${formatDate(selectedWeekMonday)} - ${formatDate(selectedWeekSunday)})`;
    } else if (offset === -1) {
      return `Semaine précédente (${formatDate(selectedWeekMonday)} - ${formatDate(selectedWeekSunday)})`;
    } else if (offset > 0) {
      return `Dans ${offset} semaine${offset > 1 ? "s" : ""} (${formatDate(selectedWeekMonday)} - ${formatDate(selectedWeekSunday)})`;
    } else {
      return `${Math.abs(offset)} semaines précédentes (${formatDate(selectedWeekMonday)} - ${formatDate(selectedWeekSunday)})`;
    }
  };

  const handlePreview = async () => {
    if (!selectedActivityId) return;

    setLoadingPreview(true);
    setError(null);
    setPreviewSessions([]);

    try {
      const result = await getPreviousWeekSessions(selectedActivityId, selectedWeekOffset);
      if (result.error) {
        setError(result.error);
      } else {
        setPreviewSessions(result.sessions);
        if (result.sessions.length === 0) {
          setError(`Aucune session trouvée dans la semaine sélectionnée pour cette activité`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleCreateBatch = async () => {
    if (!selectedActivityId) return;

    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await createActivitiesBatch(selectedActivityId, selectedWeekOffset, targetWeekOffset);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(`${result.created} session${result.created > 1 ? "s" : ""} créée${result.created > 1 ? "s" : ""} avec succès`);
        setPreviewSessions([]);
        setSelectedActivityId("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setCreating(false);
    }
  };

  const fullDateFormatter = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: PARIS_TIMEZONE,
  });

  const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PARIS_TIMEZONE,
  });

  const formatDate = (dateString: string) => {
    return fullDateFormatter.format(new Date(dateString));
  };

  const formatTime = (dateString: string) => {
    return timeFormatter.format(new Date(dateString));
  };

  const getTargetWeekDate = (dateString: string) => {
    const date = new Date(dateString);
    // Calculate how many weeks ahead to create the new sessions
    const weeksAhead = targetWeekOffset - selectedWeekOffset;
    const weekInMs = weeksAhead * 7 * 24 * 60 * 60 * 1000;
    return new Date(date.getTime() + weekInMs);
  };

  const generatePreview = () => {
    if (!manualStartTime || !manualDuration || selectedDays.length === 0) {
      setManualPreview([]);
      return;
    }

    const preview: Array<{date: string, start: string, end: string}> = [];
    const [startHours, startMinutes] = manualStartTime.split(':').map(Number);
    const durationMinutes = parseInt(manualDuration) || 60;
    const intervalMinutes = repeatInterval.trim() === "" ? durationMinutes : parseInt(repeatInterval) || durationMinutes;
    const times = parseInt(repeatTimes) || 1;
    
    // Get the Monday of the selected week in Paris timezone
    const now = getNowInParis();
    const currentMonday = getMondayInParis(now);
    
    const selectedWeekMonday = new Date(currentMonday);
    selectedWeekMonday.setDate(currentMonday.getDate() + manualWeekOffset * 7);
    
    // Process each day of the selected week
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = new Date(selectedWeekMonday);
      currentDate.setDate(selectedWeekMonday.getDate() + dayOffset);
      
      const dayOfWeek = currentDate.getDay();
      const normalizedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      // Check if this day is selected
      if (selectedDays.includes(normalizedDay)) {
        // Create sessions for this day
        let currentTime = new Date(currentDate);
        currentTime.setHours(startHours, startMinutes, 0, 0);
        
        for (let i = 0; i < times; i++) {
          const sessionStart = new Date(currentTime);
          const sessionEnd = new Date(sessionStart);
          sessionEnd.setMinutes(sessionEnd.getMinutes() + durationMinutes);
          
          preview.push({
            date: sessionStart.toISOString().split('T')[0],
            start: `${sessionStart.getHours().toString().padStart(2, '0')}:${sessionStart.getMinutes().toString().padStart(2, '0')}`,
            end: `${sessionEnd.getHours().toString().padStart(2, '0')}:${sessionEnd.getMinutes().toString().padStart(2, '0')}`
          });
          
          // Move to next session start time within the same day
          currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes);
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
          const startDateTime = new Date(`${session.date}T${session.start}:00`);
          const endDateTime = new Date(`${session.date}T${session.end}:00`);
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Ajouter des sessions</h3>
        <p className="text-sm text-muted-foreground">
          Créez des sessions manuellement ou par lot en copiant celles d'une semaine spécifique.
        </p>
      </div>

      {error && (
        <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-green-600 p-4 bg-green-50 rounded-md">
          {success}
        </div>
      )}

      <Tabs defaultValue="batch" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="batch">Par copie</TabsTrigger>
          <TabsTrigger value="manual">Manuelle</TabsTrigger>
        </TabsList>
        
        <TabsContent value="batch" className="space-y-4">
          <div className="border rounded-lg p-6 space-y-4">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="activity">Activité</Label>
            <Select value={selectedActivityId} onValueChange={setSelectedActivityId}>
              <SelectTrigger>
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

          <div className="grid gap-2">
            <Label htmlFor="week">Semaine à copier</Label>
            <Select 
              value={selectedWeekOffset.toString()} 
              onValueChange={(value) => setSelectedWeekOffset(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une semaine" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 8 }, (_, i) => -(i + 1)).map((offset) => (
                  <SelectItem key={offset} value={offset.toString()}>
                    {getWeekLabel(offset)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Sélectionnez la semaine dont vous souhaitez copier les sessions
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="target-week">Semaine cible</Label>
            <Select 
              value={targetWeekOffset.toString()} 
              onValueChange={(value) => setTargetWeekOffset(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une semaine" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 8 }, (_, i) => i - 1).map((offset) => (
                  <SelectItem key={offset} value={offset.toString()}>
                    {getWeekLabel(offset)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Sélectionnez la semaine où créer les nouvelles sessions
            </p>
          </div>

          <div className="flex gap-2">
            {loadingPreview && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement de l'aperçu...
              </div>
            )}
            {previewSessions.length > 0 && (
              <Button
                onClick={handleCreateBatch}
                disabled={creating || !selectedActivityId}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  `Créer ${previewSessions.length} session${previewSessions.length > 1 ? "s" : ""}`
                )}
              </Button>
            )}
          </div>
        </div>

        {(loadingPreview || previewSessions.length > 0) && (
          <div className="mt-6 space-y-4">
            {loadingPreview ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement de l'aperçu...
              </div>
            ) : previewSessions.length > 0 ? (
              <>
                <h4 className="font-medium">Aperçu des sessions à créer :</h4>
                <WeekCalendarPreview sessions={previewSessions.map((session) => {
                  const targetWeekStart = getTargetWeekDate(session.start_ts);
                  const targetWeekEnd = getTargetWeekDate(session.end_ts);
                  return {
                    date: targetWeekStart.toISOString().split('T')[0],
                    start: formatTime(targetWeekStart.toISOString()),
                    end: formatTime(targetWeekEnd.toISOString()),
                    max_registrations: session.max_registrations,
                  };
                })} weekOffset={targetWeekOffset} />
              </>
            ) : null}
          </div>
        )}

            <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
              <p className="font-medium mb-2">Comment ça fonctionne ?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Sélectionnez une activité</li>
                <li>Sélectionnez la semaine dont vous souhaitez copier les sessions</li>
                <li>L'aperçu des sessions s'affiche automatiquement ci-dessous</li>
                <li>Les nouvelles sessions seront créées pour la semaine cible sélectionnée</li>
                <li>Cliquez sur "Créer" pour créer toutes les sessions en une fois</li>
              </ul>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="manual" className="space-y-4">
          <div className="border rounded-lg p-6 space-y-4">
            <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="manual-activity">Activité *</Label>
              <Select value={manualActivityId} onValueChange={setManualActivityId}>
                <SelectTrigger>
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
            <div className="grid gap-2">
              <Label htmlFor="manual-week">Semaine *</Label>
              <Select 
                value={manualWeekOffset.toString()} 
                onValueChange={(value) => setManualWeekOffset(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une semaine" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 8 }, (_, i) => i - 1).map((offset) => (
                    <SelectItem key={offset} value={offset.toString()}>
                      {getWeekLabel(offset)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Sélectionnez la semaine où créer les sessions
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="manual-start-time">Heure de début *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={manualStartTime ? (manualStartTime.split(':')[0] || "00") : ""}
                    onValueChange={(hour) => {
                      const currentMinute = manualStartTime && manualStartTime.includes(':') ? manualStartTime.split(':')[1] : "00";
                      setManualStartTime(`${hour.padStart(2, '0')}:${currentMinute.padStart(2, '0')}`);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Heure" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                        <SelectItem key={hour} value={hour.toString().padStart(2, '0')}>
                          {hour.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={manualStartTime && manualStartTime.includes(':') ? (manualStartTime.split(':')[1] || "00") : ""}
                    onValueChange={(minute) => {
                      const currentHour = manualStartTime && manualStartTime.includes(':') ? manualStartTime.split(':')[0] : "00";
                      setManualStartTime(`${currentHour.padStart(2, '0')}:${minute.padStart(2, '0')}`);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Minute" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                        <SelectItem key={minute} value={minute.toString().padStart(2, '0')}>
                          {minute.toString().padStart(2, '0')}
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
            <div className="grid grid-cols-2 gap-4 items-start">
              <div className="grid gap-2">
                <Label htmlFor="repeat-interval">Répéter toutes les (minutes) *</Label>
                <Input
                  id="repeat-interval"
                  type="number"
                  min="0"
                  step="15"
                  value={repeatInterval}
                  onChange={(e) => setRepeatInterval(e.target.value)}
                  placeholder={manualDuration || "60"}
                />
                <p className="text-xs text-muted-foreground">
                  Laissez vide pour utiliser la durée de la session ({manualDuration || "60"} min)
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repeat-times">Pour (fois) *</Label>
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
            <div className="grid gap-2">
              <Label>Jours de la semaine *</Label>
              <div className="grid grid-cols-7 gap-2">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${index}`}
                      checked={selectedDays.includes(index)}
                      onCheckedChange={() => handleToggleDay(index)}
                    />
                    <Label htmlFor={`day-${index}`} className="text-sm font-normal cursor-pointer">
                      {day}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Sélectionnez les jours où cette séquence de sessions sera répétée
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manual-max-registrations">Nombre maximum d'inscriptions</Label>
              <Input
                id="manual-max-registrations"
                type="number"
                min="0"
                value={manualMaxRegistrations}
                onChange={(e) => setManualMaxRegistrations(e.target.value)}
                placeholder="Illimité si vide"
              />
              <p className="text-xs text-muted-foreground">
                Laissez vide pour un nombre illimité d'inscriptions
              </p>
            </div>

              <div className="flex gap-2">
                {manualPreview.length > 0 && (
                  <Button
                    onClick={handleCreateManualSession}
                    disabled={creatingManual || !manualActivityId || manualPreview.length === 0}
                  >
                    {creatingManual ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      `Créer ${manualPreview.length} session${manualPreview.length > 1 ? "s" : ""}`
                    )}
                  </Button>
                )}
              </div>
            </div>

            {(manualActivityId && manualStartTime && manualDuration && selectedDays.length > 0) && (
              <div className="mt-6 space-y-4">
                {manualPreview.length > 0 ? (
                  <>
                    <h4 className="font-medium">Aperçu des sessions à créer ({manualPreview.length} session{manualPreview.length > 1 ? "s" : ""}) :</h4>
                    <WeekCalendarPreview sessions={manualPreview.map(s => ({ ...s, max_registrations: null }))} weekOffset={manualWeekOffset} />
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                    Aucune session à prévisualiser. Vérifiez que tous les champs requis sont remplis.
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

