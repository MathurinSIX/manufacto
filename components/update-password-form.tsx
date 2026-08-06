"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

async function establishRecoverySession() {
  const supabase = createClient();
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(
    window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash,
  );

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return error.message;
    }

    const cleanUrl = `${window.location.pathname}`;
    window.history.replaceState({}, "", cleanUrl);
    return null;
  }

  const tokenHash =
    searchParams.get("token_hash") ?? hashParams.get("token_hash");
  const type = (searchParams.get("type") ?? hashParams.get("type")) as
    | "recovery"
    | "invite"
    | "magiclink"
    | "email"
    | null;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) {
      return error.message;
    }

    window.history.replaceState({}, "", window.location.pathname);
    return null;
  }

  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      return error.message;
    }

    window.history.replaceState({}, "", window.location.pathname);
    return null;
  }

  return null;
}

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const supabase = createClient();

      const exchangeError = await establishRecoverySession();
      if (cancelled) return;

      if (exchangeError) {
        setError(exchangeError);
        setIsReady(true);
        return;
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;

      if (sessionError) {
        setError(sessionError.message);
      } else if (!data.session) {
        setError(
          "Lien invalide ou expiré. Veuillez demander un nouvel e-mail de réinitialisation.",
        );
      } else {
        setHasSession(true);
      }

      setIsReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setIsLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      router.push("/account");
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardContent>
          <form onSubmit={handleForgotPassword}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Nouveau mot de passe"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!hasSession}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirmer le mot de passe"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={!hasSession}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !isReady || !hasSession}
              >
                {isLoading ? "Enregistrement..." : "Enregistrer le nouveau mot de passe"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
