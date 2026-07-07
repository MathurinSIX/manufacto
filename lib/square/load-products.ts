import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_SQUARE_PRODUCTS,
  type SquareProduct,
} from "@/lib/square/products";

type MappingRow = {
  internal_slug: string;
  catalog_object_id: string;
  catalog_label: string;
};

function applyMappingToProduct(
  product: SquareProduct,
  mapping: MappingRow | undefined,
): SquareProduct {
  return {
    ...product,
    catalogObjectId: mapping?.catalog_object_id ?? null,
    catalogLabel: mapping?.catalog_label ?? null,
  };
}

export async function loadSquareProducts(
  supabase?: SupabaseClient,
): Promise<SquareProduct[]> {
  const client = supabase ?? (await createClient());

  const { data: mappings, error: mappingsError } = await client
    .from("square_product_mapping")
    .select("internal_slug, catalog_object_id, catalog_label");

  if (mappingsError) {
    return DEFAULT_SQUARE_PRODUCTS;
  }

  const mappingBySlug = new Map(
    (mappings as MappingRow[]).map((mapping) => [mapping.internal_slug, mapping]),
  );

  return DEFAULT_SQUARE_PRODUCTS.map((product) =>
    applyMappingToProduct(product, mappingBySlug.get(product.id)),
  );
}

export async function getSquareProduct(
  productId: string,
  supabase?: SupabaseClient,
): Promise<SquareProduct | null> {
  const products = await loadSquareProducts(supabase);
  return products.find((product) => product.id === productId) ?? null;
}

export async function getSquareProductByCatalogObjectId(
  catalogObjectId: string,
  supabase?: SupabaseClient,
): Promise<SquareProduct | null> {
  const normalizedCatalogId = catalogObjectId.trim();
  if (!normalizedCatalogId) {
    return null;
  }

  const products = await loadSquareProducts(supabase);
  return (
    products.find(
      (product) =>
        product.catalogObjectId?.trim() === normalizedCatalogId &&
        product.kind === "credit_pack",
    ) ?? null
  );
}
