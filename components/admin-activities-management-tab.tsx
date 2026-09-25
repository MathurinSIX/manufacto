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
  getActivityInterestCounts,
  createActivity,
  updateActivity,
  deleteActivity,
  uploadActivityImage,
  getUpcomingSessionsForActivity,
  createSessionsForActivity,
  deleteSession,
} from "@/app/admin/actions";
import { Plus, Loader2, Pencil, Trash2, ChevronUp, ChevronDown, X } from "lucide-react";
import Image from "next/image";
import { CourseImageCarousel } from "@/components/course-image-carousel";
import { DEFAULT_COURSE_IMAGE, resolveActivityImages } from "@/app/cours/course-data";
import {
  COURSE_DISCIPLINE_OPTIONS,
  formatCourseDiscipline,
  isCourseDiscipline,
  normalizeActivityDisciplines,
} from "@/lib/course-disciplines";
import { SquareVariationPicker } from "@/components/square-variation-picker";
import type { SquareCatalogVariationOption } from "@/lib/square/catalog-api";
import {
  formatParisTime,
  parseParisDateTime,
} from "@/lib/paris-time";
import { Checkbox } from "@/components/ui/checkbox";

type DraftSessionSlot = {
  key: string;
  date: string;
  startTime: string;
  endTime: string;
  maxRegistrations: string;
};

type ExistingSession = {
  id: string;
  start_ts: string;
  end_ts: string;
  max_registrations: number | null;
  session_group_id?: string | null;
};

function createEmptySlot(): DraftSessionSlot {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: "",
    startTime: "14:00",
    endTime: "17:00",
    maxRegistrations: "",
  };
}

function formatExistingSessionLabel(session: ExistingSession) {
  const start = new Date(session.start_ts);
  const end = new Date(session.end_ts);
  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  }).format(start);

  return `${dateLabel} - ${formatParisTime(start)} / ${formatParisTime(end)}`;
}
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
  disciplines?: string[] | null;
};

function ActivityImageCarousel({ activity }: { activity: Activity }) {
  const images = resolveActivityImages(activity.image_url, activity.image_urls);
  const hasCustomImages = images.some((url) => url !== DEFAULT_COURSE_IMAGE);

  if (!hasCustomImages) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  return (
    <div className="relative h-20 w-28 overflow-hidden rounded-md border bg-muted">
      <CourseImageCarousel
        images={images}
        alt={activity.name}
        compact
        sizes="112px"
      />
    </div>
  );
}

interface AdminActivitiesManagementTabProps {
  activityTypes?: string[];
}

export function AdminActivitiesManagementTab({
  activityTypes,
}: AdminActivitiesManagementTabProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [interestCounts, setInterestCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [activityName, setActivityName] = useState("");
  const [activityDisciplines, setActivityDisciplines] = useState<string[]>([
    "menuiserie",
  ]);
  const [activityCredits, setActivityCredits] = useState<string>("");
  const [activityDescription, setActivityDescription] = useState("");
  const [activityImageUrls, setActivityImageUrls] = useState<string[]>([]);
  const [activitySquareProductId, setActivitySquareProductId] = useState("");
  const [squareVariations, setSquareVariations] = useState<SquareCatalogVariationOption[]>([]);
  const [activityLevel, setActivityLevel] = useState("");
  const [activityAudience, setActivityAudience] = useState("");
  const [draftSlots, setDraftSlots] = useState<DraftSessionSlot[]>([]);
  const [groupDraftSlotsAsMultiDay, setGroupDraftSlotsAsMultiDay] = useState(false);
  const [existingSessions, setExistingSessions] = useState<ExistingSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  // Group activities by primary discipline
  const activitiesByDiscipline = useMemo(() => {
    const grouped: Record<string, Activity[]> = {};
    activities.forEach((activity) => {
      const keys = normalizeActivityDisciplines(
        activity.discipline,
        activity.disciplines,
      );
      const label =
        formatCourseDiscipline(keys[0] ?? activity.discipline) ?? "Sans discipline";
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
      const [result, interestResult] = await Promise.all([
        getAllActivities(),
        getActivityInterestCounts(),
      ]);

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

      if (interestResult.error) {
        setError((current) => current ?? interestResult.error);
      } else {
        setInterestCounts(interestResult.counts);
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

  const handleOpenDialog = async (activity?: Activity) => {
    setDraftSlots([createEmptySlot()]);
    setExistingSessions([]);
    setDeletingSessionId(null);
    setGroupDraftSlotsAsMultiDay(false);

    if (activity) {
      setEditingActivity(activity);
      setActivityName(activity.name);
      const keys = normalizeActivityDisciplines(
        activity.discipline,
        activity.disciplines,
      );
      setActivityDisciplines(keys.length > 0 ? keys : ["menuiserie"]);
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
      setDialogOpen(true);
      setError(null);
      setLoadingSessions(true);
      try {
        const sessionsResult = await getUpcomingSessionsForActivity(activity.id);
        if (sessionsResult.error) {
          setError(sessionsResult.error);
        } else {
          setExistingSessions(sessionsResult.sessions);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger les dates");
      } finally {
        setLoadingSessions(false);
      }
    } else {
      setEditingActivity(null);
      setActivityName("");
      setActivityDisciplines(["menuiserie"]);
      setActivityCredits("");
      setActivityDescription("");
      setActivityImageUrls([]);
      setActivitySquareProductId("");
      setActivityLevel("");
      setActivityAudience("");
      setDialogOpen(true);
      setError(null);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingActivity(null);
    setActivityName("");
    setActivityDisciplines(["menuiserie"]);
    setActivityCredits("");
    setActivityDescription("");
    setActivityImageUrls([]);
    setActivitySquareProductId("");
    setActivityLevel("");
    setActivityAudience("");
    setDraftSlots([createEmptySlot()]);
    setGroupDraftSlotsAsMultiDay(false);
    setExistingSessions([]);
    setDeletingSessionId(null);
    setError(null);
  };

  const toggleDiscipline = (value: string) => {
    setActivityDisciplines((current) => {
      if (current.includes(value)) {
        if (current.length === 1) return current;
        return current.filter((entry) => entry !== value);
      }
      return [...current, value];
    });
  };

  const updateDraftSlot = (
    key: string,
    patch: Partial<Omit<DraftSessionSlot, "key">>,
  ) => {
    setDraftSlots((current) =>
      current.map((slot) => (slot.key === key ? { ...slot, ...patch } : slot)),
    );
  };

  const handleDeleteExistingSession = async (sessionId: string) => {
    if (!confirm("Supprimer cette date du cours ?")) {
      return;
    }

    setDeletingSessionId(sessionId);
    setError(null);
    try {
      const result = await deleteSession(sessionId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setExistingSessions((current) =>
        current.filter((session) => session.id !== sessionId),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer la date");
    } finally {
      setDeletingSessionId(null);
    }
  };

  const buildSlotsToCreate = () => {
    const slotsToCreate: Array<{
      start_ts: string;
      end_ts: string;
      max_registrations: number | null;
    }> = [];

    for (const [index, slot] of draftSlots.entries()) {
      if (!slot.date) {
        continue;
      }

      if (!slot.startTime || !slot.endTime) {
        throw new Error(`Les horaires sont requis pour la ligne ${index + 1}`);
      }

      const start = parseParisDateTime(slot.date, slot.startTime);
      const end = parseParisDateTime(slot.date, slot.endTime);
      if (end <= start) {
        throw new Error(
          `L'heure de fin doit être après l'heure de début (ligne ${index + 1})`,
        );
      }

      const maxRegistrations =
        slot.maxRegistrations.trim() === ""
          ? null
          : parseInt(slot.maxRegistrations, 10);
      if (
        maxRegistrations !== null &&
        (Number.isNaN(maxRegistrations) || maxRegistrations < 0)
      ) {
        throw new Error(
          `Le nombre max d'inscriptions doit être un nombre positif (ligne ${index + 1})`,
        );
      }

      slotsToCreate.push({
        start_ts: start.toISOString(),
        end_ts: end.toISOString(),
        max_registrations: maxRegistrations,
      });
    }

    return slotsToCreate;
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
      const disciplines = activityDisciplines.filter(isCourseDiscipline);

      if (disciplines.length === 0) {
        setError("Au moins une discipline est requise");
        setSaving(false);
        return;
      }

      const discipline = disciplines[0];
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
          discipline,
          disciplines,
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
          discipline,
          disciplines,
        );
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      const activityId = editingActivity?.id ?? result.activity?.id;
      let slotsToCreate: ReturnType<typeof buildSlotsToCreate> = [];
      try {
        slotsToCreate = buildSlotsToCreate();
      } catch (slotError) {
        setError(
          slotError instanceof Error
            ? slotError.message
            : "Dates invalides",
        );
        return;
      }

      if (activityId && slotsToCreate.length > 0) {
        const sessionsResult = await createSessionsForActivity(
          activityId,
          slotsToCreate,
          {
            groupAsMultiDay:
              groupDraftSlotsAsMultiDay && slotsToCreate.length > 1,
          },
        );
        if (sessionsResult.error && sessionsResult.created === 0) {
          setError(sessionsResult.error);
          await loadActivities();
          return;
        }
        if (sessionsResult.error) {
          setError(sessionsResult.error);
        }
      }

      handleCloseDialog();
      await loadActivities();
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
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            if (open) {
              setDialogOpen(true);
            } else {
              handleCloseDialog();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => void handleOpenDialog()}>
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
                  <Label>Disciplines / univers *</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {COURSE_DISCIPLINE_OPTIONS.map((option) => {
                      const checked = activityDisciplines.includes(option.value);
                      return (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleDiscipline(option.value)}
                          />
                          {option.label}
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sélectionnez un ou plusieurs univers pour ce cours.
                  </p>
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
                        <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
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
                  <div className="flex items-center justify-between gap-2">
                    <Label>Dates et horaires</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDraftSlots((current) => [...current, createEmptySlot()])
                      }
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Ajouter une date
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Chaque ligne est une date réservable, avec son propre
                    horaire. Laissez la case décochée pour que les dates restent
                    indépendantes sur le même cours.
                  </p>

                  {draftSlots.filter((slot) => slot.date).length > 1 ||
                  draftSlots.length > 1 ? (
                    <label className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm">
                      <Checkbox
                        checked={groupDraftSlotsAsMultiDay}
                        onCheckedChange={(value) =>
                          setGroupDraftSlotsAsMultiDay(value === true)
                        }
                        className="mt-0.5"
                      />
                      <span>
                        Regrouper ces dates en une seule session multi-jours
                        (Session 01, etc.)
                      </span>
                    </label>
                  ) : null}

                  {editingActivity && (
                    <div className="space-y-2 rounded-md border p-3">
                      <p className="text-sm font-medium">Dates déjà planifiées</p>
                      {loadingSessions ? (
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Chargement des dates...
                        </p>
                      ) : existingSessions.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Aucune date à venir pour ce cours.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {existingSessions.map((session) => (
                            <li
                              key={session.id}
                              className="flex items-center justify-between gap-2 text-sm"
                            >
                              <span className="capitalize">
                                {formatExistingSessionLabel(session)}
                              </span>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 shrink-0"
                                disabled={deletingSessionId === session.id}
                                onClick={() =>
                                  void handleDeleteExistingSession(session.id)
                                }
                                aria-label="Supprimer cette date"
                              >
                                {deletingSessionId === session.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {draftSlots.length > 0 ? (
                    <div className="space-y-3">
                      {draftSlots.map((slot, index) => (
                        <div
                          key={slot.key}
                          className="grid gap-2 rounded-md border p-3"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">
                              Date {index + 1}
                              {editingActivity ? " (nouvelle)" : ""}
                            </p>
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() =>
                                setDraftSlots((current) =>
                                  current.filter((entry) => entry.key !== slot.key),
                                )
                              }
                              aria-label="Retirer cette date"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="grid gap-1">
                              <Label htmlFor={`slot-date-${slot.key}`}>Date</Label>
                              <Input
                                id={`slot-date-${slot.key}`}
                                type="date"
                                value={slot.date}
                                onChange={(event) =>
                                  updateDraftSlot(slot.key, {
                                    date: event.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="grid gap-1">
                              <Label htmlFor={`slot-max-${slot.key}`}>
                                Max inscriptions
                              </Label>
                              <Input
                                id={`slot-max-${slot.key}`}
                                type="number"
                                min="0"
                                value={slot.maxRegistrations}
                                onChange={(event) =>
                                  updateDraftSlot(slot.key, {
                                    maxRegistrations: event.target.value,
                                  })
                                }
                                placeholder="Illimité"
                              />
                            </div>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="grid gap-1">
                              <Label htmlFor={`slot-start-${slot.key}`}>Début</Label>
                              <Input
                                id={`slot-start-${slot.key}`}
                                type="time"
                                value={slot.startTime}
                                onChange={(event) =>
                                  updateDraftSlot(slot.key, {
                                    startTime: event.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="grid gap-1">
                              <Label htmlFor={`slot-end-${slot.key}`}>Fin</Label>
                              <Input
                                id={`slot-end-${slot.key}`}
                                type="time"
                                value={slot.endTime}
                                onChange={(event) =>
                                  updateDraftSlot(slot.key, {
                                    endTime: event.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    !editingActivity && (
                      <p className="text-xs text-muted-foreground">
                        Aucune date ajoutée. Vous pourrez aussi en ajouter plus tard
                        depuis l&apos;onglet Sessions.
                      </p>
                    )
                  )}
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
                      <th className="text-left p-4 font-medium">Images</th>
                      <th className="text-left p-4 font-medium">Discipline</th>
                      <th className="text-left p-4 font-medium">Description</th>
                      <th className="text-left p-4 font-medium">Niveau</th>
                      <th className="text-left p-4 font-medium">Public</th>
                      <th className="text-left p-4 font-medium">Crédits</th>
                      <th className="text-left p-4 font-medium">Prix</th>
                      <th className="text-left p-4 font-medium">Intéressés</th>
                      <th className="text-left p-4 font-medium">Square</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disciplineActivities.map((activity) => (
                      <tr key={activity.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">{activity.name}</td>
                        <td className="p-4">
                          <ActivityImageCarousel activity={activity} />
                        </td>
                        <td className="p-4">
                          {formatCourseDiscipline(
                            normalizeActivityDisciplines(
                              activity.discipline,
                              activity.disciplines,
                            )[0] ?? activity.discipline,
                          ) ?? (
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
                          {interestCounts[activity.id] ? (
                            <span>{interestCounts[activity.id]}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
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
                              onClick={() => void handleOpenDialog(activity)}
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
