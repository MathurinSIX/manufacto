"use client";

import { useState } from "react";

import { LoginForm } from "@/components/login-form";
import { SignUpForm } from "@/components/sign-up-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AuthView = "signup" | "login";

type ReservationAuthStepProps = {
  onSuccess: () => void | Promise<void>;
  description?: string;
};

const DEFAULT_DESCRIPTION =
  "Créez un compte ou connectez-vous. Votre session reste sélectionnée et vous pourrez ensuite payer en ligne ou utiliser vos crédits.";

export function ReservationAuthStep({
  onSuccess,
  description = DEFAULT_DESCRIPTION,
}: ReservationAuthStepProps) {
  const [authView, setAuthView] = useState<AuthView>("signup");

  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="mb-4">
        <p className="text-sm font-semibold">Finalisez votre réservation</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Tabs
        value={authView}
        onValueChange={(value) => setAuthView(value as AuthView)}
      >
        <TabsList className="grid h-auto w-full grid-cols-2">
          <TabsTrigger value="signup">Créer un compte</TabsTrigger>
          <TabsTrigger value="login">J&apos;ai déjà un compte</TabsTrigger>
        </TabsList>
        <TabsContent value="signup" className="mt-4">
          <SignUpForm
            onSwitchToLogin={() => setAuthView("login")}
            onSuccess={onSuccess}
          />
        </TabsContent>
        <TabsContent value="login" className="mt-4">
          <LoginForm
            onSwitchToSignUp={() => setAuthView("signup")}
            onSuccess={onSuccess}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
