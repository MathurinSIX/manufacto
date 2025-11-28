"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth-modal";
import { useRouter } from "next/navigation";

export function LoginButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleAuthSuccess = () => {
    setIsModalOpen(false);
    // Refresh the page to update the UI
    router.refresh();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
      >
        Me connecter
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

