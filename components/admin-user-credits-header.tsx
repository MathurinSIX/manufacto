"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdminAdjustCreditsDialog } from "@/components/admin-adjust-credits-dialog";
import { Coins } from "lucide-react";

interface AdminUserCreditsHeaderProps {
  userId: string;
  userEmail: string;
  totalCredits: number;
}

export function AdminUserCreditsHeader({
  userId,
  userEmail,
  totalCredits,
}: AdminUserCreditsHeaderProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-background">
          <span className="text-sm font-medium">Crédits :</span>
          <span className="text-sm font-bold">{Math.round(totalCredits)}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setDialogOpen(true)}
        >
          <Coins className="h-4 w-4 mr-2" />
          gérer les crédits
        </Button>
      </div>
      <AdminAdjustCreditsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userId={userId}
        userEmail={userEmail}
        currentCredits={totalCredits}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
