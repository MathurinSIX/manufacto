"use client";

import { useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";

type SquareCheckoutButtonProps = {
  productId: string;
  activityId?: string;
  sessionId?: string;
  reservationStart?: string;
  reservationEnd?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: ButtonProps["variant"] | "button";
  size?: ButtonProps["size"];
};

export function SquareCheckoutButton({
  productId,
  activityId,
  sessionId,
  reservationStart,
  reservationEnd,
  children,
  className,
  disabled = false,
  variant = "default",
  size,
}: SquareCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buttonVariant = variant === "button" ? "default" : variant;

  async function startCheckout() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/square/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          activityId,
          sessionId,
          reservationStart,
          reservationEnd,
        }),
      });
      const payload = (await response.json()) as {
        url?: string;
        error?: string;
      };

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
    <div>
      <Button
        type="button"
        onClick={startCheckout}
        disabled={loading || disabled}
        variant={buttonVariant}
        size={size}
        className={className}
      >
        {loading ? "Chargement..." : children}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
