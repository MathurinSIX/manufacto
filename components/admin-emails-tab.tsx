"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";

import {
  getEmailTemplates,
  resetEmailTemplate,
  saveEmailTemplate,
} from "@/app/admin/actions";
import { renderTemplate, SAMPLE_REGISTRATION_VARIABLES } from "@/lib/email/render-template";
import type { EmailTemplate, EmailTemplateKey } from "@/lib/email/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const TEMPLATE_LABELS: Record<EmailTemplateKey, string> = {
  registration_confirmation: "Confirmation d'inscription",
  registration_reminder: "Rappel (J-1)",
};

const TEMPLATE_VARIABLES = [
  { key: "user_name", description: "Nom du participant" },
  { key: "activity_name", description: "Nom du cours" },
  { key: "session_date", description: "Date de la session" },
  { key: "session_time", description: "Heure de la session" },
  { key: "participant_count", description: "Nombre de participants" },
  { key: "account_url", description: "Lien vers l'espace personnel" },
] as const;

type DraftState = Record<EmailTemplateKey, { subject: string; bodyHtml: string }>;

function draftsFromTemplates(templates: EmailTemplate[]): DraftState {
  return templates.reduce((acc, template) => {
    acc[template.templateKey] = {
      subject: template.subject,
      bodyHtml: template.bodyHtml,
    };
    return acc;
  }, {} as DraftState);
}

export function AdminEmailsTab() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [drafts, setDrafts] = useState<DraftState | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<EmailTemplateKey | null>(null);
  const [resettingKey, setResettingKey] = useState<EmailTemplateKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<EmailTemplateKey>(
    "registration_confirmation",
  );

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getEmailTemplates();
      if (result.error) {
        setError(result.error);
        return;
      }

      setTemplates(result.templates);
      setDrafts(draftsFromTemplates(result.templates));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const activeDraft = drafts?.[activeKey];
  const activeTemplate = templates.find((template) => template.templateKey === activeKey);

  const preview = useMemo(() => {
    if (!activeDraft) {
      return { subject: "", html: "" };
    }

    return renderTemplate(activeDraft, SAMPLE_REGISTRATION_VARIABLES);
  }, [activeDraft]);

  const updateDraft = (
    templateKey: EmailTemplateKey,
    field: "subject" | "bodyHtml",
    value: string,
  ) => {
    setDrafts((current) => {
      if (!current) return current;
      return {
        ...current,
        [templateKey]: {
          ...current[templateKey],
          [field]: value,
        },
      };
    });
  };

  const handleSave = async (templateKey: EmailTemplateKey) => {
    if (!drafts) return;

    setSavingKey(templateKey);
    setError(null);
    setSuccess(null);

    const draft = drafts[templateKey];
    const result = await saveEmailTemplate(
      templateKey,
      draft.subject,
      draft.bodyHtml,
    );

    if (result.error) {
      setError(result.error);
      setSavingKey(null);
      return;
    }

    setSuccess("Modèle enregistré.");
    setSavingKey(null);
    await loadTemplates();
  };

  const handleReset = async (templateKey: EmailTemplateKey) => {
    if (
      !confirm(
        "Réinitialiser ce modèle avec le contenu par défaut ? Cette action supprime la personnalisation enregistrée.",
      )
    ) {
      return;
    }

    setResettingKey(templateKey);
    setError(null);
    setSuccess(null);

    const result = await resetEmailTemplate(templateKey);
    if (result.error) {
      setError(result.error);
      setResettingKey(null);
      return;
    }

    setSuccess("Modèle réinitialisé.");
    setResettingKey(null);
    await loadTemplates();
  };

  const handleCopyVariable = async (variable: string) => {
    await navigator.clipboard.writeText(`{{${variable}}}`);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement des modèles d&apos;e-mail...
      </div>
    );
  }

  if (!drafts || !activeDraft) {
    return <p className="text-destructive">Impossible de charger les modèles d&apos;e-mail.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">E-mails d&apos;inscription aux cours</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Personnalisez les e-mails envoyés automatiquement lors d&apos;une inscription et la veille du cours.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-green-700">{success}</p> : null}

      <Tabs
        value={activeKey}
        onValueChange={(value) => setActiveKey(value as EmailTemplateKey)}
        className="w-full"
      >
        <TabsList className="mb-6 grid h-auto w-full max-w-xl grid-cols-2 rounded-[14px] bg-[#f2f2f2] p-1 text-black/60">
          <TabsTrigger
            value="registration_confirmation"
            className="rounded-[11px] py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#4a56dd] data-[state=active]:shadow-sm"
          >
            confirmation
          </TabsTrigger>
          <TabsTrigger
            value="registration_reminder"
            className="rounded-[11px] py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#4a56dd] data-[state=active]:shadow-sm"
          >
            rappel J-1
          </TabsTrigger>
        </TabsList>

        {(["registration_confirmation", "registration_reminder"] as EmailTemplateKey[]).map(
          (templateKey) => {
            const draft = drafts[templateKey];
            const template = templates.find((item) => item.templateKey === templateKey);

            return (
              <TabsContent key={templateKey} value={templateKey} className="mt-0 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{TEMPLATE_LABELS[templateKey]}</h3>
                    <p className="text-sm text-muted-foreground">
                      {template?.isDefault
                        ? "Modèle par défaut (non personnalisé en base)"
                        : `Dernière mise à jour : ${template?.updatedAt ? new Date(template.updatedAt).toLocaleString("fr-FR", { timeZone: "Europe/Paris" }) : "—"}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleReset(templateKey)}
                      disabled={resettingKey === templateKey || savingKey === templateKey}
                    >
                      {resettingKey === templateKey ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="mr-2 h-4 w-4" />
                      )}
                      Réinitialiser
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleSave(templateKey)}
                      disabled={savingKey === templateKey || resettingKey === templateKey}
                    >
                      {savingKey === templateKey ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Enregistrer
                    </Button>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-4 rounded-2xl border bg-white p-6">
                    <div className="space-y-2">
                      <Label htmlFor={`${templateKey}-subject`}>Sujet</Label>
                      <Input
                        id={`${templateKey}-subject`}
                        value={draft.subject}
                        onChange={(event) =>
                          updateDraft(templateKey, "subject", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${templateKey}-body`}>Contenu HTML</Label>
                      <Textarea
                        id={`${templateKey}-body`}
                        value={draft.bodyHtml}
                        onChange={(event) =>
                          updateDraft(templateKey, "bodyHtml", event.target.value)
                        }
                        rows={14}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border bg-white p-4">
                      <h4 className="mb-3 text-sm font-semibold">Variables disponibles</h4>
                      <ul className="space-y-2 text-sm">
                        {TEMPLATE_VARIABLES.map((variable) => (
                          <li key={variable.key} className="flex items-start justify-between gap-3">
                            <div>
                              <button
                                type="button"
                                className="font-mono text-[#4a56dd] hover:underline"
                                onClick={() => handleCopyVariable(variable.key)}
                              >
                                {`{{${variable.key}}}`}
                              </button>
                              <p className="text-muted-foreground">{variable.description}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border bg-white p-4">
                      <h4 className="mb-3 text-sm font-semibold">Aperçu</h4>
                      <p className="mb-2 text-sm font-medium">{preview.subject}</p>
                      <div
                        className="prose prose-sm max-w-none text-sm"
                        dangerouslySetInnerHTML={{ __html: preview.html }}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            );
          },
        )}
      </Tabs>
    </div>
  );
}
