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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useId } from "react";

interface LoginFormProps extends React.ComponentPropsWithoutRef<"div"> {
  onSwitchToSignUp?: () => void;
  onSwitchToForgotPassword?: () => void;
  onSuccess?: () => void;
  redirectTo?: string;
}

export function LoginForm({
  className,
  onSwitchToSignUp,
  onSwitchToForgotPassword,
  onSuccess,
  redirectTo,
  ...props
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Call onSuccess callback if provided, otherwise redirect
      if (onSuccess) {
        onSuccess();
      } else if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push("/");
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Veuillez entrer votre adresse e-mail");
      return;
    }
    const supabase = createClient();
    setIsMagicLinkLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      setMagicLinkSent(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Une erreur s'est produite");
    } finally {
      setIsMagicLinkLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-0 shadow-none">
        <CardContent className="px-0">
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor={emailId}>E-mail</Label>
                <Input
                  id={emailId}
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor={passwordId}>Mot de passe</Label>
                  {onSwitchToForgotPassword ? (
                    <button
                      type="button"
                      onClick={onSwitchToForgotPassword}
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  ) : (
                    <Link
                      href="/auth/forgot-password"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Mot de passe oublié ?
                    </Link>
                  )}
                </div>
                <Input
                  id={passwordId}
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              {magicLinkSent && (
                <p className="text-sm text-green-600">
                  Un lien de connexion a été envoyé à votre adresse e-mail. Vérifiez votre boîte de réception.
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Ou</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isMagicLinkLoading || !email}
                onClick={handleMagicLink}
              >
                {isMagicLinkLoading ? "Envoi..." : "Se connecter avec un lien magique"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Vous n&apos;avez pas de compte ?{" "}
              {onSwitchToSignUp ? (
                <button
                  type="button"
                  onClick={onSwitchToSignUp}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  S&apos;inscrire
                </button>
              ) : (
                <Link
                  href="/auth/sign-up"
                  className="underline underline-offset-4"
                >
                  S&apos;inscrire
                </Link>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
