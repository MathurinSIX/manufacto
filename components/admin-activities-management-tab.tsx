"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAllActivities,
  createActivity,
  updateActivity,
  deleteActivity,
} from "@/app/admin/actions";
import { Plus, Loader2, Pencil, Trash2 } from "lucide-react";

type Activity = {
  id: string;
  name: string;
  nb_credits: number | null;
  type: string;
  price: number | null;
  description: string | null;
};

export function AdminActivitiesManagementTab() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [activityName, setActivityName] = useState("");
  const [activityCredits, setActivityCredits] = useState<string>("");
  const [activityType, setActivityType] = useState<string>("cours");
  const [activityPrice, setActivityPrice] = useState<string>("");
  const [activityDescription, setActivityDescription] = useState("");

  // Group activities by type
  const activitiesByType = useMemo(() => {
    const grouped: Record<string, Activity[]> = {};
    activities.forEach((activity) => {
      const type = activity.type || "Sans type";
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(activity);
    });
    return grouped;
  }, [activities]);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllActivities();
      if (result.error) {
        setError(result.error);
      } else {
        setActivities(result.activities as Activity[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const handleOpenDialog = (activity?: Activity) => {
    if (activity) {
      setEditingActivity(activity);
      setActivityName(activity.name);
      setActivityCredits(activity.nb_credits?.toString() || "");
      setActivityType(activity.type || "cours");
      setActivityPrice(activity.price?.toString() || "");
      setActivityDescription(activity.description || "");
    } else {
      setEditingActivity(null);
      setActivityName("");
      setActivityCredits("");
      setActivityType("cours");
      setActivityPrice("");
      setActivityDescription("");
    }
    setDialogOpen(true);
    setError(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingActivity(null);
    setActivityName("");
    setActivityCredits("");
    setActivityType("");
    setActivityPrice("");
    setActivityDescription("");
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const credits = activityCredits.trim() === "" ? null : parseFloat(activityCredits);
      const price = activityPrice.trim() === "" ? null : parseFloat(activityPrice);
      
      if (isNaN(credits as number) && credits !== null) {
        setError("Le nombre de crédits doit être un nombre valide");
        setSaving(false);
        return;
      }

      if (isNaN(price as number) && price !== null) {
        setError("Le prix doit être un nombre valide");
        setSaving(false);
        return;
      }

      const type = activityType.trim();
      
      if (!type) {
        setError("Le type est requis");
        setSaving(false);
        return;
      }
      const description = activityDescription.trim() === "" ? null : activityDescription.trim();

      let result;
      if (editingActivity) {
        result = await updateActivity(
          editingActivity.id,
          activityName,
          credits,
          type,
          price,
          description
        );
      } else {
        result = await createActivity(
          activityName,
          credits,
          type,
          price,
          description
        );
      }

      if (result.error) {
        setError(result.error);
      } else {
        handleCloseDialog();
        await loadActivities();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (activity: Activity) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'activité "${activity.name}" ?`)) {
      return;
    }

    setError(null);
    try {
      const result = await deleteActivity(activity.id);
      if (result.error) {
        setError(result.error);
      } else {
        await loadActivities();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Liste des activités</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une activité
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSave}>
              <DialogHeader>
                <DialogTitle>
                  {editingActivity ? "Modifier l'activité" : "Nouvelle activité"}
                </DialogTitle>
                <DialogDescription>
                  {editingActivity
                    ? "Modifiez les informations de l'activité"
                    : "Créez une nouvelle activité"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nom de l'activité *</Label>
                  <Input
                    id="name"
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    required
                    placeholder="Ex: Couture en Autonomie"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select value={activityType} onValueChange={setActivityType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cours">Cours</SelectItem>
                      <SelectItem value="autonomie">Autonomie</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Sélectionnez le type d'activité
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="credits">Nombre de crédits</Label>
                    <Input
                      id="credits"
                      type="number"
                      step="0.5"
                      min="0"
                      value={activityCredits}
                      onChange={(e) => setActivityCredits(e.target.value)}
                      placeholder="Laisser vide si aucun crédit requis"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Prix (€)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={activityPrice}
                      onChange={(e) => setActivityPrice(e.target.value)}
                      placeholder="Prix en euros"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={activityDescription}
                    onChange={(e) => setActivityDescription(e.target.value)}
                    placeholder="Description de l'activité..."
                    rows={4}
                  />
                </div>
              </div>
              {error && (
                <div className="text-sm text-destructive mb-4">{error}</div>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingActivity ? "Modification..." : "Création..."}
                    </>
                  ) : (
                    editingActivity ? "Modifier" : "Créer"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && !dialogOpen && (
        <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {/* Grouped by type */}
      {Object.keys(activitiesByType).length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          Aucune activité trouvée
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(activitiesByType).map(([type, typeActivities]) => (
            <div key={type} className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-3 border-b">
                <h4 className="font-semibold text-lg capitalize">{type}</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Nom</th>
                      <th className="text-left p-4 font-medium">Description</th>
                      <th className="text-left p-4 font-medium">Crédits</th>
                      <th className="text-left p-4 font-medium">Prix</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {typeActivities.map((activity) => (
                      <tr key={activity.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">{activity.name}</td>
                        <td className="p-4 text-sm text-muted-foreground max-w-md">
                          {activity.description ? (
                            <p className="line-clamp-2">{activity.description}</p>
                          ) : (
                            <span className="text-muted-foreground/50">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          {activity.nb_credits !== null ? (
                            <span>{activity.nb_credits}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          {activity.price !== null ? (
                            <span>{activity.price.toFixed(2)} €</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDialog(activity)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(activity)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
