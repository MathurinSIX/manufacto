"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adjustUserCredits } from "@/app/admin/actions";
import { Loader2 } from "lucide-react";

type CreditMode = "add" | "remove";

interface AdminAdjustCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
  currentCredits?: number;
  onSuccess?: () => void;
}

export function AdminAdjustCreditsDialog({
  open,
  onOpenChange,
  userId,
  userEmail,
  currentCredits,
  onSuccess,
}: AdminAdjustCreditsDialogProps) {
  const [mode, setMode] = useState<CreditMode>("add");
  const [creditAmount, setCreditAmount] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setCreditAmount("");
    setMode("add");
    setError(null);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setAdjusting(true);
    setError(null);

    try {
      const parsedAmount = parseFloat(creditAmount);

      if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        setError("Le montant doit être un nombre positif");
        return;
      }

      const signedAmount = mode === "add" ? parsedAmount : -parsedAmount;
      const result = await adjustUserCredits(userId, signedAmount);

      if (result.error) {
        setError(result.error);
      } else {
        handleClose(false);
        onSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>gérer les crédits</DialogTitle>
            <DialogDescription>
              Ajoutez ou retirez des crédits pour {userEmail}
              {typeof currentCredits === "number" && (
                <> (solde actuel : {Math.round(currentCredits)})</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Tabs
              value={mode}
              onValueChange={(value) => {
                setMode(value as CreditMode);
                setError(null);
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="add">Ajouter</TabsTrigger>
                <TabsTrigger value="remove">Retirer</TabsTrigger>
              </TabsList>
              <TabsContent value="add" className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Entrez le nombre de crédits à ajouter au compte.
                </p>
              </TabsContent>
              <TabsContent value="remove" className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Entrez le nombre de crédits à retirer du compte.
                </p>
              </TabsContent>
            </Tabs>
            <div className="grid gap-2">
              <Label htmlFor="creditAmount">Montant *</Label>
              <Input
                id="creditAmount"
                type="number"
                step="0.5"
                min="0.5"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                required
                placeholder="Ex: 10"
              />
            </div>
          </div>
          {error && (
            <div className="text-sm text-destructive mb-4">{error}</div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              variant={mode === "remove" ? "destructive" : "default"}
              disabled={adjusting || !creditAmount}
            >
              {adjusting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === "add" ? "Ajout..." : "Retrait..."}
                </>
              ) : mode === "add" ? (
                "ajouter"
              ) : (
                "retirer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
