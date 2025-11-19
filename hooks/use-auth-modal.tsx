"use client";

import { useState } from "react";
import { AuthModal } from "@/components/auth-modal";
import { useRouter } from "next/navigation";

export function useAuthModal(defaultView: "login" | "signup" = "login") {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"login" | "signup">(defaultView);
  const router = useRouter();

  const openModal = (modalView?: "login" | "signup") => {
    if (modalView) {
      setView(modalView);
    }
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleSuccess = () => {
    closeModal();
    router.refresh();
  };

  const AuthModalComponent = () => (
    <AuthModal
      open={isOpen}
      onOpenChange={setIsOpen}
      defaultView={view}
      onSuccess={handleSuccess}
    />
  );

  return {
    openModal,
    closeModal,
    AuthModalComponent,
  };
}

