"use client";

import { useMemo, useState } from "react";

import { SquareCheckoutButton } from "@/components/square-checkout-button";
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
import {
  examplesForCredits,
  practiceHoursLabel,
  type CreditCourseExample,
  type PracticeCreditRate,
} from "@/lib/credit-course-matches";
import {
  formatCreditRate,
  minimumCustomAmountCents,
  quoteCustomCredits,
  type CreditTier,
} from "@/lib/credit-rates";
import { cn } from "@/lib/utils";

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

export type CreditOfferPack = CreditTier & {
  catalogObjectId?: string | null;
};

type CreditOfferPickerProps = {
  packs: CreditOfferPack[];
  examples: CreditCourseExample[];
  practiceRates?: PracticeCreditRate[];
  mode: "gift" | "purchase";
  showExamples?: boolean;
  /** Gift page shows examples above the amounts. Account shows them below, smaller. */
  examplesPlacement?: "before" | "after";
  isLoggedIn?: boolean;
  returnPath?: string;
  showPurchaseButton?: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CreditOfferPicker({
  packs,
  examples,
  practiceRates = [],
  mode,
  showExamples = true,
  examplesPlacement = "before",
  isLoggedIn = false,
  returnPath,
  showPurchaseButton = true,
}: CreditOfferPickerProps) {
  const tiers = useMemo(
    () => packs.filter((pack) => pack.credits > 0 && pack.credits !== 2),
    [packs],
  );
  const minimumCents = minimumCustomAmountCents(tiers);
  const presetPack =
    tiers.find((pack) => pack.amountCents === 7200) ?? tiers[0];
  const [selectedId, setSelectedId] = useState<string | "custom">(
    presetPack?.id ?? "custom",
  );
  const [customEuros, setCustomEuros] = useState(
    Math.max(8, Math.round(minimumCents / 100)),
  );
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sameRecipient, setSameRecipient] = useState(true);
  const [personalMessage, setPersonalMessage] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customQuote = useMemo(
    () => quoteCustomCredits(Math.round(customEuros) * 100, tiers),
    [customEuros, tiers],
  );
  const selectedPack =
    selectedId === "custom" ? null : tiers.find((pack) => pack.id === selectedId) ?? null;
  const selectedCredits =
    selectedId === "custom" ? customQuote?.credits ?? 0 : selectedPack?.credits ?? 0;
  const selectedCents =
    selectedId === "custom"
      ? customQuote?.amountCents ?? 0
      : selectedPack?.amountCents ?? 0;
  const matchedExamples = examplesForCredits(examples, selectedCredits, 3);
  const accent = mode === "gift" ? "#4a56dd" : "#f56800";

  async function payGift() {
    if (!EMAIL_RE.test(purchaserEmail.trim())) {
      setError("Indiquez une adresse e-mail valide.");
      return;
    }
    const recipient = sameRecipient ? purchaserEmail : recipientEmail;
    if (!EMAIL_RE.test(recipient.trim())) {
      setError("Indiquez l'e-mail du destinataire.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/gift-cards/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          selectedId === "custom"
            ? {
                kind: "credits_custom",
                customAmountEuros: (customQuote?.amountCents ?? 0) / 100,
                purchaserEmail,
                recipientEmail: recipient,
                personalMessage,
              }
            : {
                kind: "credits",
                productId: selectedPack?.id,
                purchaserEmail,
                recipientEmail: recipient,
                personalMessage,
              },
        ),
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Paiement indisponible");
      }
      window.location.href = payload.url;
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Paiement indisponible",
      );
      setLoading(false);
    }
  }

  async function payCustomCredits() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/square/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customAmountEuros: (customQuote?.amountCents ?? 0) / 100,
        }),
      });
      const payload = (await response.json()) as {
        url?: string;
        error?: string;
        redirectTo?: string;
      };
      if (response.status === 401) {
        window.location.href = `/auth/login?next=${encodeURIComponent(returnPath ?? "/account?tab=credits")}`;
        return;
      }
      if (payload.redirectTo) {
        window.location.href = payload.redirectTo;
        return;
      }
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Paiement indisponible");
      }
      window.location.href = payload.url;
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
    <div className="space-y-5">
      {showExamples && examplesPlacement === "before" ? (
        <CreditExamples
          compact={false}
          selectedCredits={selectedCredits}
          matchedExamples={matchedExamples}
          practiceRates={practiceRates}
        />
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {tiers.map((pack) => {
          const selected = selectedId === pack.id;
          return (
            <button
              key={pack.id}
              type="button"
              onClick={() => {
                setSelectedId(pack.id);
                setError(null);
              }}
              className={cn(
                "rounded-[12px] border px-3 py-2.5 text-left transition",
                selected ? "bg-white" : "hover:bg-white",
              )}
              style={{
                borderColor: selected ? accent : "rgba(0,0,0,0.08)",
                backgroundColor: selected
                  ? "#ffffff"
                  : mode === "gift"
                    ? "#f4f6ff"
                    : "#fff8f0",
              }}
            >
              <p
                className="text-xl font-semibold leading-none tracking-[-0.02em]"
                style={{ color: accent }}
              >
                {priceFormatter.format(pack.amountCents / 100)}
              </p>
              <p className="mt-1.5 text-sm font-medium text-black/80">
                {pack.credits} crédit{pack.credits > 1 ? "s" : ""}
              </p>
              <p className="mt-0.5 text-xs text-black/45">
                {formatCreditRate(pack.amountCents, pack.credits)}
              </p>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setSelectedId("custom");
            setError(null);
          }}
          className={cn(
            "rounded-[12px] border border-dashed px-3 py-2.5 text-left transition",
            selectedId === "custom" ? "border-solid bg-white" : "hover:bg-white",
          )}
          style={{
            borderColor: selectedId === "custom" ? accent : "rgba(0,0,0,0.18)",
            backgroundColor:
              selectedId === "custom"
                ? "#ffffff"
                : mode === "gift"
                  ? "#f4f6ff"
                  : "#fff8f0",
          }}
        >
          <p
            className="text-base font-semibold leading-none"
            style={{ color: accent }}
          >
            Montant libre
          </p>
          <p className="mt-1.5 text-xs leading-snug text-black/55">
            Meilleur palier atteint
          </p>
          <p className="mt-0.5 text-xs text-black/45">
            Dès {priceFormatter.format(minimumCents / 100)}
          </p>
        </button>
      </div>

      {selectedId === "custom" ? (
        <div className="rounded-[14px] border border-black/10 bg-white p-4">
          <Label htmlFor="custom-credit-euros">Montant (€)</Label>
          <Input
            id="custom-credit-euros"
            type="number"
            min={Math.round(minimumCents / 100)}
            max={2000}
            step={1}
            value={customEuros}
            onChange={(event) =>
              setCustomEuros(Math.round(Number(event.target.value) || 0))
            }
            className="mt-2 max-w-[12rem]"
          />
          {customQuote ? (
            <p className="mt-2 text-sm text-black/70">
              {customQuote.credits} crédit{customQuote.credits > 1 ? "s" : ""} pour{" "}
              {priceFormatter.format(customQuote.amountCents / 100)} ·{" "}
              {formatCreditRate(customQuote.rateCents, 1)}
            </p>
          ) : (
            <p className="mt-2 text-sm text-black/55">
              Minimum {priceFormatter.format(minimumCents / 100)}.
            </p>
          )}
        </div>
      ) : null}

      {showPurchaseButton ? (
        <Button
          type="button"
          className="rounded-[12px] text-white hover:opacity-90"
          style={{ backgroundColor: accent }}
          disabled={selectedId === "custom" ? !customQuote : !selectedPack}
          onClick={() => {
            setError(null);
            setCheckoutOpen(true);
          }}
        >
          Continuer
          {selectedCents
            ? ` · ${selectedCredits} crédits · ${priceFormatter.format(selectedCents / 100)}`
            : ""}
        </Button>
      ) : null}

      {showExamples && examplesPlacement === "after" ? (
        <CreditExamples
          compact
          selectedCredits={selectedCredits}
          matchedExamples={matchedExamples}
          practiceRates={practiceRates}
        />
      ) : null}

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[19px] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === "gift" ? "Offrir ces crédits" : "Acheter ces crédits"}
            </DialogTitle>
            <DialogDescription>
              {selectedCredits} crédit{selectedCredits > 1 ? "s" : ""} ·{" "}
              {priceFormatter.format(selectedCents / 100)}
              {selectedCents
                ? ` · ${formatCreditRate(selectedCents, selectedCredits || 1)}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {mode === "gift" ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="gift-purchaser">Votre e-mail</Label>
                <Input
                  id="gift-purchaser"
                  type="email"
                  autoComplete="email"
                  value={purchaserEmail}
                  onChange={(event) => setPurchaserEmail(event.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-black/70">
                <input
                  type="checkbox"
                  checked={sameRecipient}
                  onChange={(event) => setSameRecipient(event.target.checked)}
                  className="rounded border-black/20"
                />
                Envoyer le code à mon adresse
              </label>
              {!sameRecipient ? (
                <div className="space-y-2">
                  <Label htmlFor="gift-recipient">E-mail du destinataire</Label>
                  <Input
                    id="gift-recipient"
                    type="email"
                    value={recipientEmail}
                    onChange={(event) => setRecipientEmail(event.target.value)}
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="gift-message">Message personnel (optionnel)</Label>
                <Textarea
                  id="gift-message"
                  rows={3}
                  value={personalMessage}
                  onChange={(event) => setPersonalMessage(event.target.value)}
                />
              </div>
              <Button
                type="button"
                className="w-full rounded-[12px] bg-[#4a56dd] hover:bg-[#3844c8]"
                disabled={loading || (selectedId === "custom" ? !customQuote : !selectedPack)}
                onClick={() => void payGift()}
              >
                {loading
                  ? "Chargement..."
                  : `Payer ${priceFormatter.format(selectedCents / 100)}`}
              </Button>
              <p className="text-xs text-black/55">
                Crédits valables un an. Aucun compte requis pour offrir.
              </p>
            </div>
          ) : selectedId === "custom" ? (
            <Button
              type="button"
              className="w-full rounded-[12px] bg-[#f56800] hover:bg-[#d95700]"
              disabled={loading || !customQuote}
              onClick={() => void payCustomCredits()}
            >
              {loading
                ? "Chargement..."
                : `Payer ${priceFormatter.format(selectedCents / 100)}`}
            </Button>
          ) : selectedPack ? (
            <SquareCheckoutButton
              productId={selectedPack.id}
              isLoggedIn={isLoggedIn}
              returnPath={returnPath}
              className="inline-flex w-full justify-center rounded-[12px] bg-[#f56800] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d95700]"
            >
              Payer {priceFormatter.format(selectedPack.amountCents / 100)}
            </SquareCheckoutButton>
          ) : (
            <p className="text-sm text-black/50">Paiement indisponible pour ce pack.</p>
          )}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreditExamples({
  compact,
  selectedCredits,
  matchedExamples,
  practiceRates,
}: {
  compact: boolean;
  selectedCredits: number;
  matchedExamples: CreditCourseExample[];
  practiceRates: PracticeCreditRate[];
}) {
  return (
    <div
      className={
        compact
          ? "rounded-[12px] border border-black/10 bg-[#fafafa] p-3"
          : "rounded-[16px] border border-black/10 bg-white p-5 md:p-6"
      }
    >
      <p
        className={
          compact
            ? "text-sm font-semibold text-black/75"
            : "text-xl font-semibold text-black/85"
        }
      >
        {selectedCredits > 0
          ? `Avec ${selectedCredits} crédit${selectedCredits > 1 ? "s" : ""}, par exemple`
          : "Exemples de cours"}
      </p>
      {matchedExamples.length === 0 ? (
        <p className={compact ? "mt-2 text-xs text-black/55" : "mt-3 text-base text-black/55"}>
          Ces crédits couvrent aussi la pratique libre. Aucun cours listé ne
          tient dans ce nombre pour le moment.
        </p>
      ) : (
        <ul className={compact ? "mt-3 grid gap-2 sm:grid-cols-3" : "mt-5 grid gap-4 sm:grid-cols-3"}>
          {matchedExamples.map((example) => (
            <li
              key={example.activityId}
              className="overflow-hidden rounded-[12px] border border-black/10 bg-white"
            >
              <img
                src={example.imageUrl}
                alt=""
                className={compact ? "aspect-[16/9] w-full object-cover" : "aspect-[4/3] w-full object-cover"}
              />
              <div className={compact ? "p-2" : "p-4"}>
                <p
                  className={
                    compact
                      ? "text-sm font-medium leading-snug text-black/85"
                      : "text-lg font-semibold leading-snug text-black/90"
                  }
                >
                  {example.name}
                </p>
                <p className={compact ? "mt-1 text-xs text-black/50" : "mt-1.5 text-sm text-black/55"}>
                  {example.credits} crédit{example.credits > 1 ? "s" : ""}
                  {example.nextSessionStart
                    ? ` · ${dateFormatter.format(new Date(example.nextSessionStart))}`
                    : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {selectedCredits > 0 && practiceRates.length > 0 ? (
        <div className={compact ? "mt-3 grid gap-2 sm:grid-cols-2" : "mt-4 grid gap-3 sm:grid-cols-2"}>
          {(
            [
              ["autonomie", "Autonomie"],
              ["autonomie_encadree", "Autonomie encadrée"],
            ] as const
          ).map(([type, label]) => {
            const rates = practiceRates.filter((rate) => rate.type === type);
            if (rates.length === 0) return null;
            return (
              <div key={type}>
                <p className={compact ? "text-xs font-medium text-black/70" : "text-sm font-medium text-black/75"}>
                  {label}
                </p>
                <ul className={compact ? "mt-0.5 space-y-0.5 text-xs text-black/55" : "mt-1 space-y-0.5 text-sm text-black/60"}>
                  {rates.map((rate) => {
                    const hours = practiceHoursLabel(
                      selectedCredits,
                      rate.creditsPerHour,
                    );
                    return (
                      <li key={rate.id}>
                        {rate.name.replace(/ en autonomie encadrée$/i, "").replace(/ en autonomie$/i, "")}
                        {hours ? ` · ${hours}` : ""}
                        <span className="text-black/40">
                          {" "}
                          ({rate.creditsPerHour} cr/h)
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
