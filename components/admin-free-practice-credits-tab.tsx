"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { getAllActivities, updateActivityCredits } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  COURSE_DISCIPLINE_OPTIONS,
  inferPracticeDiscipline,
  type CourseDiscipline,
} from "@/lib/course-disciplines";

type Activity = {
  id: string;
  name: string;
  nb_credits: number | null;
  type: string;
  discipline: string | null;
};

interface AdminFreePracticeCreditsTabProps {
  activityTypes: string[];
}

export function AdminFreePracticeCreditsTab({
  activityTypes,
}: AdminFreePracticeCreditsTabProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [creditDrafts, setCreditDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllActivities();
      if (result.error) {
        setError(result.error);
        return;
      }

      const filtered = (result.activities as Activity[]).filter((activity) =>
        activityTypes.includes(activity.type),
      );
      setActivities(filtered);
      setCreditDrafts(
        Object.fromEntries(
          filtered.map((activity) => [
            activity.id,
            activity.nb_credits?.toString() ?? "",
          ]),
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  }, [activityTypes]);

  useEffect(() => {
    void loadActivities();
  }, [loadActivities]);

  const activitiesByDiscipline = useMemo(() => {
    const grouped = new Map<CourseDiscipline, Activity[]>();
    for (const option of COURSE_DISCIPLINE_OPTIONS) {
      grouped.set(option.value, []);
    }

    for (const activity of activities) {
      const discipline = inferPracticeDiscipline(activity.name, activity.discipline);
      if (!discipline) continue;
      grouped.get(discipline)?.push(activity);
    }

    for (const list of grouped.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    }

    return COURSE_DISCIPLINE_OPTIONS.map((option) => ({
      discipline: option.value,
      label: option.label,
      activities: grouped.get(option.value) ?? [],
    })).filter((section) => section.activities.length > 0);
  }, [activities]);

  const handleSave = async (activity: Activity) => {
    const raw = creditDrafts[activity.id]?.trim() ?? "";
    const nb_credits = raw === "" ? null : parseFloat(raw);

    if (raw !== "" && Number.isNaN(nb_credits)) {
      setError("Le nombre de crédits doit être un nombre valide");
      return;
    }

    setSavingId(activity.id);
    setError(null);

    try {
      const result = await updateActivityCredits(activity.id, nb_credits);
      if (result.error) {
        setError(result.error);
        return;
      }

      setActivities((current) =>
        current.map((entry) =>
          entry.id === activity.id ? { ...entry, nb_credits } : entry,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setSavingId(null);
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
        <h3 className="text-lg font-semibold">pratique libre</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Modifiez le nombre de crédits par heure pour chaque offre de pratique libre.
        </p>
      </div>

      {error ? (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {activitiesByDiscipline.length === 0 ? (
        <div className="rounded-lg border py-8 text-center text-muted-foreground">
          Aucune offre de pratique libre trouvée
        </div>
      ) : (
        <div className="space-y-6">
          {activitiesByDiscipline.map(({ discipline, label, activities: sectionActivities }) => (
            <div key={discipline} className="overflow-hidden rounded-lg border">
              <div className="border-b bg-muted/50 px-4 py-3">
                <h4 className="font-semibold">{label}</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-4 text-left font-medium">Offre</th>
                      <th className="p-4 text-left font-medium">Crédits / heure</th>
                      <th className="p-4 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionActivities.map((activity) => {
                      const draft = creditDrafts[activity.id] ?? "";
                      const savedValue = activity.nb_credits?.toString() ?? "";
                      const hasChanges = draft !== savedValue;

                      return (
                        <tr key={activity.id} className="border-b hover:bg-muted/50">
                          <td className="p-4 font-medium">{activity.name}</td>
                          <td className="p-4">
                            <div className="grid max-w-[200px] gap-1">
                              <Label htmlFor={`credits-${activity.id}`} className="sr-only">
                                Crédits pour {activity.name}
                              </Label>
                              <Input
                                id={`credits-${activity.id}`}
                                type="number"
                                step="0.5"
                                min="0"
                                value={draft}
                                onChange={(event) =>
                                  setCreditDrafts((current) => ({
                                    ...current,
                                    [activity.id]: event.target.value,
                                  }))
                                }
                              />
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                size="sm"
                                disabled={!hasChanges || savingId === activity.id}
                                onClick={() => void handleSave(activity)}
                              >
                                {savingId === activity.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enregistrement...
                                  </>
                                ) : (
                                  "Enregistrer"
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
