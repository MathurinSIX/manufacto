"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";

import {
  getSignatureSignedUrl,
  updateAdminNotes,
  updateUserHabilitations,
} from "@/app/account/documents/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_HABILITATIONS,
  type LegalDocumentRow,
  type UserHabilitationRow,
  type UserLegalAcceptanceRow,
  type UserProfileRow,
} from "@/lib/legal/types";

type AdminUserLegalSectionProps = {
  userId: string;
  documents: LegalDocumentRow[];
  acceptances: UserLegalAcceptanceRow[];
  profile: UserProfileRow | null;
  habilitations: UserHabilitationRow[];
  complete: boolean;
  imageRights: boolean | null;
};

export function AdminUserLegalSection({
  userId,
  documents,
  acceptances,
  profile,
  habilitations,
  complete,
  imageRights,
}: AdminUserLegalSectionProps) {
  const [notes, setNotes] = useState(profile?.admin_notes ?? "");
  const [selectedKeys, setSelectedKeys] = useState<string[]>(
    () => habilitations.map((row) => row.machine_key),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const acceptanceByDocId = useMemo(() => {
    const map = new Map<string, UserLegalAcceptanceRow>();
    for (const row of acceptances) {
      map.set(row.legal_document_id, row);
    }
    return map;
  }, [acceptances]);

  const labelsByKey = useMemo(() => {
    const map: Record<string, string> = {};
    for (const item of DEFAULT_HABILITATIONS) {
      map[item.key] = item.label;
    }
    for (const row of habilitations) {
      map[row.machine_key] = row.label;
    }
    return map;
  }, [habilitations]);

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((value) => value !== key) : [...prev, key],
    );
  };

  const saveHabilitations = () => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await updateUserHabilitations(userId, selectedKeys, labelsByKey);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("Habilitations enregistrées.");
    });
  };

  const saveNotes = () => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await updateAdminNotes(userId, notes);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("Notes enregistrées.");
    });
  };

  const openSignature = (path: string | null) => {
    if (!path) return;
    startTransition(async () => {
      const result = await getSignatureSignedUrl(path);
      if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      } else {
        setError(result.error ?? "Signature indisponible");
      }
    });
  };

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Documents légaux</h3>
            <p className="text-sm text-muted-foreground">
              {complete
                ? "Règlement et décharge signés · droit à l’image renseigné"
                : "Signature manquante — faire signer avant la première venue"}
            </p>
          </div>
          <Button asChild variant={complete ? "outline" : "default"}>
            <Link href={`/admin/users/${userId}/sign`}>
              {complete ? "Revoir / faire re-signer" : "Faire signer sur place"}
            </Link>
          </Button>
        </div>

        <div className="rounded-lg border divide-y">
          {documents.map((doc) => {
            const acceptance = acceptanceByDocId.get(doc.id);
            return (
              <div
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3"
              >
                <div>
                  <p className="font-medium">
                    {doc.title}{" "}
                    <span className="text-xs text-muted-foreground">
                      v{doc.version}
                    </span>
                  </p>
                  {acceptance ? (
                    <p className="text-sm text-muted-foreground">
                      Signé le{" "}
                      {new Date(acceptance.accepted_at).toLocaleString("fr-FR")} ·{" "}
                      {acceptance.channel === "on_site"
                        ? "sur place"
                        : acceptance.channel === "paper"
                          ? "papier"
                          : "en ligne"}{" "}
                      · {acceptance.typed_name}
                    </p>
                  ) : (
                    <p className="text-sm text-amber-700">Non signé</p>
                  )}
                </div>
                {acceptance?.signature_path ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openSignature(acceptance.signature_path)}
                  >
                    Voir la signature
                  </Button>
                ) : null}
              </div>
            );
          })}
          <div className="p-3">
            <p className="font-medium">Droit à l’image</p>
            <p className="text-sm text-muted-foreground">
              {imageRights === true
                ? "Oui"
                : imageRights === false
                  ? "Non"
                  : "Non renseigné"}
            </p>
          </div>
          {profile?.emergency_contact_name ? (
            <div className="p-3 text-sm">
              <p>
                <span className="font-medium">Urgence :</span>{" "}
                {profile.emergency_contact_name}{" "}
                {profile.emergency_contact_phone
                  ? `· ${profile.emergency_contact_phone}`
                  : ""}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Habilitations machines</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {DEFAULT_HABILITATIONS.map((item) => (
            <label key={item.key} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selectedKeys.includes(item.key)}
                onCheckedChange={() => toggleKey(item.key)}
              />
              {item.label}
            </label>
          ))}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={saveHabilitations}
        >
          Enregistrer les habilitations
        </Button>
      </section>

      <section className="space-y-3">
        <Label htmlFor="admin-notes">Notes internes</Label>
        <Textarea
          id="admin-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Habilitations libres, remarques…"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={saveNotes}
        >
          Enregistrer les notes
        </Button>
      </section>

      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
