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
import type { SignedLegalDocument } from "@/lib/legal/status";
import {
  DEFAULT_HABILITATIONS,
  type UserHabilitationRow,
  type UserProfileRow,
} from "@/lib/legal/types";
import { HouseholdMembersEditor } from "@/components/household-members-editor";
import type { AccountPartnerSummary } from "@/lib/account-share";

type AdminUserLegalSectionProps = {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  profile: UserProfileRow | null;
  habilitations: UserHabilitationRow[];
  complete: boolean;
  imageRights: boolean | null;
  signedDocuments: SignedLegalDocument[];
  ownerEmail?: string | null;
  partner?: AccountPartnerSummary | null;
  canInvite?: boolean;
};

export function AdminUserLegalSection({
  userId,
  firstName,
  lastName,
  email,
  profile,
  habilitations,
  complete,
  imageRights,
  signedDocuments,
  ownerEmail,
  partner = null,
  canInvite = true,
}: AdminUserLegalSectionProps) {
  const [notes, setNotes] = useState(profile?.admin_notes ?? "");
  const [selectedKeys, setSelectedKeys] = useState<string[]>(
    () => habilitations.map((row) => row.machine_key),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
        <h3 className="text-lg font-semibold">Mes infos</h3>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Prénom</dt>
            <dd className="font-medium">{firstName?.trim() || "Non renseigné"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Nom</dt>
            <dd className="font-medium">{lastName?.trim() || "Non renseigné"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">E-mail</dt>
            <dd className="font-medium">{email?.trim() || "Non renseigné"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Téléphone</dt>
            <dd className="font-medium">{profile?.phone?.trim() || "Non renseigné"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Adresse</dt>
            <dd className="font-medium">{profile?.address?.trim() || "Non renseigné"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Date de naissance</dt>
            <dd className="font-medium">
              {profile?.birth_date
                ? profile.birth_date.slice(0, 10).split("-").reverse().join("/")
                : "Non renseigné"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Personne à prévenir</dt>
            <dd className="font-medium">
              {profile?.emergency_contact_name?.trim() || "Non renseigné"}
              {profile?.emergency_contact_phone
                ? ` · ${profile.emergency_contact_phone}`
                : ""}
            </dd>
          </div>
        </dl>
      </section>

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
          {signedDocuments.map((doc) => (
            <div
              key={doc.docKey}
              className="flex flex-wrap items-center justify-between gap-3 p-3"
            >
              <div>
                <p className="font-medium">
                  {doc.title}{" "}
                  <span className="text-xs text-muted-foreground">
                    v{doc.version}
                  </span>
                </p>
                {doc.signed ? (
                  <p className="text-sm text-muted-foreground">
                    Signé le{" "}
                    {doc.acceptedAt
                      ? new Date(doc.acceptedAt).toLocaleString("fr-FR")
                      : "—"}{" "}
                    ·{" "}
                    {doc.channel === "on_site"
                      ? "sur place"
                      : doc.channel === "paper"
                        ? "papier"
                        : "en ligne"}{" "}
                    · {doc.typedName}
                  </p>
                ) : (
                  <p className="text-sm text-amber-700">Non signé</p>
                )}
              </div>
              {doc.signaturePath ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => openSignature(doc.signaturePath)}
                >
                  Voir la signature
                </Button>
              ) : null}
            </div>
          ))}
          <div className="p-3">
            <p className="font-medium">Autorisation à l’image</p>
            <p className="text-sm text-muted-foreground">
              {imageRights === true
                ? "Signé · oui"
                : imageRights === false
                  ? "Signé · non"
                  : "Non signé"}
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

      <section className="rounded-lg border p-4">
        <HouseholdMembersEditor
          userId={userId}
          memberNames={profile?.member_names}
          childNames={profile?.child_names}
          ownerEmail={ownerEmail}
          partner={partner}
          canInvite={canInvite}
          asAdmin
        />
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
