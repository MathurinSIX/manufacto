"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { updateAccountIdentity } from "@/app/account/documents/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SignedLegalDocument } from "@/lib/legal/status";
import type { UserProfileRow } from "@/lib/legal/types";

function formatBirthDate(value: string | null | undefined) {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatSignedAt(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-sm font-semibold text-black/50">{label}</dt>
      <dd className="text-base text-black/85">{value?.trim() ? value : "Non renseigné"}</dd>
    </div>
  );
}

export function AccountPersonalInfo({
  firstName,
  lastName,
  email,
  profile,
  signedDocuments,
  imageRights,
  editable = false,
}: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  profile: UserProfileRow | null;
  signedDocuments: SignedLegalDocument[];
  imageRights: boolean | null;
  editable?: boolean;
}) {
  const imageLabel =
    imageRights === true ? "Oui, autorisée" : imageRights === false ? "Non" : "Non renseigné";
  const [givenName, setGivenName] = useState(firstName ?? "");
  const [familyName, setFamilyName] = useState(lastName ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [address, setAddress] = useState(profile?.address ?? "");
  const [birthDate, setBirthDate] = useState(profile?.birth_date?.slice(0, 10) ?? "");
  const [emergencyName, setEmergencyName] = useState(
    profile?.emergency_contact_name ?? "",
  );
  const [emergencyPhone, setEmergencyPhone] = useState(
    profile?.emergency_contact_phone ?? "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateAccountIdentity({
        firstName: givenName,
        lastName: familyName,
        phone,
        address,
        birthDate,
        emergencyContactName: emergencyName,
        emergencyContactPhone: emergencyPhone,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("Informations enregistrées.");
    });
  };

  return (
    <div className="space-y-8">
      {editable ? (
        <div className="space-y-8">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-black/80">Identité</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="account-first-name">Prénom</Label>
                <Input
                  id="account-first-name"
                  value={givenName}
                  onChange={(event) => setGivenName(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="account-last-name">Nom</Label>
                <Input
                  id="account-last-name"
                  value={familyName}
                  onChange={(event) => setFamilyName(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <p className="text-base text-black/85">{email?.trim() || "Non renseigné"}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account-phone">Téléphone</Label>
              <Input
                id="account-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account-address">Adresse</Label>
              <Input
                id="account-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account-birth-date">Date de naissance</Label>
              <Input
                id="account-birth-date"
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-black/80">Personne à prévenir</h3>
            <div className="space-y-1.5">
              <Label htmlFor="account-emergency-name">Nom</Label>
              <Input
                id="account-emergency-name"
                value={emergencyName}
                onChange={(event) => setEmergencyName(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account-emergency-phone">Téléphone</Label>
              <Input
                id="account-emergency-phone"
                type="tel"
                value={emergencyPhone}
                onChange={(event) => setEmergencyPhone(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" size="sm" disabled={isPending} onClick={save}>
              {isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
            {message ? <p className="text-sm text-green-700">{message}</p> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        </div>
      ) : (
        <>
          <div>
            <h3 className="text-lg font-semibold text-black/80">Identité</h3>
            <dl className="mt-4 space-y-3">
              <InfoRow label="Prénom" value={firstName} />
              <InfoRow label="Nom" value={lastName} />
              <InfoRow label="E-mail" value={email} />
              <InfoRow label="Téléphone" value={profile?.phone} />
              <InfoRow label="Adresse" value={profile?.address} />
              <InfoRow
                label="Date de naissance"
                value={formatBirthDate(profile?.birth_date)}
              />
            </dl>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-black/80">Personne à prévenir</h3>
            <dl className="mt-4 space-y-3">
              <InfoRow label="Nom" value={profile?.emergency_contact_name} />
              <InfoRow label="Téléphone" value={profile?.emergency_contact_phone} />
            </dl>
          </div>
        </>
      )}

      <div>
        <h3 className="text-lg font-semibold text-black/80">Documents signés</h3>
        <ul className="mt-4 divide-y divide-black/10 rounded-[14px] border border-black/10">
          {signedDocuments.map((doc) => (
            <li
              key={doc.docKey}
              className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3"
            >
              <span className="font-medium text-black/85">{doc.title}</span>
              {doc.signed ? (
                <span className="text-sm text-emerald-800">
                  Signé
                  {formatSignedAt(doc.acceptedAt)
                    ? ` le ${formatSignedAt(doc.acceptedAt)}`
                    : ""}
                  {doc.typedName ? ` · ${doc.typedName}` : ""}
                </span>
              ) : (
                <span className="text-sm font-medium text-amber-700">Non signé</span>
              )}
            </li>
          ))}
          <li className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
            <span className="font-medium text-black/85">Autorisation à l’image</span>
            <span
              className={
                imageRights === null
                  ? "text-sm font-medium text-amber-700"
                  : "text-sm text-emerald-800"
              }
            >
              {imageLabel}
            </span>
          </li>
        </ul>
        <Link
          href="/account/documents?next=%2Faccount%3Ftab%3Dinfos"
          className="mt-4 inline-flex text-sm font-semibold text-[#4a56dd] underline underline-offset-2"
        >
          Voir ou mettre à jour les documents
        </Link>
      </div>
    </div>
  );
}
