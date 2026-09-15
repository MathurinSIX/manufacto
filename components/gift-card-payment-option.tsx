"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type GiftCardPaymentOptionProps = {
  activityId?: string;
  sessionId?: string;
  requiredCredits?: number;
  requiredAmountCents?: number;
  participantCount?: number;
  disabled?: boolean;
  onRedeem: (code: string) => Promise<void>;
  className?: string;
};

export function GiftCardPaymentOption({
  activityId,
  sessionId,
  requiredCredits,
  requiredAmountCents,
  participantCount,
  disabled = false,
  onRedeem,
  className,
}: GiftCardPaymentOptionProps) {
  const [expanded, setExpanded] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validated, setValidated] = useState<string | null>(null);

  async function handleValidate() {
    setLoading(true);
    setError(null);
    setValidated(null);

    try {
      const response = await fetch("/api/gift-cards/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          activityId,
          sessionId,
          requiredCredits,
          requiredAmountCents,
          participantCount,
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        kind?: string;
        creditsRemaining?: number;
      };

      if (!payload.ok) {
        throw new Error(payload.error ?? "Code invalide");
      }

      setValidated(
        payload.kind === "credits"
          ? `${payload.creditsRemaining} crédit${payload.creditsRemaining !== 1 ? "s" : ""} disponibles`
          : "Carte cadeau valide pour ce cours",
      );
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : "Code invalide",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRedeem() {
    setLoading(true);
    setError(null);

    try {
      await onRedeem(code.trim());
    } catch (redeemError) {
      setError(
        redeemError instanceof Error ? redeemError.message : "Utilisation impossible",
      );
      setLoading(false);
    }
  }

  if (!expanded) {
    return (
      <Button
        type="button"
        variant="outline"
        className={cn("w-full sm:w-auto", className)}
        disabled={disabled}
        onClick={() => setExpanded(true)}
      >
        Carte cadeau
      </Button>
    );
  }

  return (
    <div className={cn("w-full space-y-2 rounded-[12px] border border-black/10 bg-[#fff8f0] p-3", className)}>
      <p className="text-sm font-semibold text-black/80">Carte cadeau</p>
      <Input
        value={code}
        onChange={(event) => {
          setCode(event.target.value.toUpperCase());
          setValidated(null);
          setError(null);
        }}
        placeholder="MANU-XXXX-XXXX"
        autoComplete="off"
        disabled={disabled || loading}
      />
      {validated ? (
        <p className="text-xs text-green-700">{validated}</p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || loading || !code.trim()}
          onClick={() => void handleValidate()}
        >
          Vérifier
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={disabled || loading || !code.trim()}
          onClick={() => void handleRedeem()}
        >
          {loading ? "Réservation..." : "Réserver avec la carte"}
        </Button>
      </div>
    </div>
  );
}
