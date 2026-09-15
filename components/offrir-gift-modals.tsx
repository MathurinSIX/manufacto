"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

export type OffrirCreditPackOption = {
  id: string;
  name: string;
  credits: number;
  amountCents: number;
  description: string;
};

export type OffrirCourseExample = {
  activityId: string;
  name: string;
  discipline: string | null;
  price: number;
  nextSessionStart: string | null;
};

export type OffrirCourseCategoryOption = {
  id: string;
  label: string;
  amountCents: number;
  credits: number;
  description: string;
  examples: OffrirCourseExample[];
};

type GiftEmailFields = {
  purchaserEmail: string;
  recipientEmail: string;
  sameRecipient: boolean;
  personalMessage: string;
};

function GiftEmailForm({
  value,
  onChange,
  idPrefix,
}: {
  value: GiftEmailFields;
  onChange: (next: GiftEmailFields) => void;
  idPrefix: string;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-purchaser`}>Votre e-mail</Label>
        <Input
          id={`${idPrefix}-purchaser`}
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.fr"
          value={value.purchaserEmail}
          onChange={(event) =>
            onChange({ ...value, purchaserEmail: event.target.value })
          }
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-black/70">
        <input
          type="checkbox"
          checked={value.sameRecipient}
          onChange={(event) =>
            onChange({ ...value, sameRecipient: event.target.checked })
          }
          className="rounded border-black/20"
        />
        Envoyer le code à mon adresse
      </label>

      {!value.sameRecipient ? (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-recipient`}>E-mail du destinataire</Label>
          <Input
            id={`${idPrefix}-recipient`}
            type="email"
            autoComplete="email"
            placeholder="destinataire@exemple.fr"
            value={value.recipientEmail}
            onChange={(event) =>
              onChange({ ...value, recipientEmail: event.target.value })
            }
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-message`}>Message personnel (optionnel)</Label>
        <Textarea
          id={`${idPrefix}-message`}
          rows={3}
          placeholder="Quelques mots pour la personne qui recevra la carte…"
          value={value.personalMessage}
          onChange={(event) =>
            onChange({ ...value, personalMessage: event.target.value })
          }
        />
      </div>
    </div>
  );
}

async function startGiftCheckout(body: Record<string, unknown>) {
  const response = await fetch("/api/gift-cards/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !payload.url) {
    throw new Error(payload.error ?? "Paiement indisponible");
  }
  window.location.href = payload.url;
}

const primaryBtn =
  "mt-6 self-start inline-flex items-center justify-center rounded-[12px] bg-[#f56800] px-6 py-3.5 text-lg font-semibold text-white transition hover:bg-[#d95700]";
const secondaryBtn =
  "mt-6 self-start inline-flex items-center justify-center rounded-[12px] border-2 border-[#4a56dd] bg-white/90 px-6 py-3 text-lg font-semibold text-[#4a56dd] transition hover:bg-[#f0f1ff]";

type OffrirGiftModalsProps = {
  creditPacks: OffrirCreditPackOption[];
  courseCategories: OffrirCourseCategoryOption[];
};

export function OffrirGiftModals({
  creditPacks,
  courseCategories,
}: OffrirGiftModalsProps) {
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState(creditPacks[0]?.id ?? "");
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    courseCategories[0]?.id ?? "",
  );
  const [creditsEmail, setCreditsEmail] = useState<GiftEmailFields>({
    purchaserEmail: "",
    recipientEmail: "",
    sameRecipient: true,
    personalMessage: "",
  });
  const [courseEmail, setCourseEmail] = useState<GiftEmailFields>({
    purchaserEmail: "",
    recipientEmail: "",
    sameRecipient: true,
    personalMessage: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPack = useMemo(
    () => creditPacks.find((pack) => pack.id === selectedPackId) ?? null,
    [creditPacks, selectedPackId],
  );
  const selectedCategory = useMemo(
    () =>
      courseCategories.find((category) => category.id === selectedCategoryId) ??
      null,
    [courseCategories, selectedCategoryId],
  );

  async function payCredits() {
    if (!selectedPack) return;
    setLoading(true);
    setError(null);
    try {
      await startGiftCheckout({
        kind: "credits",
        productId: selectedPack.id,
        purchaserEmail: creditsEmail.purchaserEmail,
        recipientEmail: creditsEmail.sameRecipient
          ? creditsEmail.purchaserEmail
          : creditsEmail.recipientEmail,
        personalMessage: creditsEmail.personalMessage,
      });
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Paiement indisponible",
      );
      setLoading(false);
    }
  }

  async function payCourse() {
    if (!selectedCategory) return;
    setLoading(true);
    setError(null);
    try {
      await startGiftCheckout({
        kind: "course",
        courseCategoryId: selectedCategory.id,
        purchaserEmail: courseEmail.purchaserEmail,
        recipientEmail: courseEmail.sameRecipient
          ? courseEmail.purchaserEmail
          : courseEmail.recipientEmail,
        personalMessage: courseEmail.personalMessage,
      });
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Paiement indisponible",
      );
      setLoading(false);
    }
  }

  return (
    <>
      <section className="mx-auto max-w-[1274px] px-5 py-14">
        <h2 className="text-[30px] font-semibold text-black/80">
          Deux façons d&apos;offrir
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <article className="flex flex-col rounded-[19px] border border-black/10 bg-[#fff3e8] p-8">
            <h3 className="text-2xl font-bold text-[#f56800]">Un cours ponctuel</h3>
            <p className="mt-4 flex-1 text-lg text-black/75">
              Idéal pour découvrir une pratique ou monter en compétence. Choisissez
              une catégorie de tarif, réglez en ligne, et la personne reçoit un code
              pour réserver.
            </p>
            <button
              type="button"
              className={primaryBtn}
              onClick={() => {
                setError(null);
                setCourseOpen(true);
              }}
            >
              Offrir un cours
            </button>
          </article>
          <article className="flex flex-col rounded-[19px] border border-black/10 bg-[#f0f1ff] p-8">
            <h3 className="text-2xl font-bold text-[#4a56dd]">Un pack de crédits</h3>
            <p className="mt-4 flex-1 text-lg text-black/75">
              Pour la pratique libre : la personne charge un pass, visite
              l&apos;atelier, puis réserve ses créneaux. Tarifs dégressifs,
              crédits valables un an.
            </p>
            <button
              type="button"
              className={secondaryBtn}
              onClick={() => {
                setError(null);
                setCreditsOpen(true);
              }}
            >
              Offrir des crédits
            </button>
          </article>
        </div>
      </section>

      <Dialog
        open={creditsOpen}
        onOpenChange={(open) => {
          setCreditsOpen(open);
          if (!open) setError(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-[19px] border-black/10 p-0 sm:max-w-xl">
          <div className="bg-[#f0f1ff] px-5 py-5 md:px-6">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="text-[24px] font-bold text-[#4a56dd]">
                Offrir des crédits
              </DialogTitle>
              <DialogDescription className="text-base text-black/70">
                Choisissez un pack, indiquez votre e-mail — aucun compte requis.
                Le code est envoyé après paiement.
              </DialogDescription>
            </DialogHeader>

            {creditPacks.length === 0 ? (
              <p className="mt-5 text-sm text-black/60">Packs bientôt disponibles.</p>
            ) : (
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {creditPacks.map((pack) => {
                  const selected = pack.id === selectedPackId;
                  return (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => setSelectedPackId(pack.id)}
                      className={cn(
                        "rounded-[12px] border px-3 py-3 text-left transition",
                        selected
                          ? "border-[#4a56dd] bg-white ring-2 ring-[#4a56dd]/30"
                          : "border-black/10 bg-white/80 hover:border-[#4a56dd]/40",
                      )}
                    >
                      <p className="text-xl font-bold text-[#4a56dd]">
                        {priceFormatter.format(pack.amountCents / 100)}
                      </p>
                      <p className="text-sm font-semibold text-black/80">
                        {pack.credits} crédit{pack.credits > 1 ? "s" : ""}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-5 rounded-[12px] border border-black/10 bg-white p-4">
              <GiftEmailForm
                idPrefix="credits"
                value={creditsEmail}
                onChange={setCreditsEmail}
              />
              <Button
                type="button"
                className="mt-4 w-full rounded-[12px] bg-[#4a56dd] hover:bg-[#3844c8]"
                disabled={
                  loading || !selectedPack || !creditsEmail.purchaserEmail.trim()
                }
                onClick={() => void payCredits()}
              >
                {loading
                  ? "Chargement..."
                  : selectedPack
                    ? `Payer ${priceFormatter.format(selectedPack.amountCents / 100)}`
                    : "Payer"}
              </Button>
              <p className="mt-2 text-xs text-black/55">
                Valables un an pour la pratique libre.
              </p>
              {error && creditsOpen ? (
                <p className="mt-2 text-sm text-destructive">{error}</p>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={courseOpen}
        onOpenChange={(open) => {
          setCourseOpen(open);
          if (!open) setError(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-[19px] border-black/10 p-0 sm:max-w-xl">
          <div className="bg-[#fff3e8] px-5 py-5 md:px-6">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="text-[24px] font-bold text-[#f56800]">
                Offrir un cours
              </DialogTitle>
              <DialogDescription className="text-base text-black/70">
                Trois catégories selon le tarif. La personne choisit ensuite son
                cours avec le code reçu par e-mail.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 space-y-2">
              {courseCategories.map((category) => {
                const selected = category.id === selectedCategoryId;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={cn(
                      "w-full rounded-[12px] border px-4 py-3 text-left transition",
                      selected
                        ? "border-[#f56800] bg-white ring-2 ring-[#f56800]/25"
                        : "border-black/10 bg-white/80 hover:border-[#f56800]/40",
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-lg font-bold text-[#f56800]">
                        {category.label}
                      </p>
                      <p className="text-lg font-semibold tabular-nums text-black/85">
                        {priceFormatter.format(category.amountCents / 100)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-black/60">
                      {category.credits} crédits · {category.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {selectedCategory ? (
              <div className="mt-4 rounded-[12px] border border-black/10 bg-white p-4">
                <p className="text-sm font-semibold text-black/80">
                  Exemples de prochains cours à{" "}
                  {priceFormatter.format(selectedCategory.amountCents / 100)}
                </p>
                {selectedCategory.examples.length === 0 ? (
                  <p className="mt-2 text-sm text-black/55">
                    Pas de session à venir listée pour l&apos;instant — le code
                    restera valable pour tout cours de cette catégorie.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {selectedCategory.examples.map((example) => (
                      <li key={example.activityId} className="text-sm text-black/75">
                        <span className="font-medium text-black/85">
                          {example.name}
                        </span>
                        {example.nextSessionStart ? (
                          <span className="text-black/50">
                            {" "}
                            ·{" "}
                            {dateFormatter.format(
                              new Date(example.nextSessionStart),
                            )}
                          </span>
                        ) : (
                          <span className="text-black/45"> · dates à venir</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            <div className="mt-5 rounded-[12px] border border-black/10 bg-white p-4">
              <GiftEmailForm
                idPrefix="course"
                value={courseEmail}
                onChange={setCourseEmail}
              />
              <Button
                type="button"
                className="mt-4 w-full rounded-[12px] bg-[#f56800] hover:bg-[#d95700]"
                disabled={
                  loading ||
                  !selectedCategory ||
                  !courseEmail.purchaserEmail.trim()
                }
                onClick={() => void payCourse()}
              >
                {loading
                  ? "Chargement..."
                  : selectedCategory
                    ? `Payer ${priceFormatter.format(selectedCategory.amountCents / 100)}`
                    : "Payer"}
              </Button>
              <p className="mt-2 text-xs text-black/55">
                Aucun compte requis pour offrir. Le destinataire utilise le code
                à la réservation.
              </p>
              {error && courseOpen ? (
                <p className="mt-2 text-sm text-destructive">{error}</p>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
