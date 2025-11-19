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
import { useRouter } from "next/navigation";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: "login" | "signup";
  onSuccess?: () => void;
}

export function AuthModal({
  open,
  onOpenChange,
  defaultView = "login",
  onSuccess,
}: AuthModalProps) {
  const [view, setView] = useState<"login" | "signup">(defaultView);
  const router = useRouter();

  // Reset view when modal opens
  useEffect(() => {
    if (open) {
      setView(defaultView);
    }
  }, [open, defaultView]);

  const handleViewChange = (newView: "login" | "signup") => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {view === "login" ? "Connectez-vous à votre compte" : "Créer un compte"}
          </DialogTitle>
          <DialogDescription>
            {view === "login"
              ? "Entrez vos identifiants pour accéder à votre compte"
              : "Inscrivez-vous pour commencer"}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {view === "login" ? (
            <LoginForm
              onSwitchToSignUp={() => handleViewChange("signup")}
              onSuccess={handleAuthSuccess}
            />
          ) : (
            <SignUpForm
              onSwitchToLogin={() => handleViewChange("login")}
              onSuccess={handleAuthSuccess}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

