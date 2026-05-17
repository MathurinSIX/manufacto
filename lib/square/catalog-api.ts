import { getSquareApiBaseUrl } from "@/lib/square/environment";

export type SquareCatalogVariationOption = {
  id: string;
  itemId: string;
  itemName: string;
  variationName: string;
  label: string;
  amountCents: number | null;
  currency: string;
};

export type SquareSubscriptionPlanVariationOption = {
  id: string;
  planId: string | null;
  planName: string;
  variationName: string;
  label: string;
  amountCents: number | null;
  currency: string;
  cadence: string | null;
};

type SquareMoney = {
  amount?: number;
  currency?: string;
};

type SquareCatalogVariation = {
  id?: string;
  type?: string;
  item_variation_data?: {
    name?: string;
    price_money?: SquareMoney;
  };
};

type SquareCatalogItem = {
  id?: string;
  type?: string;
  item_data?: {
    name?: string;
    variations?: SquareCatalogVariation[];
  };
};

type SquareSubscriptionPhase = {
  cadence?: string;
  recurring_price_money?: SquareMoney;
  ordinal?: number;
};

type SquareCatalogItemVariation = {
  id?: string;
  type?: "ITEM_VARIATION";
  item_variation_data?: {
    name?: string;
    price_money?: SquareMoney;
    subscription_plan_ids?: string[];
  };
};

type RetrieveCatalogObjectResponse = {
  object?:
    | SquareCatalogItemVariation
    | SquareCatalogSubscriptionPlan
    | SquareCatalogSubscriptionPlanVariation;
  related_objects?: Array<
    | SquareCatalogItemVariation
    | SquareCatalogSubscriptionPlan
    | SquareCatalogSubscriptionPlanVariation
  >;
  errors?: { detail?: string }[];
};

export type SquareSubscriptionResolution = {
  itemVariationId: string;
  planVariationId: string;
  priceCents: number | null;
  currency: string;
  planName: string;
  variationName: string;
};

type SquareCatalogSubscriptionPlanVariation = {
  id?: string;
  type?: "SUBSCRIPTION_PLAN_VARIATION";
  subscription_plan_variation_data?: {
    name?: string;
    subscription_plan_id?: string;
    phases?: SquareSubscriptionPhase[];
  };
};

type SquareCatalogSubscriptionPlan = {
  id?: string;
  type?: "SUBSCRIPTION_PLAN";
  subscription_plan_data?: {
    name?: string;
    subscription_plan_variations?: SquareCatalogSubscriptionPlanVariation[];
  };
};

type SearchCatalogItemsResponse = {
  items?: SquareCatalogItem[];
  cursor?: string;
  errors?: { detail?: string }[];
};

type SearchCatalogObjectsResponse = {
  objects?: Array<SquareCatalogSubscriptionPlanVariation | SquareCatalogSubscriptionPlan>;
  related_objects?: Array<SquareCatalogSubscriptionPlanVariation | SquareCatalogSubscriptionPlan>;
  cursor?: string;
  errors?: { detail?: string }[];
};

function getSquareHeaders() {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("Square access token is missing");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "Square-Version": process.env.SQUARE_API_VERSION ?? "2026-01-22",
  };
}

function variationToOption(
  item: SquareCatalogItem,
  variation: SquareCatalogVariation,
): SquareCatalogVariationOption | null {
  const variationId = variation.id;
  const itemId = item.id;
  const itemName = item.item_data?.name?.trim();

  if (!variationId || !itemId || !itemName) {
    return null;
  }

  const variationName =
    variation.item_variation_data?.name?.trim() || "Variation";
  const priceMoney = variation.item_variation_data?.price_money;

  return {
    id: variationId,
    itemId,
    itemName,
    variationName,
    label: `${itemName} — ${variationName}`,
    amountCents: priceMoney?.amount ?? null,
    currency: priceMoney?.currency ?? "EUR",
  };
}

function subscriptionVariationToOption(
  variation: SquareCatalogSubscriptionPlanVariation,
  planById: Map<string, string>,
): SquareSubscriptionPlanVariationOption | null {
  const variationId = variation.id;
  const data = variation.subscription_plan_variation_data;
  const variationName = data?.name?.trim();

  if (!variationId || !variationName) {
    return null;
  }

  const planId = data?.subscription_plan_id?.trim() || null;
  const planName = (planId ? planById.get(planId) : null) ?? "Abonnement Square";
  const recurringPhase = data?.phases
    ?.slice()
    .sort((left, right) => (left.ordinal ?? 0) - (right.ordinal ?? 0))
    .find((phase) => phase.recurring_price_money);
  const priceMoney = recurringPhase?.recurring_price_money;
  const cadence = recurringPhase?.cadence ?? null;

  return {
    id: variationId,
    planId,
    planName,
    variationName,
    label: `${planName} — ${variationName}`,
    amountCents: priceMoney?.amount ?? null,
    currency: priceMoney?.currency ?? "EUR",
    cadence,
  };
}

export async function listSquareCatalogVariations(): Promise<SquareCatalogVariationOption[]> {
  const variations: SquareCatalogVariationOption[] = [];
  let cursor: string | undefined;

  do {
    const response = await fetch(`${getSquareApiBaseUrl()}/v2/catalog/search-catalog-items`, {
      method: "POST",
      headers: getSquareHeaders(),
      body: JSON.stringify({
        limit: 100,
        cursor,
        archived_state: "ARCHIVED_STATE_NOT_ARCHIVED",
      }),
    });

    const payload = (await response.json()) as SearchCatalogItemsResponse;

    if (!response.ok) {
      const message =
        payload.errors?.map((error) => error.detail).filter(Boolean).join(", ") ||
        "Square catalog lookup failed";
      throw new Error(message);
    }

    for (const item of payload.items ?? []) {
      for (const variation of item.item_data?.variations ?? []) {
        const option = variationToOption(item, variation);
        if (option) {
          variations.push(option);
        }
      }
    }

    cursor = payload.cursor;
  } while (cursor);

  return variations.sort((left, right) => left.label.localeCompare(right.label, "fr"));
}

export async function listSquareSubscriptionPlanVariations(): Promise<
  SquareSubscriptionPlanVariationOption[]
> {
  const variations: SquareCatalogSubscriptionPlanVariation[] = [];
  const planById = new Map<string, string>();
  let planCursor: string | undefined;

  do {
    const response = await fetch(`${getSquareApiBaseUrl()}/v2/catalog/search`, {
      method: "POST",
      headers: getSquareHeaders(),
      body: JSON.stringify({
        limit: 100,
        cursor: planCursor,
        object_types: ["SUBSCRIPTION_PLAN"],
        include_deleted_objects: false,
        include_related_objects: true,
      }),
    });

    const payload = (await response.json()) as SearchCatalogObjectsResponse;

    if (!response.ok) {
      const message =
        payload.errors?.map((error) => error.detail).filter(Boolean).join(", ") ||
        "Square subscription catalog lookup failed";
      throw new Error(message);
    }

    for (const object of payload.objects ?? []) {
      if (object.type !== "SUBSCRIPTION_PLAN") {
        continue;
      }

      const planName = object.subscription_plan_data?.name?.trim();
      if (object.id && planName) {
        planById.set(object.id, planName);
      }

      for (const variation of object.subscription_plan_data?.subscription_plan_variations ?? []) {
        variations.push(variation);
      }
    }

    for (const object of payload.related_objects ?? []) {
      if (object.type === "SUBSCRIPTION_PLAN") {
        const planName = object.subscription_plan_data?.name?.trim();
        if (object.id && planName) {
          planById.set(object.id, planName);
        }
      }

      if (object.type === "SUBSCRIPTION_PLAN_VARIATION") {
        variations.push(object);
      }
    }

    planCursor = payload.cursor;
  } while (planCursor);

  let variationCursor: string | undefined;

  do {
    const response = await fetch(`${getSquareApiBaseUrl()}/v2/catalog/search`, {
      method: "POST",
      headers: getSquareHeaders(),
      body: JSON.stringify({
        limit: 100,
        cursor: variationCursor,
        object_types: ["SUBSCRIPTION_PLAN_VARIATION"],
        include_deleted_objects: false,
        include_related_objects: true,
      }),
    });

    const payload = (await response.json()) as SearchCatalogObjectsResponse;

    if (!response.ok) {
      const message =
        payload.errors?.map((error) => error.detail).filter(Boolean).join(", ") ||
        "Square subscription catalog lookup failed";
      throw new Error(message);
    }

    for (const object of payload.related_objects ?? []) {
      if (object.type === "SUBSCRIPTION_PLAN") {
        const planName = object.subscription_plan_data?.name?.trim();
        if (object.id && planName) {
          planById.set(object.id, planName);
        }
      }
    }

    for (const object of payload.objects ?? []) {
      if (object.type === "SUBSCRIPTION_PLAN_VARIATION") {
        variations.push(object);
      }
    }

    variationCursor = payload.cursor;
  } while (variationCursor);

  const variationById = new Map<string, SquareCatalogSubscriptionPlanVariation>();

  for (const variation of variations) {
    if (variation.id) {
      variationById.set(variation.id, variation);
    }
  }

  return Array.from(variationById.values())
    .map((variation) => subscriptionVariationToOption(variation, planById))
    .filter((variation): variation is SquareSubscriptionPlanVariationOption => Boolean(variation))
    .sort((left, right) => left.label.localeCompare(right.label, "fr"));
}

async function retrieveSquareCatalogObject(
  objectId: string,
  includeRelated = false,
): Promise<RetrieveCatalogObjectResponse> {
  const url = new URL(`${getSquareApiBaseUrl()}/v2/catalog/object/${objectId}`);
  if (includeRelated) {
    url.searchParams.set("include_related_objects", "true");
  }

  const response = await fetch(url, {
    method: "GET",
    headers: getSquareHeaders(),
  });

  const payload = (await response.json()) as RetrieveCatalogObjectResponse;

  if (!response.ok) {
    const message =
      payload.errors?.map((error) => error.detail).filter(Boolean).join(", ") ||
      "Square catalog object lookup failed";
    throw new Error(message);
  }

  return payload;
}

/**
 * Given a Square ITEM_VARIATION id linked to one or more subscription plans, resolve the
 * corresponding subscription plan variation that should be passed to the Checkout API.
 */
export async function resolveSquareSubscriptionFromItemVariation(
  itemVariationId: string,
): Promise<SquareSubscriptionResolution | null> {
  const variationPayload = await retrieveSquareCatalogObject(itemVariationId);
  const variationObject = variationPayload.object;

  if (!variationObject || variationObject.type !== "ITEM_VARIATION") {
    return null;
  }

  const data = (variationObject as SquareCatalogItemVariation).item_variation_data;
  const planIds = data?.subscription_plan_ids ?? [];
  const planId = planIds[0];

  if (!planId) {
    return null;
  }

  const planPayload = await retrieveSquareCatalogObject(planId, true);
  const plan = planPayload.object as SquareCatalogSubscriptionPlan | undefined;

  if (!plan || plan.type !== "SUBSCRIPTION_PLAN") {
    return null;
  }

  const planName = plan.subscription_plan_data?.name?.trim() || "Abonnement";

  const inlineVariations =
    plan.subscription_plan_data?.subscription_plan_variations ?? [];
  const relatedVariations = (planPayload.related_objects ?? []).filter(
    (object): object is SquareCatalogSubscriptionPlanVariation =>
      object.type === "SUBSCRIPTION_PLAN_VARIATION",
  );

  const candidatePlanVariation = [...inlineVariations, ...relatedVariations].find(
    (variation) =>
      variation.id &&
      variation.subscription_plan_variation_data?.subscription_plan_id === planId,
  );

  const planVariationId = candidatePlanVariation?.id;
  if (!planVariationId) {
    return null;
  }

  return {
    itemVariationId,
    planVariationId,
    priceCents: data?.price_money?.amount ?? null,
    currency: data?.price_money?.currency ?? "EUR",
    planName,
    variationName:
      candidatePlanVariation.subscription_plan_variation_data?.name?.trim() ||
      planName,
  };
}
