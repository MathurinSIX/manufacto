"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { submitLegalPack } from "@/app/account/documents/actions";
import { SignaturePad } from "@/components/legal/signature-pad";
import { MarkdownContent } from "@/components/markdown-content";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LegalDocumentRow, UserProfileRow } from "@/lib/legal/types";

type DocumentSigningFormProps = {
  documents: LegalDocumentRow[];
  profile: UserProfileRow | null;
  defaultTypedName?: string;
  targetUserId?: string;
  channel?: "online" | "on_site";
  returnTo?: string;
};

export function DocumentSigningForm({
  documents,
  profile,
  defaultTypedName = "",
  targetUserId,
  channel = "online",
  returnTo,
}: DocumentSigningFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const reglement = useMemo(
    () => documents.find((doc) => doc.doc_key === "reglement_interieur") ?? null,
    [documents],
  );
  const decharge = useMemo(
    () =>
      documents.find((doc) => doc.doc_key === "decharge_responsabilite") ?? null,
    [documents],
  );

  const [acceptReglement, setAcceptReglement] = useState(false);
  const [acceptDecharge, setAcceptDecharge] = useState(false);
  const [certifyInsurance, setCertifyInsurance] = useState(false);
  const [imageRights, setImageRights] = useState<"yes" | "no" | null>(
    profile?.image_rights === true
      ? "yes"
      : profile?.image_rights === false
        ? "no"
        : null,
  );
  const [typedName, setTypedName] = useState(defaultTypedName);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [address, setAddress] = useState(profile?.address ?? "");
  const [birthDate, setBirthDate] = useState(profile?.birth_date ?? "");
  const [emergencyContactName, setEmergencyContactName] = useState(
    profile?.emergency_contact_name ?? "",
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    profile?.emergency_contact_phone ?? "",
  );

  const steps = ["Règlement", "Décharge", "Droit à l’image", "Signature"];

  const canContinue = () => {
    if (step === 0) return acceptReglement;
    if (step === 1) {
      return (
        acceptDecharge &&
        certifyInsurance &&
        emergencyContactName.trim() &&
        emergencyContactPhone.trim()
      );
    }
    if (step === 2) return imageRights !== null;
    if (step === 3) return typedName.trim().length >= 2 && !!signatureDataUrl;
    return false;
  };

  const handleSubmit = () => {
    if (!signatureDataUrl || imageRights === null) return;
    setError(null);
    startTransition(async () => {
      const result = await submitLegalPack({
        targetUserId,
        channel,
        typedName,
        signatureDataUrl,
        acceptReglement,
        acceptDecharge,
        imageRights: imageRights === "yes",
        phone,
        address,
        birthDate,
        emergencyContactName,
        emergencyContactPhone,
        certifyInsurance,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push(returnTo || "/account");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {steps.map((label, index) => (
          <span
            key={label}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              index === step
                ? "bg-primary text-primary-foreground"
                : index < step
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {index + 1}. {label}
          </span>
        ))}
      </div>

      {step === 0 && reglement ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            {reglement.title}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              (v{reglement.version})
            </span>
          </h2>
          <div className="max-h-[420px] overflow-y-auto rounded-lg border bg-white p-4">
            <MarkdownContent
              content={reglement.body_md}
              className="space-y-3 text-sm text-black/80 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
            />
          </div>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={acceptReglement}
              onCheckedChange={(value) => setAcceptReglement(value === true)}
            />
            <span>J’ai lu et j’accepte le règlement intérieur.</span>
          </label>
        </section>
      ) : null}

      {step === 1 && decharge ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            {decharge.title}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              (v{decharge.version})
            </span>
          </h2>
          <div className="max-h-[280px] overflow-y-auto rounded-lg border bg-white p-4">
            <MarkdownContent
              content={decharge.body_md}
              className="space-y-3 text-sm text-black/80 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emergencyName">Personne à prévenir *</Label>
              <Input
                id="emergencyName"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Téléphone d’urgence *</Label>
              <Input
                id="emergencyPhone"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Date de naissance</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate ?? ""}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={certifyInsurance}
              onCheckedChange={(value) => setCertifyInsurance(value === true)}
            />
            <span>
              Je certifie avoir une assurance responsabilité civile en cours de
              validité.
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={acceptDecharge}
              onCheckedChange={(value) => setAcceptDecharge(value === true)}
            />
            <span>
              Lu et approuvé — je reconnais avoir été informé(e) des risques et
              m’engage à respecter les consignes de sécurité de l’atelier.
            </span>
          </label>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Droit à l’image</h2>
          <p className="text-sm text-muted-foreground">
            Autorisez-vous Manufacto à utiliser votre image (photos / vidéos
            prises à l’atelier) à des fins de communication ?
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant={imageRights === "yes" ? "default" : "outline"}
              onClick={() => setImageRights("yes")}
            >
              Oui
            </Button>
            <Button
              type="button"
              variant={imageRights === "no" ? "default" : "outline"}
              onClick={() => setImageRights("no")}
            >
              Non
            </Button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Signature</h2>
          <div className="space-y-2">
            <Label htmlFor="typedName">Nom et prénom *</Label>
            <Input
              id="typedName"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Prénom Nom"
              required
            />
          </div>
          <SignaturePad onChange={setSignatureDataUrl} />
          <p className="text-xs text-muted-foreground">
            Cette signature s’applique au règlement intérieur et à la décharge
            de responsabilité.
          </p>
        </section>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={step === 0 || isPending}
          onClick={() => setStep((value) => Math.max(0, value - 1))}
        >
          Retour
        </Button>
        {step < steps.length - 1 ? (
          <Button
            type="button"
            disabled={!canContinue() || isPending}
            onClick={() => setStep((value) => value + 1)}
          >
            Continuer
          </Button>
        ) : (
          <Button
            type="button"
            disabled={!canContinue() || isPending}
            onClick={handleSubmit}
          >
            {isPending ? "Enregistrement…" : "Signer et valider"}
          </Button>
        )}
      </div>
    </div>
  );
}
