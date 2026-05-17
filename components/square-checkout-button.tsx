"use client";

import { useState } from "react";

type SquareCheckoutButtonProps = {
  productId: string;
  activityId?: string;
  sessionId?: string;
  reservationStart?: string;
  reservationEnd?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: "button" | "outline";
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
  variant = "button",
}: SquareCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading || disabled}
        className={
          className ??
          (variant === "outline"
            ? "inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium"
            : undefined)
        }
      >
        {loading ? "loading" : children}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

