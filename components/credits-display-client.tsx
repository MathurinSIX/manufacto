"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth-modal";
import { useRouter } from "next/navigation";

interface CreditsDisplayClientProps {
  credits: number;
  isLoggedIn: boolean;
}

export function CreditsDisplayClient({
  credits,
  isLoggedIn,
}: CreditsDisplayClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // Ensure credits is a valid number
  const numericCredits = typeof credits === 'number' ? credits : parseFloat(String(credits)) || 0;
  const displayCredits = Math.round(numericCredits);

  const handleAuthSuccess = () => {
    setIsModalOpen(false);
    // Refresh the page to update the credits display
    router.refresh();
  };

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-background">
        <span className="text-sm font-medium">Crédits :</span>
        <span className="text-sm font-bold">{displayCredits}</span>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setIsModalOpen(true)}
      >
        <span className="text-sm font-medium">Crédits :</span>
        <span className="text-sm font-bold">0</span>
      </Button>
      <AuthModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        defaultView="login"
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}

