"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { fetchSquareApiCatalog } from "@/app/admin/actions";
import type { SquareCatalogVariationOption } from "@/lib/square/catalog-api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatPrice(amountCents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

type SquareVariationPickerProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
  noneLabel?: string;
  placeholder?: string;
  description?: string;
  /** When true, loads the catalog if empty (e.g. when a dialog opens). */
  active?: boolean;
  onVariationsLoaded?: (variations: SquareCatalogVariationOption[]) => void;
};

export function SquareVariationPicker({
  value,
  onChange,
  id,
  label = "Variation Square",
  noneLabel = "Aucune liaison",
  placeholder = "Choisir une variation du catalogue Square",
  description,
  active = true,
  onVariationsLoaded,
}: SquareVariationPickerProps) {
  const [squareVariations, setSquareVariations] = useState<SquareCatalogVariationOption[]>(
    [],
  );
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    setCatalogError(null);

    const result = await fetchSquareApiCatalog();
    if (result.error) {
      setCatalogError(result.error);
    } else {
      setSquareVariations(result.variations);
      onVariationsLoaded?.(result.variations);
    }

    setLoadingCatalog(false);
  }, [onVariationsLoaded]);

  useEffect(() => {
    if (active && squareVariations.length === 0 && !loadingCatalog) {
      void loadCatalog();
    }
  }, [active, squareVariations.length, loadingCatalog, loadCatalog]);

  return (
    <div className="grid min-w-0 gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => void loadCatalog()}
          disabled={loadingCatalog}
        >
          {loadingCatalog ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          )}
          Charger le catalogue
        </Button>
      </div>
      <Select
        value={value || "__none__"}
        onValueChange={(next) => onChange(next === "__none__" ? "" : next)}
        disabled={loadingCatalog && squareVariations.length === 0}
      >
        <SelectTrigger
          id={id}
          className="h-auto min-h-10 py-2.5 [&>span]:line-clamp-none [&>span]:whitespace-normal [&>span]:text-left"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-w-[min(42rem,calc(100vw-2rem))]">
          <SelectItem value="__none__">{noneLabel}</SelectItem>
          {squareVariations.map((variation) => (
            <SelectItem
              key={variation.id}
              value={variation.id}
              className="items-start py-2.5 [&>span:last-child]:whitespace-normal [&>span:last-child]:break-words"
            >
              {variation.label}
              {variation.amountCents != null
                ? ` (${formatPrice(variation.amountCents)})`
                : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {catalogError ? (
        <p className="text-xs text-destructive">{catalogError}</p>
      ) : null}
      {!squareVariations.length && !loadingCatalog && !catalogError ? (
        <p className="text-xs text-muted-foreground">
          Chargez le catalogue Square pour choisir une variation.
        </p>
      ) : null}
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      {value ? (
        <code className="break-all text-xs text-muted-foreground">{value}</code>
      ) : null}
    </div>
  );
}
