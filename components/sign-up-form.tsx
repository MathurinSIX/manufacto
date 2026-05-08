"use client";

import { cn } from "@/lib/utils";
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

interface SignUpFormProps extends React.ComponentPropsWithoutRef<"div"> {
  onSwitchToLogin?: () => void;
  onSuccess?: () => void;
}

export function SignUpForm({
  className,
  onSwitchToLogin,
  onSuccess,
  ...props
}: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const firstNameId = useId();
  const lastNameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const linkClass =
    "font-semibold text-[#4a56dd] underline underline-offset-2 transition hover:text-[#2f3bcc]";
  const inputClass =
    "h-12 rounded-[14px] border-black/20 bg-white px-4 text-base text-black shadow-none placeholder:text-black/35 focus-visible:ring-[#4a56dd]";
  const labelClass = "text-base font-semibold leading-none text-black/80";

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur s'est produite");
      }

      // Show success message - user needs to validate email before logging in
      setSuccess(true);
      
      // Call onSuccess callback if provided, otherwise redirect after a delay
      if (onSuccess) {
        // Small delay to show success message
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        // Small delay to show success message before redirect
        setTimeout(() => {
          router.push("/auth/sign-up-success");
        }, 2000);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Une erreur s'est produite");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-0 bg-transparent shadow-none">
        <CardContent className="px-0">
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor={firstNameId} className={labelClass}>
                  Prénom
                </Label>
                <Input
                  id={firstNameId}
                  type="text"
                  placeholder="Jean"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={lastNameId} className={labelClass}>
                  Nom
                </Label>
                <Input
                  id={lastNameId}
                  type="text"
                  placeholder="Dupont"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClass}
                />
              </div>
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
              {success && (
                <div className="rounded-[14px] border border-green-200 bg-green-50 p-4">
                  <p className="text-sm font-semibold text-green-800">
                    Compte créé avec succès !
                  </p>
                  <p className="mt-1 text-sm text-green-700">
                    Veuillez vérifier votre e-mail pour confirmer votre compte avant de vous connecter.
                  </p>
                </div>
              )}
              <Button
                type="submit"
                className="h-12 w-full rounded-[14px] bg-[#4a56dd] text-base font-semibold text-white shadow-none hover:bg-[#2f3bcc]"
                disabled={isLoading || success}
              >
                {isLoading ? "Création du compte..." : success ? "Compte créé" : "S'inscrire"}
              </Button>
            </div>
            <div className="mt-6 text-center text-base text-black/70">
              Vous avez déjà un compte ?{" "}
              {onSwitchToLogin ? (
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className={linkClass}
                >
                  Se connecter
                </button>
              ) : (
                <Link href="/auth/login" className={linkClass}>
                  Se connecter
                </Link>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
