"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, Loader2, MailMinus } from "lucide-react";

import {
  getNewsletterSubscriptions,
  unsubscribeNewsletterSubscription,
} from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type NewsletterSubscription = {
  id: string;
  name: string;
  email: string;
  wants_monthly_calendar: boolean;
  unsubscribe_token: string;
  unsubscribed_at: string | null;
  created_at: string;
};

const PARIS_TIMEZONE = "Europe/Paris";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: PARIS_TIMEZONE,
});

function getUnsubscribePath(token: string) {
  return `/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

function escapeCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function AdminNewsletterTab() {
  const [subscriptions, setSubscriptions] = useState<NewsletterSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getNewsletterSubscriptions();
      if (result.error) {
        setError(result.error);
      } else {
        setSubscriptions(result.subscriptions as NewsletterSubscription[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const activeSubscriptions = useMemo(
    () =>
      subscriptions.filter(
        (subscription) => subscription.unsubscribed_at === null,
      ),
    [subscriptions],
  );

  const monthlyCalendarCount = useMemo(
    () =>
      activeSubscriptions.filter(
        (subscription) => subscription.wants_monthly_calendar,
      ).length,
    [activeSubscriptions],
  );

  const handleUnsubscribe = async (subscription: NewsletterSubscription) => {
    if (!confirm(`Désinscrire ${subscription.email} de la newsletter ?`)) {
      return;
    }

    setUpdatingId(subscription.id);
    setError(null);
    setSuccess(null);

    const result = await unsubscribeNewsletterSubscription(subscription.id);
    if (result.error) {
      setError(result.error);
      setUpdatingId(null);
      return;
    }

    setSuccess("Abonnement désinscrit.");
    setUpdatingId(null);
    await loadSubscriptions();
  };

  const handleCopyUnsubscribeLink = async (subscription: NewsletterSubscription) => {
    const url = `${origin}${getUnsubscribePath(subscription.unsubscribe_token)}`;

    await navigator.clipboard.writeText(url);
    setCopiedId(subscription.id);
    window.setTimeout(() => setCopiedId(null), 1500);
  };

  const handleExportCsv = () => {
    if (!activeSubscriptions.length) return;

    const rows = [
      ["email", "name", "unsubscribe_link"],
      ...activeSubscriptions.map((subscription) => [
        subscription.email,
        subscription.name,
        `${origin}${getUnsubscribePath(subscription.unsubscribe_token)}`,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "newsletter-subscribers.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
      <div className="rounded-[14px] border border-black/10 bg-[#fff8f0] p-5">
        <h3 className="text-lg font-semibold">newsletter</h3>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          Les personnes inscrites ici ont donné uniquement un nom et un email.
          Elles ne sont pas forcément des comptes utilisateurs. Pour chaque
          envoi, ajoutez un lien de désinscription personnalisé avec le chemin
          affiché dans la colonne &quot;Désinscription&quot;. Exemple :{" "}
          <code className="rounded bg-white px-1 py-0.5 text-xs">
            https://votre-domaine.com/api/newsletter/unsubscribe?token=...
          </code>
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Badge variant="secondary">{activeSubscriptions.length} actifs</Badge>
          <Badge variant="secondary">
            {monthlyCalendarCount} calendrier mensuel
          </Badge>
          <Badge variant="secondary">{subscriptions.length} total</Badge>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7"
            disabled={!activeSubscriptions.length}
            onClick={handleExportCsv}
          >
            <Download className="mr-2 h-4 w-4" />
            exporter CSV
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left font-medium">Nom</th>
                <th className="p-4 text-left font-medium">Email</th>
                <th className="p-4 text-left font-medium">Préférences</th>
                <th className="p-4 text-left font-medium">Inscription</th>
                <th className="p-4 text-left font-medium">Désinscription</th>
                <th className="p-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-4 text-center text-muted-foreground"
                  >
                    Aucun inscrit à la newsletter
                  </td>
                </tr>
              ) : (
                subscriptions.map((subscription) => {
                  const isActive = subscription.unsubscribed_at === null;
                  const unsubscribeUrl = `${origin}${getUnsubscribePath(
                    subscription.unsubscribe_token,
                  )}`;

                  return (
                    <tr key={subscription.id} className="border-b">
                      <td className="p-4 font-medium">{subscription.name}</td>
                      <td className="p-4">{subscription.email}</td>
                      <td className="p-4">
                        {subscription.wants_monthly_calendar ? (
                          <Badge variant="secondary">calendrier mensuel</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            newsletter trimestrielle
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <p>{dateFormatter.format(new Date(subscription.created_at))}</p>
                          {!isActive ? (
                            <p className="text-xs text-muted-foreground">
                              Désinscrit le{" "}
                              {dateFormatter.format(
                                new Date(subscription.unsubscribed_at!),
                              )}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="max-w-[420px] p-4">
                        <div className="flex items-start gap-2">
                          <code className="break-all rounded bg-muted px-1 py-0.5 text-xs">
                            {unsubscribeUrl}
                          </code>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0"
                            onClick={() => handleCopyUnsubscribeLink(subscription)}
                            aria-label="copier le lien de désinscription"
                            title="copier le lien"
                          >
                            {copiedId === subscription.id ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!isActive || updatingId === subscription.id}
                            onClick={() => handleUnsubscribe(subscription)}
                          >
                            {updatingId === subscription.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <MailMinus className="mr-2 h-4 w-4" />
                            )}
                            Désinscrire
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
