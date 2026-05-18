"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { buildSignUpUrl } from "@/lib/auth-redirect";

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
  isLoggedIn?: boolean;
  returnPath?: string;
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
  isLoggedIn = true,
  returnPath,
}: SquareCheckoutButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buttonVariant = variant === "button" ? "default" : variant;

  function getReturnPath() {
    if (returnPath) {
      return returnPath;
    }

    return pathname;
  }

  function redirectToSignUp() {
    router.push(buildSignUpUrl(getReturnPath()));
  }

  async function startCheckout() {
    if (!isLoggedIn) {
      redirectToSignUp();
      return;
    }

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

      if (response.status === 401) {
        redirectToSignUp();
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
