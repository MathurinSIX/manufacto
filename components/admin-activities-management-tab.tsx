"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "@/components/markdown-editor";
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
  uploadActivityImage,
} from "@/app/admin/actions";
import { Plus, Loader2, Pencil, Trash2, ChevronUp, ChevronDown, X } from "lucide-react";
import Image from "next/image";
import { DEFAULT_COURSE_IMAGE, resolveActivityImages } from "@/app/cours/course-data";
import {
  COURSE_DISCIPLINE_OPTIONS,
  formatCourseDiscipline,
  isCourseDiscipline,
} from "@/lib/course-disciplines";
import { SquareVariationPicker } from "@/components/square-variation-picker";
import type { SquareCatalogVariationOption } from "@/lib/square/catalog-api";

function priceFromSquareVariation(
  variationId: string,
  variations: SquareCatalogVariationOption[],
): number | null {
  const variation = variations.find((entry) => entry.id === variationId);
  if (variation?.amountCents == null) return null;
  return variation.amountCents / 100;
}

type Activity = {
  id: string;
  name: string;
  nb_credits: number | null;
  type: string;
  price: number | null;
  description: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  square_product_id: string | null;
  level: string | null;
  audience: string | null;
  discipline: string | null;
};

interface AdminActivitiesManagementTabProps {
  activityTypes?: string[];
}

export function AdminActivitiesManagementTab({
  activityTypes,
}: AdminActivitiesManagementTabProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [activityName, setActivityName] = useState("");
  const [activityDiscipline, setActivityDiscipline] = useState<string>("menuiserie");
  const [activityCredits, setActivityCredits] = useState<string>("");
  const [activityDescription, setActivityDescription] = useState("");
  const [activityImageUrls, setActivityImageUrls] = useState<string[]>([]);
  const [activitySquareProductId, setActivitySquareProductId] = useState("");
  const [squareVariations, setSquareVariations] = useState<SquareCatalogVariationOption[]>([]);
  const [activityLevel, setActivityLevel] = useState("");
  const [activityAudience, setActivityAudience] = useState("");

  // Group activities by discipline
  const activitiesByDiscipline = useMemo(() => {
    const grouped: Record<string, Activity[]> = {};
    activities.forEach((activity) => {
      const label = formatCourseDiscipline(activity.discipline) ?? "Sans discipline";
      if (!grouped[label]) {
        grouped[label] = [];
      }
      grouped[label].push(activity);
    });
    return grouped;
  }, [activities]);

  const linkedSquarePrice = useMemo(() => {
    if (!activitySquareProductId) return null;
    const fromCatalog = priceFromSquareVariation(activitySquareProductId, squareVariations);
    if (fromCatalog !== null) return fromCatalog;
    if (editingActivity?.square_product_id === activitySquareProductId) {
      return editingActivity.price;
    }
    return null;
  }, [activitySquareProductId, squareVariations, editingActivity]);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllActivities();
      if (result.error) {
        setError(result.error);
      } else {
        const activities = result.activities as Activity[];
        setActivities(
          activityTypes?.length
            ? activities.filter((activity) => activityTypes.includes(activity.type))
            : activities,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  }, [activityTypes]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const handleOpenDialog = (activity?: Activity) => {
    if (activity) {
      setEditingActivity(activity);
      setActivityName(activity.name);
      setActivityDiscipline(
        activity.discipline && isCourseDiscipline(activity.discipline)
          ? activity.discipline
          : "menuiserie",
      );
      setActivityCredits(activity.nb_credits?.toString() || "");
      setActivityDescription(activity.description || "");
      setActivityImageUrls(
        resolveActivityImages(activity.image_url, activity.image_urls).filter(
          (url) => url !== DEFAULT_COURSE_IMAGE,
        ),
      );
      setActivitySquareProductId(activity.square_product_id || "");
      setActivityLevel(activity.level || "");
      setActivityAudience(activity.audience || "");
    } else {
      setEditingActivity(null);
      setActivityName("");
      setActivityDiscipline("menuiserie");
      setActivityCredits("");
      setActivityDescription("");
      setActivityImageUrls([]);
      setActivitySquareProductId("");
      setActivityLevel("");
      setActivityAudience("");
    }
    setDialogOpen(true);
    setError(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingActivity(null);
    setActivityName("");
    setActivityDiscipline("menuiserie");
    setActivityCredits("");
    setActivityDescription("");
    setActivityImageUrls([]);
    setActivitySquareProductId("");
    setActivityLevel("");
    setActivityAudience("");
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const credits = activityCredits.trim() === "" ? null : parseFloat(activityCredits);
      const price = activitySquareProductId
        ? priceFromSquareVariation(activitySquareProductId, squareVariations) ??
          (editingActivity?.square_product_id === activitySquareProductId
            ? editingActivity.price
            : null)
        : null;

      if (isNaN(credits as number) && credits !== null) {
        setError("Le nombre de crédits doit être un nombre valide");
        setSaving(false);
        return;
      }

      const type = activityTypes?.[0] ?? "cours";
      const discipline = isCourseDiscipline(activityDiscipline)
        ? activityDiscipline
        : null;

      if (!discipline) {
        setError("La discipline est requise");
        setSaving(false);
        return;
      }

      const description = activityDescription.trim() === "" ? null : activityDescription.trim();
      const squareProductId = activitySquareProductId.trim() === "" ? null : activitySquareProductId.trim();
      const level = activityLevel.trim() === "" ? null : activityLevel.trim();
      const audience = activityAudience.trim() === "" ? null : activityAudience.trim();
      const imageUrls = activityImageUrls
        .map((url) => url.trim())
        .filter(Boolean);

      let result;
      if (editingActivity) {
        result = await updateActivity(
          editingActivity.id,
          activityName,
          credits,
          type,
          price,
          description,
          imageUrls,
          squareProductId,
          level,
          audience,
          discipline
        );
      } else {
        result = await createActivity(
          activityName,
          credits,
          type,
          price,
          description,
          imageUrls,
          squareProductId,
          level,
          audience,
          discipline
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

  const handleImageUpload = async (file: File | null) => {
    if (!file) {
      return;
    }

    setUploadingImage(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const result = await uploadActivityImage(formData);

      if (result.error || !result.path) {
        setError(result.error || "L'image n'a pas pu être téléversée");
        return;
      }

      setActivityImageUrls((current) => [...current, result.path!]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'image n'a pas pu être téléversée");
    } finally {
      setUploadingImage(false);
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
        <h3 className="text-lg font-semibold">liste des cours</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              ajouter un cours
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSave}>
              <DialogHeader>
                <DialogTitle>
                  {editingActivity ? "modifier l'activité" : "nouvelle activité"}
                </DialogTitle>
                <DialogDescription>
                  {editingActivity
                    ? "modifiez les informations de l'activité"
                    : "créez une nouvelle activité"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nom de l&apos;activité *</Label>
                  <Input
                    id="name"
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    required
                    placeholder="Ex: Initiation à la couture"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="discipline">Discipline *</Label>
                  <Select
                    value={activityDiscipline}
                    onValueChange={setActivityDiscipline}
                    required
                  >
                    <SelectTrigger id="discipline">
                      <SelectValue placeholder="Sélectionner une discipline" />
                    </SelectTrigger>
                    <SelectContent>
                      {COURSE_DISCIPLINE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <SquareVariationPicker
                  id="square-product-id"
                  label="Produit Square"
                  noneLabel="Aucun produit Square"
                  active={dialogOpen}
                  value={activitySquareProductId}
                  onChange={setActivitySquareProductId}
                  onVariationsLoaded={setSquareVariations}
                  description="Le prix en euros est synchronisé avec la variation Square sélectionnée."
                />
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
                    <div
                      id="price"
                      className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm"
                    >
                      {linkedSquarePrice !== null ? (
                        <span>{linkedSquarePrice.toFixed(2)} €</span>
                      ) : activitySquareProductId ? (
                        <span className="text-muted-foreground">
                          Prix non défini dans Square
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Sélectionnez un produit Square
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <MarkdownEditor
                    id="description"
                    value={activityDescription}
                    onChange={setActivityDescription}
                    placeholder={"Description de l'activité en Markdown...\n\nEx: **Objectif**\n- Apprendre les bases\n- Réaliser un objet"}
                    rows={7}
                  />
                  <p className="text-xs text-muted-foreground">
                    Markdown accepté: titres, gras, italique, listes et liens.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="level">Niveau</Label>
                    <Select value={activityLevel || undefined} onValueChange={setActivityLevel}>
                      <SelectTrigger id="level">
                        <SelectValue placeholder="Sélectionner un niveau" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Débutant.e">Débutant.e</SelectItem>
                        <SelectItem value="Avancé.e">Avancé.e</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="audience">Public</Label>
                    <Select value={activityAudience || undefined} onValueChange={setActivityAudience}>
                      <SelectTrigger id="audience">
                        <SelectValue placeholder="Sélectionner un public" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Adulte">Adulte</SelectItem>
                        <SelectItem value="Enfant (à partir de 6/7 ans)">
                          Enfant (à partir de 6/7 ans)
                        </SelectItem>
                        <SelectItem value="Adulte et enfant (à partir de 6/7 ans)">
                          Adulte et enfant (à partir de 6/7 ans)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="image">Images</Label>
                  <div className="space-y-3">
                    {activityImageUrls.length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {activityImageUrls.map((imageUrl, index) => (
                          <div
                            key={`${imageUrl}-${index}`}
                            className="overflow-hidden rounded-md border bg-muted"
                          >
                            <div className="relative h-32">
                              <Image
                                src={imageUrl}
                                alt={`Aperçu ${index + 1}`}
                                fill
                                sizes="(max-width: 768px) 100vw, 320px"
                                className="object-cover"
                              />
                            </div>
                            <div className="flex items-center justify-between gap-2 border-t bg-background p-2">
                              <p className="text-xs text-muted-foreground">
                                Photo {index + 1}
                                {index === 0 ? " · couverture" : ""}
                              </p>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8"
                                  disabled={index === 0}
                                  onClick={() => {
                                    setActivityImageUrls((current) => {
                                      const next = [...current];
                                      [next[index - 1], next[index]] = [next[index], next[index - 1]];
                                      return next;
                                    });
                                  }}
                                  aria-label="Monter la photo"
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8"
                                  disabled={index === activityImageUrls.length - 1}
                                  onClick={() => {
                                    setActivityImageUrls((current) => {
                                      const next = [...current];
                                      [next[index], next[index + 1]] = [next[index + 1], next[index]];
                                      return next;
                                    });
                                  }}
                                  aria-label="Descendre la photo"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setActivityImageUrls((current) =>
                                      current.filter((_, currentIndex) => currentIndex !== index),
                                    );
                                  }}
                                  aria-label="Supprimer la photo"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="relative h-32 overflow-hidden rounded-md border bg-muted">
                        <Image
                          src={DEFAULT_COURSE_IMAGE}
                          alt="Aperçu par défaut"
                          fill
                          sizes="(max-width: 768px) 100vw, 640px"
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <Input
                    id="image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(event) => {
                      void handleImageUpload(event.target.files?.[0] ?? null);
                      event.target.value = "";
                    }}
                    disabled={uploadingImage}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ajoutez une ou plusieurs photos. La première image sert de couverture dans la liste des cours.
                  </p>
                  {uploadingImage && (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Téléversement de l&apos;image...
                    </p>
                  )}
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
                <Button type="submit" disabled={saving || uploadingImage}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingActivity ? "Modification..." : "Création..."}
                    </>
                  ) : (
                    editingActivity ? "modifier" : "créer"
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

      {/* Grouped by discipline */}
      {Object.keys(activitiesByDiscipline).length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          Aucune activité trouvée
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(activitiesByDiscipline).map(([discipline, disciplineActivities]) => (
            <div key={discipline} className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-3 border-b">
                <h4 className="font-semibold text-lg">{discipline}</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Nom</th>
                      <th className="text-left p-4 font-medium">Discipline</th>
                      <th className="text-left p-4 font-medium">Description</th>
                      <th className="text-left p-4 font-medium">Niveau</th>
                      <th className="text-left p-4 font-medium">Public</th>
                      <th className="text-left p-4 font-medium">Crédits</th>
                      <th className="text-left p-4 font-medium">Prix</th>
                      <th className="text-left p-4 font-medium">Square</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disciplineActivities.map((activity) => (
                      <tr key={activity.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">{activity.name}</td>
                        <td className="p-4">
                          {formatCourseDiscipline(activity.discipline) ?? (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground max-w-md">
                          {activity.description ? (
                            <p className="line-clamp-2">{activity.description}</p>
                          ) : (
                            <span className="text-muted-foreground/50">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          {activity.level ? (
                            <span>{activity.level}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          {activity.audience ? (
                            <span>{activity.audience}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
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
                          {activity.square_product_id ? (
                            <span className="text-sm text-green-700">Configuré</span>
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
