"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoginForm } from "@/components/login-form";
import { SignUpForm } from "@/components/sign-up-form";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { useRouter } from "next/navigation";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: "login" | "signup" | "forgot-password";
  onSuccess?: () => void;
}

export function AuthModal({
  open,
  onOpenChange,
  defaultView = "login",
  onSuccess,
}: AuthModalProps) {
  const [view, setView] = useState<"login" | "signup" | "forgot-password">(defaultView);
  const router = useRouter();

  // Reset view when modal opens
  useEffect(() => {
    if (open) {
      setView(defaultView);
    }
  }, [open, defaultView]);

  const handleViewChange = (newView: "login" | "signup" | "forgot-password") => {
    setView(newView);
  };

  const handleAuthSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      // Default behavior: close modal and refresh
      onOpenChange(false);
      router.refresh();
    }
  };

  const getTitle = () => {
    switch (view) {
      case "login":
        return "Connectez-vous à votre compte";
      case "signup":
        return "Créer un compte";
      case "forgot-password":
        return "Réinitialiser votre mot de passe";
      default:
        return "Connectez-vous à votre compte";
    }
  };

  const getDescription = () => {
    switch (view) {
      case "login":
        return "Entrez vos identifiants pour accéder à votre compte";
      case "signup":
        return "Inscrivez-vous pour commencer";
      case "forgot-password":
        return "Entrez votre e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe";
      default:
        return "Entrez vos identifiants pour accéder à votre compte";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {view === "login" ? (
            <LoginForm
              onSwitchToSignUp={() => handleViewChange("signup")}
              onSwitchToForgotPassword={() => handleViewChange("forgot-password")}
              onSuccess={handleAuthSuccess}
            />
          ) : view === "signup" ? (
            <SignUpForm
              onSwitchToLogin={() => handleViewChange("login")}
              onSuccess={handleAuthSuccess}
            />
          ) : (
            <ForgotPasswordForm
              onSwitchToLogin={() => handleViewChange("login")}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

