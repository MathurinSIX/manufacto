"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBackToLogin?: () => void;
}

export function ForgotPasswordModal({
  open,
  onOpenChange,
  onBackToLogin,
}: ForgotPasswordModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] z-[60]">
        <DialogHeader>
          <DialogTitle>Réinitialiser votre mot de passe</DialogTitle>
          <DialogDescription>
            Entrez votre e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ForgotPasswordForm 
            onSwitchToLogin={onBackToLogin || (() => onOpenChange(false))} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

