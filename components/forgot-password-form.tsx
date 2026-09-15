"use client";

import { cn } from "@/lib/utils";
import { requestPasswordReset } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useId, useState } from "react";

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
  const emailId = useId();
  const linkClass =
    "font-semibold text-[#4a56dd] underline underline-offset-2 transition hover:text-[#3540bf]";
  const inputClass =
    "h-12 rounded-[12px] border-black/15 bg-[#fff8f0] px-4 text-base text-black shadow-none placeholder:text-black/35 focus-visible:border-[#4a56dd]/40 focus-visible:ring-[#4a56dd]/30";

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await requestPasswordReset(email);
      if (result.error) throw new Error(result.error);
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
        <div className="space-y-4">
          <p className="rounded-[12px] border border-[#20b75a]/25 bg-[#20b75a]/10 px-4 py-3 text-sm font-medium text-[#157a3c]">
            Si un compte existe avec cet e-mail, vous recevrez un lien de
            réinitialisation. Vérifiez votre boîte de réception.
          </p>
          {onSwitchToLogin ? (
            <button type="button" onClick={onSwitchToLogin} className={linkClass}>
              Retour à la connexion
            </button>
          ) : (
            <Link href="/auth/login" className={linkClass}>
              Retour à la connexion
            </Link>
          )}
        </div>
      ) : (
        <form onSubmit={handleForgotPassword}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor={emailId} className="text-base font-semibold text-black/80">
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
            {error && (
              <p className="rounded-[12px] border border-[#d73459]/25 bg-[#d73459]/8 px-4 py-3 text-sm font-medium text-[#a01f3d]">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="h-12 w-full rounded-[12px] bg-[#f56800] text-base font-semibold text-white shadow-none transition hover:bg-[#d95700]"
              disabled={isLoading}
            >
              {isLoading ? "Envoi..." : "Envoyer le lien"}
            </Button>
            <p className="text-center text-base text-black/70">
              Vous avez déjà un compte ?{" "}
              {onSwitchToLogin ? (
                <button type="button" onClick={onSwitchToLogin} className={linkClass}>
                  Se connecter
                </button>
              ) : (
                <Link href="/auth/login" className={linkClass}>
                  Se connecter
                </Link>
              )}
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
