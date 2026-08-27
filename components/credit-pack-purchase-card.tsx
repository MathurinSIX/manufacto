"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import { SquareCheckoutButton } from "@/components/square-checkout-button";
import { Button } from "@/components/ui/button";
import {
  MAX_CREDIT_UNIT_QUANTITY,
  clampCreditUnitQuantity,
} from "@/lib/square/products";
import { cn } from "@/lib/utils";

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

type CreditPackPurchaseCardProps = {
  productId: string;
  amountCents: number;
  credits: number;
  catalogObjectId?: string | null;
  isLoggedIn?: boolean;
  returnPath?: string;
  allowQuantity?: boolean;
  className?: string;
  buttonClassName?: string;
};

export function CreditPackPurchaseCard({
  productId,
  amountCents,
  credits,
  catalogObjectId,
  isLoggedIn = true,
  returnPath,
  allowQuantity = false,
  className,
  buttonClassName,
}: CreditPackPurchaseCardProps) {
  const [quantity, setQuantity] = useState(1);
  const safeQuantity = allowQuantity ? clampCreditUnitQuantity(quantity) : 1;
  const totalCents = amountCents * safeQuantity;
  const totalCredits = credits * safeQuantity;

  return (
    <div
      className={cn(
        "flex min-h-[155px] flex-col items-center justify-center rounded-[14px] border border-[#f56800]/70 bg-[#fff8f0] p-3 text-center",
        className,
      )}
    >
      <p className="text-[34px] leading-none">
        {priceFormatter.format(amountCents / 100)}
      </p>
      <p className="text-lg leading-none">
        {credits} crédit{credits > 1 ? "s" : ""}
      </p>

      {allowQuantity ? (
        <div className="mt-3 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0 border-[#f56800]/40"
            disabled={safeQuantity <= 1}
            onClick={() => setQuantity(clampCreditUnitQuantity(safeQuantity - 1))}
            aria-label="Retirer un crédit"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="min-w-[4.5rem] text-sm font-semibold tabular-nums text-black/75">
            {safeQuantity} / {MAX_CREDIT_UNIT_QUANTITY}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0 border-[#f56800]/40"
            disabled={safeQuantity >= MAX_CREDIT_UNIT_QUANTITY}
            onClick={() => setQuantity(clampCreditUnitQuantity(safeQuantity + 1))}
            aria-label="Ajouter un crédit"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : null}

      {allowQuantity && safeQuantity > 1 ? (
        <p className="mt-1 text-xs leading-snug text-black/55">
          Total {priceFormatter.format(totalCents / 100)} · {totalCredits} crédits
        </p>
      ) : null}

      {catalogObjectId ? (
        <SquareCheckoutButton
          productId={productId}
          quantity={safeQuantity}
          isLoggedIn={isLoggedIn}
          returnPath={returnPath}
          className={cn("mt-3", buttonClassName)}
        >
          Acheter
        </SquareCheckoutButton>
      ) : (
        <p className="mt-3 text-xs leading-snug text-black/50">
          Paiement indisponible
        </p>
      )}
    </div>
  );
}
