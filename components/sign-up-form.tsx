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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });
      if (error) throw error;
      
      // Explicitly sign out to ensure user is not logged in until email is confirmed
      await supabase.auth.signOut();
      
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
        // Check if the error indicates the account already exists
        const errorMessage = error.message.toLowerCase();
        if (
          errorMessage.includes("user already registered") ||
          errorMessage.includes("email already registered") ||
          errorMessage.includes("already exists") ||
          errorMessage.includes("already registered") ||
          errorMessage.includes("user already exists")
        ) {
          setError("Un compte avec cet e-mail existe déjà. Veuillez vous connecter ou réinitialiser votre mot de passe.");
        } else {
          setError(error.message);
        }
      } else {
        setError("Une erreur s'est produite");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-0 shadow-none">
        <CardContent className="px-0">
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor={firstNameId}>Prénom</Label>
                <Input
                  id={firstNameId}
                  type="text"
                  placeholder="Jean"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={lastNameId}>Nom</Label>
                <Input
                  id={lastNameId}
                  type="text"
                  placeholder="Dupont"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
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
              {success && (
                <div className="rounded-md bg-green-50 p-4 border border-green-200">
                  <p className="text-sm text-green-800 font-medium">
                    Compte créé avec succès !
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Veuillez vérifier votre e-mail pour confirmer votre compte avant de vous connecter.
                  </p>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading || success}>
                {isLoading ? "Création du compte..." : success ? "Compte créé" : "S'inscrire"}
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
                <Link href="/auth/login" className="underline underline-offset-4">
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
