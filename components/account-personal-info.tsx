import Link from "next/link";

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
}: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  profile: UserProfileRow | null;
  signedDocuments: SignedLegalDocument[];
  imageRights: boolean | null;
}) {
  const imageLabel =
    imageRights === true ? "Oui, autorisée" : imageRights === false ? "Non" : "Non renseigné";

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-black/80">Identité</h3>
        <dl className="mt-4 space-y-3">
          <InfoRow label="Prénom" value={firstName} />
          <InfoRow label="Nom" value={lastName} />
          <InfoRow label="E-mail" value={email} />
          <InfoRow label="Téléphone" value={profile?.phone} />
          <InfoRow label="Adresse" value={profile?.address} />
          <InfoRow label="Date de naissance" value={formatBirthDate(profile?.birth_date)} />
        </dl>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-black/80">Personne à prévenir</h3>
        <dl className="mt-4 space-y-3">
          <InfoRow label="Nom" value={profile?.emergency_contact_name} />
          <InfoRow label="Téléphone" value={profile?.emergency_contact_phone} />
        </dl>
      </div>

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
          href="/account/documents?next=/account"
          className="mt-4 inline-flex text-sm font-semibold text-[#4a56dd] underline underline-offset-2"
        >
          Voir ou mettre à jour les documents
        </Link>
      </div>
    </div>
  );
}
