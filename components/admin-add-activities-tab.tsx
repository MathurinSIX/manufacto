"use client";

import { useEffect, useState } from "react";
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
import { Loader2, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type Activity = {
  id: string;
  name: string;
  nb_credits: number | null;
};

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

  const getWeekLabel = (offset: number): string => {
    const now = new Date();
    const currentDay = now.getDay();
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() - daysFromMonday);
    currentMonday.setHours(0, 0, 0, 0);
    
    const selectedWeekMonday = new Date(currentMonday);
    selectedWeekMonday.setDate(currentMonday.getDate() + offset * 7);
    
    const selectedWeekSunday = new Date(selectedWeekMonday);
    selectedWeekSunday.setDate(selectedWeekMonday.getDate() + 6);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
    
    // Get the Monday of the selected week
    const now = new Date();
    const currentDay = now.getDay();
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() - daysFromMonday);
    currentMonday.setHours(0, 0, 0, 0);
    
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
            <Button
              onClick={handlePreview}
              disabled={!selectedActivityId || loadingPreview}
              variant="outline"
            >
              {loadingPreview ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Prévisualiser
                </>
              )}
            </Button>
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

        {previewSessions.length > 0 && (
          <div className="mt-6 space-y-4">
            <h4 className="font-medium">Aperçu des sessions à créer :</h4>
            <div className="border rounded-lg divide-y">
              {previewSessions.map((session, index) => {
                const targetWeekStart = getTargetWeekDate(session.start_ts);
                const targetWeekEnd = getTargetWeekDate(session.end_ts);

                return (
                  <div key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {formatDate(targetWeekStart.toISOString())}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(targetWeekStart.toISOString())} - {formatTime(targetWeekEnd.toISOString())}
                        </p>
                        {session.max_registrations && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Max: {session.max_registrations} inscription{session.max_registrations > 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

            <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
              <p className="font-medium mb-2">Comment ça fonctionne ?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Sélectionnez une activité</li>
                <li>Sélectionnez la semaine dont vous souhaitez copier les sessions</li>
                <li>Cliquez sur "Prévisualiser" pour voir les sessions de la semaine sélectionnée</li>
                <li>Les nouvelles sessions seront créées pour la semaine suivante</li>
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
                <Input
                  id="manual-start-time"
                  type="time"
                  step="300"
                  value={manualStartTime}
                  onChange={(e) => setManualStartTime(e.target.value)}
                  required
                />
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
                <Button
                  onClick={generatePreview}
                  disabled={!manualActivityId || !manualStartTime || !manualDuration || selectedDays.length === 0}
                  variant="outline"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Prévisualiser
                </Button>
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

            {manualPreview.length > 0 && (
              <div className="mt-6 space-y-4">
                <h4 className="font-medium">Aperçu des sessions à créer ({manualPreview.length} session{manualPreview.length > 1 ? "s" : ""}) :</h4>
                <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                  {manualPreview.map((session, index) => (
                    <div key={index} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {new Date(session.date).toLocaleDateString("fr-FR", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {session.start} - {session.end}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

