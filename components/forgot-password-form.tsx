"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

interface ForgotPasswordFormProps extends React.ComponentPropsWithoutRef<"div"> {
  onSwitchToLogin?: () => void;
}

export function ForgotPasswordForm({
  className,
  onSwitchToLogin,
  ...props
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-2xl">Vérifiez Votre E-mail</CardTitle>
            <CardDescription>Instructions de réinitialisation du mot de passe envoyées</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <p className="text-sm text-muted-foreground">
              Si vous vous êtes inscrit en utilisant votre e-mail et votre mot de passe, vous recevrez
              un e-mail de réinitialisation du mot de passe.
            </p>
            {onSwitchToLogin && (
              <div className="mt-4 text-center text-sm">
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Retour à la connexion
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-none">
          <CardContent className="px-0">
            <form onSubmit={handleForgotPassword}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Envoi..." : "Envoyer l'e-mail de réinitialisation"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Vous avez déjà un compte ?{" "}
                {onSwitchToLogin ? (
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    Se connecter
                  </button>
                ) : (
                  <Link
                    href="/auth/login"
                    className="underline underline-offset-4"
                  >
                    Se connecter
                  </Link>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
