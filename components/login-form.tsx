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
  const linkClass =
    "font-semibold text-[#4a56dd] underline underline-offset-2 transition hover:text-[#2f3bcc]";
  const inputClass =
    "h-12 rounded-[14px] border-black/20 bg-white px-4 text-base text-black shadow-none placeholder:text-black/35 focus-visible:ring-[#4a56dd]";
  const labelClass = "text-base font-semibold leading-none text-black/80";

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
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
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
      <Card className="border-0 bg-transparent shadow-none">
        <CardContent className="px-0">
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor={emailId} className={labelClass}>
                  E-mail
                </Label>
                <Input
                  id={emailId}
                  type="email"
                  placeholder="vous@exemple.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor={passwordId} className={labelClass}>
                    Mot de passe
                  </Label>
                  {onSwitchToForgotPassword ? (
                    <button
                      type="button"
                      onClick={onSwitchToForgotPassword}
                      className={cn("ml-auto inline-block text-sm", linkClass)}
                    >
                      Mot de passe oublié ?
                    </button>
                  ) : (
                    <Link
                      href="/auth/forgot-password"
                      className={cn("ml-auto inline-block text-sm", linkClass)}
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
                  className={inputClass}
                />
              </div>
              {error && (
                <p className="rounded-[14px] bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}
              {magicLinkSent && (
                <p className="rounded-[14px] bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  Un lien de connexion a été envoyé à votre adresse e-mail. Vérifiez votre boîte de réception.
                </p>
              )}
              <Button
                type="submit"
                className="h-12 w-full rounded-[14px] bg-[#4a56dd] text-base font-semibold text-white shadow-none hover:bg-[#2f3bcc]"
                disabled={isLoading}
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
              <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                <span className="h-px flex-1 bg-black/20" />
                <span>Ou</span>
                <span className="h-px flex-1 bg-black/20" />
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full rounded-[14px] border-black/25 bg-white text-base font-semibold text-black/80 shadow-none hover:bg-black/[0.04] hover:text-black"
                disabled={isMagicLinkLoading || !email}
                onClick={handleMagicLink}
              >
                {isMagicLinkLoading ? "Envoi..." : "Se connecter avec un lien magique"}
              </Button>
            </div>
            <div className="mt-6 text-center text-base text-black/70">
              Vous n&apos;avez pas de compte ?{" "}
              {onSwitchToSignUp ? (
                <button
                  type="button"
                  onClick={onSwitchToSignUp}
                  className={linkClass}
                >
                  S&apos;inscrire
                </button>
              ) : (
                <Link
                  href="/auth/sign-up"
                  className={linkClass}
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
