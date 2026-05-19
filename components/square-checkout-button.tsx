"use client";

import { useState } from "react";

import { AuthModal } from "@/components/auth-modal";
import { Button, type ButtonProps } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

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
}: SquareCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(isLoggedIn);
  const buttonVariant = variant === "button" ? "default" : variant;

  async function startCheckout(options?: { skipAuthCheck?: boolean }) {
    if (!options?.skipAuthCheck && !isAuthenticated) {
      setAuthOpen(true);
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
        setIsAuthenticated(false);
        setAuthOpen(true);
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

  async function handleAuthSuccess() {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setError(
        "Compte créé. Vérifiez votre e-mail, puis connectez-vous pour finaliser l'achat.",
      );
      return;
    }

    setIsAuthenticated(true);
    setAuthOpen(false);
    await startCheckout({ skipAuthCheck: true });
  }

  return (
    <div>
      <Button
        type="button"
        onClick={() => void startCheckout()}
        disabled={loading || disabled}
        variant={buttonVariant}
        size={size}
        className={className}
      >
        {loading ? "Chargement..." : children}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        defaultView="signup"
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
