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
import { createActivitiesBatch, getPreviousWeekSessions } from "@/app/admin/actions";
import { Loader2, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Activity = {
  id: string;
  name: string;
  nb_credits: number | null;
};

export function AdminAddActivitiesTab() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewSessions, setPreviewSessions] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

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

  const handlePreview = async () => {
    if (!selectedActivityId) return;

    setLoadingPreview(true);
    setError(null);
    setPreviewSessions([]);

    try {
      const result = await getPreviousWeekSessions(selectedActivityId);
      if (result.error) {
        setError(result.error);
      } else {
        setPreviewSessions(result.sessions);
        if (result.sessions.length === 0) {
          setError("Aucune session trouvée dans la semaine précédente pour cette activité");
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
      const result = await createActivitiesBatch(selectedActivityId);
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

  const getNextWeekDate = (dateString: string) => {
    const date = new Date(dateString);
    const weekInMs = 7 * 24 * 60 * 60 * 1000;
    return new Date(date.getTime() + weekInMs);
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
        <h3 className="text-lg font-semibold mb-2">Ajouter des sessions par lot</h3>
        <p className="text-sm text-muted-foreground">
          Créez automatiquement des sessions pour la semaine prochaine en vous basant sur les sessions de la semaine précédente.
        </p>
      </div>

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

        {previewSessions.length > 0 && (
          <div className="mt-6 space-y-4">
            <h4 className="font-medium">Aperçu des sessions à créer (semaine prochaine) :</h4>
            <div className="border rounded-lg divide-y">
              {previewSessions.map((session, index) => {
                const nextWeekStart = getNextWeekDate(session.start_ts);
                const nextWeekEnd = getNextWeekDate(session.end_ts);

                return (
                  <div key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {formatDate(nextWeekStart.toISOString())}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(nextWeekStart.toISOString())} - {formatTime(nextWeekEnd.toISOString())}
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
      </div>

      <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
        <p className="font-medium mb-2">Comment ça fonctionne ?</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Sélectionnez une activité</li>
          <li>Cliquez sur "Prévisualiser" pour voir les sessions de la semaine précédente</li>
          <li>Les nouvelles sessions seront créées pour la semaine prochaine (7 jours plus tard)</li>
          <li>Cliquez sur "Créer" pour créer toutes les sessions en une fois</li>
        </ul>
      </div>
    </div>
  );
}

