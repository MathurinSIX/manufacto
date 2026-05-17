"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import {
  fetchSquareApiCatalog,
  getInternalProductsWithMappings,
  getSquareAdminContext,
  setSquareProductMapping,
  type InternalProductWithMappings,
} from "@/app/admin/actions";
import type { SquareCatalogVariationOption } from "@/lib/square/catalog-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SquareVariationPicker } from "@/components/square-variation-picker";

function formatPrice(amountCents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function MappingCell({
  mapping,
}: {
  mapping?: { catalog_label: string; catalog_object_id: string };
}) {
  if (!mapping) {
    return <span className="text-muted-foreground">Non lié</span>;
  }

  return (
    <div className="space-y-1">
      <p className="font-medium text-black">{mapping.catalog_label}</p>
      <code className="break-all text-xs text-muted-foreground">
        {mapping.catalog_object_id}
      </code>
    </div>
  );
}

function ProductTable({
  title,
  description,
  products,
  onLink,
}: {
  title: string;
  description: string;
  products: InternalProductWithMappings[];
  onLink: (product: InternalProductWithMappings) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-[14px] border border-black/10 bg-[#fff8f0] p-5">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-black/70">{description}</p>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[#f2f2f2] text-black/70">
                <th className="p-4 text-left font-semibold">Produit interne</th>
                <th className="p-4 text-left font-semibold">Tarif</th>
                <th className="p-4 text-left font-semibold">Produit Square</th>
                <th className="p-4 text-right font-semibold">Liaisons Square</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 bg-white">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">
                    Aucun produit interne
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.slug}>
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="font-medium text-black">{product.name}</p>
                        <code className="text-xs text-muted-foreground">{product.slug}</code>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p>{formatPrice(product.amount_cents)}</p>
                        <p className="text-xs text-muted-foreground">
                          {Number(product.credits)} crédits
                        </p>
                      </div>
                    </td>
                    <td className="max-w-[280px] p-4">
                      <MappingCell mapping={product.mapping} />
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onLink(product)}
                        >
                          Lier
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AdminSquareTab() {
  const [products, setProducts] = useState<InternalProductWithMappings[]>([]);
  const [squareVariations, setSquareVariations] = useState<SquareCatalogVariationOption[]>([]);
  const [activeEnvironment, setActiveEnvironment] = useState<"sandbox" | "production">("sandbox");
  const [environmentLabel, setEnvironmentLabel] = useState("Sandbox");
  const [loading, setLoading] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkingProduct, setLinkingProduct] = useState<InternalProductWithMappings | null>(null);
  const [selectedVariationId, setSelectedVariationId] = useState<string>("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [context, productsResult] = await Promise.all([
        getSquareAdminContext(),
        getInternalProductsWithMappings(),
      ]);

      setActiveEnvironment(context.environment);
      setEnvironmentLabel(context.environmentLabel);

      if (productsResult.error) {
        setError(productsResult.error);
      } else {
        setProducts(productsResult.products);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const subscriptionProducts = useMemo(
    () => products.filter((product) => product.kind === "subscription"),
    [products],
  );

  const oneTimeProducts = useMemo(
    () =>
      products.filter(
        (product) => product.kind === "credit_pack" || product.kind === "discovery",
      ),
    [products],
  );

  const handleRefreshCatalog = async () => {
    setLoadingCatalog(true);
    setError(null);

    const result = await fetchSquareApiCatalog();
    if (result.error) {
      setError(result.error);
    } else {
      setSquareVariations(result.variations);
      setActiveEnvironment(result.environment);
      setEnvironmentLabel(result.environmentLabel);
      setSuccess(
        `${result.variations.length} variation(s) chargée(s) depuis Square (${result.environmentLabel}).`,
      );
    }

    setLoadingCatalog(false);
  };

  const handleOpenLinkDialog = (product: InternalProductWithMappings) => {
    const existing = product.mapping;
    setLinkingProduct(product);
    setSelectedVariationId(existing?.catalog_object_id ?? "");
    setLinkDialogOpen(true);
  };

  const handleSaveLink = async () => {
    if (!linkingProduct) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    const variation = squareVariations.find((item) => item.id === selectedVariationId);
    const result = await setSquareProductMapping({
      internalSlug: linkingProduct.slug,
      catalogObjectId: selectedVariationId || null,
      catalogLabel: variation?.label,
    });

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    setSuccess("Liaison Square enregistrée.");
    setLinkDialogOpen(false);
    setLinkingProduct(null);
    setSaving(false);
    await loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="rounded-[14px] border border-black/10 bg-[#fff8f0] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Liaison Square ↔ produits internes</h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-black/70">
              Les produits internes sont définis en dur dans le code. Cet écran
              sert uniquement à lier chaque identifiant interne à une variation
              Square dans l&apos;environnement actuellement configuré.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">API : {environmentLabel}</Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefreshCatalog}
              disabled={loadingCatalog}
            >
              {loadingCatalog ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Charger le catalogue Square
            </Button>
          </div>
        </div>
        {squareVariations.length > 0 ? (
          <p className="mt-3 text-xs text-black/60">
            {squareVariations.length} variation(s) Square disponibles pour l&apos;environnement{" "}
            {environmentLabel}. Environnement actif côté serveur :{" "}
            <strong>{activeEnvironment}</strong>.
          </p>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">{success}</div>
      ) : null}

      <ProductTable
        title="Abonnements"
        description="Formules mensuelles — identifiants internes stables, IDs Square par environnement."
        products={subscriptionProducts}
        onLink={handleOpenLinkDialog}
      />

      <ProductTable
        title="Paiements uniques"
        description="Packs de crédits et packs découverte."
        products={oneTimeProducts}
        onLink={handleOpenLinkDialog}
      />

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-h-[min(90vh,40rem)] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lier au produit Square</DialogTitle>
            <DialogDescription className="space-y-1.5 text-left">
              <span className="block">
                Produit interne{" "}
                <code className="break-all text-xs">{linkingProduct?.slug}</code>
              </span>
              <span className="block font-medium text-foreground">
                {linkingProduct?.name}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid min-w-0 gap-4 py-2">
            <SquareVariationPicker
              active={linkDialogOpen}
              value={selectedVariationId}
              onChange={setSelectedVariationId}
              onVariationsLoaded={setSquareVariations}
              description={
                linkingProduct?.kind === "subscription"
                  ? "Choisissez l'article Square attaché à un plan d'abonnement (champ « Subscription plans » dans l'article)."
                  : undefined
              }
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLinkDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button type="button" onClick={handleSaveLink} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
