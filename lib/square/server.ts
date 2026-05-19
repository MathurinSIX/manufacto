import crypto from "node:crypto";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { resolveSquareSubscriptionFromItemVariation } from "@/lib/square/catalog-api";
import { getSquareApiBaseUrl, getSquareEnvironment } from "@/lib/square/environment";
import { getSquareProduct } from "@/lib/square/load-products";
import {
  pickSubscriptionForPurchase,
  searchSquareSubscriptionsForCustomer,
} from "@/lib/square/subscriptions";
import type { SquareProduct } from "@/lib/square/products";

export { getSquareApiBaseUrl };

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

type Money = {
  amount: number;
  currency: string;
};

type SquarePaymentLinkResponse = {
  payment_link?: {
    id?: string;
    url?: string;
    order_id?: string;
  };
  errors?: { detail?: string }[];
};

type SquarePayment = {
  id?: string;
  status?: string;
  order_id?: string;
  customer_id?: string;
  total_money?: Money;
  buyer_email_address?: string;
};

type SquarePaymentResponse = {
  payment?: SquarePayment;
  errors?: { detail?: string }[];
};

export function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service role configuration is missing");
  }

  return createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getSiteUrl(request?: Request) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const host = request?.headers.get("host");
  if (host) {
    const protocol = host.includes("localhost") ? "http" : "https";
    return `${protocol}://${host}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

type BuyerInfo = {
  userId?: string;
  userEmail?: string;
  userFullName?: string | null;
  userPhone?: string | null;
  squareCustomerId?: string | null;
};

function buildPrePopulatedData(buyer: BuyerInfo) {
  const data: Record<string, string> = {};
  if (buyer.userEmail) data.buyer_email = buyer.userEmail;
  if (buyer.userFullName) data.buyer_full_name = buyer.userFullName;
  if (buyer.userPhone) data.buyer_phone_number = buyer.userPhone;
  return Object.keys(data).length ? data : undefined;
}

export async function createSquarePaymentLink({
  product,
  buyer,
  siteUrl,
  redirectPath = "/account/square/return",
}: {
  product: SquareProduct;
  buyer: BuyerInfo;
  siteUrl: string;
  redirectPath?: string;
}) {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;

  if (!accessToken || !locationId) {
    throw new Error("Square configuration is missing");
  }

  const idempotencyKey = crypto.randomUUID();
  const orderBody: Record<string, unknown> = {
    location_id: locationId,
    line_items: [
      {
        name: product.name,
        quantity: "1",
        base_price_money: {
          amount: product.amountCents,
          currency: "EUR",
        },
      },
    ],
  };
  if (buyer.squareCustomerId) {
    orderBody.customer_id = buyer.squareCustomerId;
  }

  const response = await fetch(`${getSquareApiBaseUrl()}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Square-Version": process.env.SQUARE_API_VERSION ?? "2026-01-22",
    },
    body: JSON.stringify({
      idempotency_key: idempotencyKey,
      description: product.description,
      order: orderBody,
      checkout_options: {
        redirect_url: `${siteUrl}${redirectPath}`,
      },
      pre_populated_data: buildPrePopulatedData(buyer),
      payment_note: `Manufacto ${product.name} (${product.id})${
        buyer.userId ? ` for ${buyer.userId}` : ""
      }`,
    }),
  });

  const payload = (await response.json()) as SquarePaymentLinkResponse;

  if (!response.ok || !payload.payment_link?.url) {
    const message =
      payload.errors?.map((error) => error.detail).filter(Boolean).join(", ") ||
      "Square payment link creation failed";
    throw new Error(message);
  }

  return {
    idempotencyKey,
    paymentLinkId: payload.payment_link.id ?? null,
    paymentLinkUrl: payload.payment_link.url,
    orderId: payload.payment_link.order_id ?? null,
  };
}

export async function createSquareCatalogPaymentLink({
  catalogObjectId,
  buyer,
  siteUrl,
  redirectPath = "/account/square/return",
  paymentNote,
}: {
  catalogObjectId: string;
  buyer: BuyerInfo;
  siteUrl: string;
  redirectPath?: string;
  paymentNote?: string;
}) {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;

  if (!accessToken || !locationId) {
    throw new Error("Square configuration is missing");
  }

  const idempotencyKey = crypto.randomUUID();
  const orderBody: Record<string, unknown> = {
    location_id: locationId,
    line_items: [
      {
        catalog_object_id: catalogObjectId,
        quantity: "1",
      },
    ],
  };
  if (buyer.squareCustomerId) {
    orderBody.customer_id = buyer.squareCustomerId;
  }

  const response = await fetch(`${getSquareApiBaseUrl()}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Square-Version": process.env.SQUARE_API_VERSION ?? "2026-01-22",
    },
    body: JSON.stringify({
      idempotency_key: idempotencyKey,
      order: orderBody,
      checkout_options: {
        redirect_url: `${siteUrl}${redirectPath}`,
      },
      pre_populated_data: buildPrePopulatedData(buyer),
      payment_note:
        paymentNote ??
        `Manufacto catalog ${catalogObjectId}${buyer.userId ? ` for ${buyer.userId}` : ""}`,
    }),
  });

  const payload = (await response.json()) as SquarePaymentLinkResponse;

  if (!response.ok || !payload.payment_link?.url) {
    const message =
      payload.errors?.map((error) => error.detail).filter(Boolean).join(", ") ||
      "Square catalog payment link creation failed";
    throw new Error(message);
  }

  return {
    idempotencyKey,
    paymentLinkId: payload.payment_link.id ?? null,
    paymentLinkUrl: payload.payment_link.url,
    orderId: payload.payment_link.order_id ?? null,
  };
}

export async function createSquareSubscriptionPaymentLink({
  product,
  itemVariationId,
  planVariationId,
  buyer,
  siteUrl,
  redirectPath = "/account/square/return",
}: {
  product: SquareProduct;
  itemVariationId: string;
  planVariationId: string;
  buyer: BuyerInfo;
  siteUrl: string;
  redirectPath?: string;
}) {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;

  if (!accessToken || !locationId) {
    throw new Error("Square configuration is missing");
  }

  const idempotencyKey = crypto.randomUUID();
  const orderBody: Record<string, unknown> = {
    location_id: locationId,
    line_items: [
      {
        catalog_object_id: itemVariationId,
        quantity: "1",
      },
    ],
  };
  if (buyer.squareCustomerId) {
    orderBody.customer_id = buyer.squareCustomerId;
  }

  const response = await fetch(`${getSquareApiBaseUrl()}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Square-Version": process.env.SQUARE_API_VERSION ?? "2026-01-22",
    },
    body: JSON.stringify({
      idempotency_key: idempotencyKey,
      description: product.description,
      order: orderBody,
      checkout_options: {
        redirect_url: `${siteUrl}${redirectPath}`,
        subscription_plan_id: planVariationId,
      },
      pre_populated_data: buildPrePopulatedData(buyer),
      payment_note: `Manufacto ${product.name} (${product.id})${
        buyer.userId ? ` for ${buyer.userId}` : ""
      }`,
    }),
  });

  const payload = (await response.json()) as SquarePaymentLinkResponse;

  if (!response.ok || !payload.payment_link?.url) {
    const message =
      payload.errors?.map((error) => error.detail).filter(Boolean).join(", ") ||
      "Square subscription payment link creation failed";
    throw new Error(message);
  }

  return {
    idempotencyKey,
    paymentLinkId: payload.payment_link.id ?? null,
    paymentLinkUrl: payload.payment_link.url,
    orderId: payload.payment_link.order_id ?? null,
  };
}

export function verifySquareWebhookSignature({
  body,
  signature,
  notificationUrl,
}: {
  body: string;
  signature: string | null;
  notificationUrl: string;
}) {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

  if (!signatureKey || !signature) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", signatureKey)
    .update(notificationUrl + body)
    .digest("base64");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return (
    signatureBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  );
}

export async function retrieveSquarePayment(paymentId: string) {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("Square access token is missing");
  }

  const response = await fetch(`${getSquareApiBaseUrl()}/v2/payments/${paymentId}`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Square-Version": process.env.SQUARE_API_VERSION ?? "2026-01-22",
    },
  });
  const payload = (await response.json()) as SquarePaymentResponse;

  if (!response.ok || !payload.payment) {
    const message =
      payload.errors?.map((error) => error.detail).filter(Boolean).join(", ") ||
      "Square payment lookup failed";
    throw new Error(message);
  }

  return payload.payment;
}

type SquareRefundResponse = {
  refund?: { id?: string; status?: string };
  errors?: { code?: string; detail?: string }[];
};

export async function refundSquarePayment({
  paymentId,
  idempotencyKey,
  reason,
}: {
  paymentId: string;
  idempotencyKey: string;
  reason?: string;
}) {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("Square access token is missing");
  }

  const payment = await retrieveSquarePayment(paymentId);
  const amount = payment.total_money?.amount;
  const currency = payment.total_money?.currency ?? "EUR";

  if (amount == null || amount <= 0) {
    throw new Error("Montant du paiement Square indisponible pour le remboursement");
  }

  const response = await fetch(`${getSquareApiBaseUrl()}/v2/refunds`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Square-Version": process.env.SQUARE_API_VERSION ?? "2026-01-22",
    },
    body: JSON.stringify({
      idempotency_key: idempotencyKey,
      payment_id: paymentId,
      amount_money: { amount, currency },
      reason: reason ?? "Annulation de réservation Manufacto",
    }),
  });

  const payload = (await response.json()) as SquareRefundResponse;

  if (!response.ok || !payload.refund?.id) {
    const refundAmountInvalid = payload.errors?.some(
      (error) => error.code === "REFUND_AMOUNT_INVALID",
    );

    if (refundAmountInvalid) {
      return { alreadyRefunded: true as const, refundId: null };
    }

    const message =
      payload.errors?.map((error) => error.detail).filter(Boolean).join(", ") ||
      "Square refund failed";
    throw new Error(message);
  }

  return {
    alreadyRefunded: false as const,
    refundId: payload.refund.id,
  };
}

const INACTIVE_SQUARE_SUBSCRIPTION_STATUSES = new Set([
  "CANCELED",
  "DEACTIVATED",
]);

export async function syncSquareSubscriptionStatusFromWebhook(subscription: {
  id?: string;
  status?: string;
}) {
  const squareSubscriptionId = subscription.id?.trim();
  const status = subscription.status?.trim().toUpperCase();

  if (!squareSubscriptionId || !status) {
    return;
  }

  if (!INACTIVE_SQUARE_SUBSCRIPTION_STATUSES.has(status)) {
    return;
  }

  const supabase = getAdminClient();
  const { error } = await supabase
    .from("square_purchase")
    .update({ status: "cancelled" })
    .eq("square_subscription_id", squareSubscriptionId)
    .in("status", ["completed", "processing"]);

  if (error) {
    console.error(
      "Error syncing Square subscription deactivation to purchase:",
      error,
    );
  }
}

export async function linkSquareSubscriptionFromWebhook(subscription: {
  id?: string;
  customer_id?: string;
}) {
  const squareSubscriptionId = subscription.id?.trim();
  const squareCustomerId = subscription.customer_id?.trim();

  if (!squareSubscriptionId || !squareCustomerId) {
    return;
  }

  const supabase = getAdminClient();
  const { data: purchase, error } = await supabase
    .from("square_purchase")
    .select("id")
    .eq("product_kind", "subscription")
    .eq("square_customer_id", squareCustomerId)
    .is("square_subscription_id", null)
    .in("status", ["processing", "completed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error finding purchase for Square subscription webhook:", error);
    return;
  }

  if (!purchase) {
    const recentCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: fallbackPurchase, error: fallbackError } = await supabase
      .from("square_purchase")
      .select("id")
      .eq("product_kind", "subscription")
      .is("square_subscription_id", null)
      .in("status", ["processing", "completed", "pending"])
      .gte("created_at", recentCutoff)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fallbackError) {
      console.error("Error finding fallback purchase for subscription webhook:", fallbackError);
      return;
    }

    if (!fallbackPurchase) {
      return;
    }

    const { error: updateFallbackError } = await supabase
      .from("square_purchase")
      .update({
        square_subscription_id: squareSubscriptionId,
        square_customer_id: squareCustomerId,
      })
      .eq("id", fallbackPurchase.id)
      .is("square_subscription_id", null);

    if (updateFallbackError) {
      console.error("Error linking fallback Square subscription:", updateFallbackError);
    }

    return;
  }

  const { error: updateError } = await supabase
    .from("square_purchase")
    .update({
      square_subscription_id: squareSubscriptionId,
      square_customer_id: squareCustomerId,
    })
    .eq("id", purchase.id)
    .is("square_subscription_id", null);

  if (updateError) {
    console.error("Error linking Square subscription from webhook:", updateError);
  }
}

type SquareOrderResponse = {
  order?: { id?: string; version?: number; customer_id?: string };
  errors?: { detail?: string; code?: string }[];
};

type SupabaseAdminClient = ReturnType<typeof getAdminClient>;

type SquareUserIdentity = {
  emailAddress: string | null;
  givenName: string | null;
  familyName: string | null;
};

async function loadUserSquareIdentity(
  supabase: SupabaseAdminClient,
  userId: string,
): Promise<SquareUserIdentity> {
  const identity: SquareUserIdentity = {
    emailAddress: null,
    givenName: null,
    familyName: null,
  };

  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  const authUser = userData?.user as
    | { email?: string | null; user_metadata?: Record<string, unknown> }
    | undefined;
  identity.emailAddress = authUser?.email?.trim() || null;
  const metadata = authUser?.user_metadata ?? {};
  const fullName =
    (typeof metadata.full_name === "string" && metadata.full_name) ||
    (typeof metadata.name === "string" && metadata.name) ||
    "";
  if (fullName) {
    const [first, ...rest] = fullName.trim().split(/\s+/);
    identity.givenName = first || null;
    identity.familyName = rest.join(" ") || null;
  }
  if (!identity.givenName && typeof metadata.first_name === "string") {
    identity.givenName = metadata.first_name;
  }
  if (!identity.familyName && typeof metadata.last_name === "string") {
    identity.familyName = metadata.last_name;
  }
  return identity;
}

async function searchSquareCustomerByFilter(
  filter: Record<string, unknown>,
): Promise<string | null> {
  try {
    const response = await fetch(
      `${getSquareApiBaseUrl()}/v2/customers/search`,
      {
        method: "POST",
        headers: getSquareHeaders(),
        body: JSON.stringify({
          query: { filter },
          limit: 1,
        }),
      },
    );
    const payload = (await response.json()) as {
      customers?: { id?: string }[];
      errors?: { detail?: string }[];
    };

    if (!response.ok) {
      console.error(
        "Square customer search failed:",
        payload.errors?.map((error) => error.detail).join(", "),
      );
      return null;
    }

    return payload.customers?.[0]?.id ?? null;
  } catch (error) {
    console.error("Square customer search threw:", error);
    return null;
  }
}

async function searchSquareCustomerByReferenceId(
  referenceId: string,
): Promise<string | null> {
  return searchSquareCustomerByFilter({
    reference_id: { exact: referenceId },
  });
}

async function searchSquareCustomerByEmail(
  emailAddress: string,
): Promise<string | null> {
  return searchSquareCustomerByFilter({
    email_address: { exact: emailAddress },
  });
}

async function createSquareCustomer({
  emailAddress,
  givenName,
  familyName,
  referenceId,
}: SquareUserIdentity & { referenceId?: string | null }) {
  const response = await fetch(`${getSquareApiBaseUrl()}/v2/customers`, {
    method: "POST",
    headers: getSquareHeaders(),
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      ...(givenName ? { given_name: givenName } : {}),
      ...(familyName ? { family_name: familyName } : {}),
      ...(emailAddress ? { email_address: emailAddress } : {}),
      ...(referenceId ? { reference_id: referenceId } : {}),
    }),
  });
  const payload = (await response.json()) as {
    customer?: { id?: string };
    errors?: { detail?: string }[];
  };

  if (!response.ok || !payload.customer?.id) {
    const message =
      payload.errors?.map((error) => error.detail).filter(Boolean).join(", ") ||
      "Square customer creation failed";
    throw new Error(message);
  }

  return payload.customer.id;
}

async function updateSquareCustomerReferenceId(
  customerId: string,
  referenceId: string,
) {
  try {
    await fetch(`${getSquareApiBaseUrl()}/v2/customers/${customerId}`, {
      method: "PUT",
      headers: getSquareHeaders(),
      body: JSON.stringify({ reference_id: referenceId }),
    });
  } catch (error) {
    console.error("Failed to backfill Square customer reference_id:", error);
  }
}

export async function ensureSquareCustomerForUser({
  supabase,
  userId,
}: {
  supabase: SupabaseAdminClient;
  userId: string;
}): Promise<string | null> {
  if (!userId) {
    return null;
  }

  const { data: priorPurchase } = await supabase
    .from("square_purchase")
    .select("square_customer_id")
    .eq("user_id", userId)
    .not("square_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (priorPurchase?.square_customer_id) {
    const cached = priorPurchase.square_customer_id as string;
    void updateSquareCustomerReferenceId(cached, userId);
    return cached;
  }

  const byReference = await searchSquareCustomerByReferenceId(userId);
  if (byReference) {
    return byReference;
  }

  const identity = await loadUserSquareIdentity(supabase, userId);

  if (identity.emailAddress) {
    const existing = await searchSquareCustomerByEmail(identity.emailAddress);
    if (existing) {
      void updateSquareCustomerReferenceId(existing, userId);
      return existing;
    }
  }

  if (!identity.emailAddress) {
    return null;
  }

  try {
    return await createSquareCustomer({
      emailAddress: identity.emailAddress,
      givenName: identity.givenName ?? "Manufacto",
      familyName: identity.familyName ?? "Client",
      referenceId: userId,
    });
  } catch (error) {
    console.error("Failed to create Square customer for user:", error);
    return null;
  }
}

async function attachCustomerToSquareOrder({
  orderId,
  customerId,
}: {
  orderId: string;
  customerId: string;
}) {
  const locationId = process.env.SQUARE_LOCATION_ID;

  if (!locationId) {
    return;
  }

  try {
    const getResponse = await fetch(
      `${getSquareApiBaseUrl()}/v2/orders/${orderId}`,
      { headers: getSquareHeaders() },
    );
    const getPayload = (await getResponse.json()) as SquareOrderResponse;

    if (!getResponse.ok || !getPayload.order) {
      console.error(
        "Failed to load Square order before attaching customer:",
        getPayload.errors?.map((error) => error.detail).join(", "),
      );
      return;
    }

    if (getPayload.order.customer_id === customerId) {
      return;
    }

    const response = await fetch(
      `${getSquareApiBaseUrl()}/v2/orders/${orderId}`,
      {
        method: "PUT",
        headers: getSquareHeaders(),
        body: JSON.stringify({
          idempotency_key: crypto.randomUUID(),
          order: {
            location_id: locationId,
            customer_id: customerId,
            version: getPayload.order.version,
          },
        }),
      },
    );
    const payload = (await response.json()) as SquareOrderResponse;

    if (!response.ok) {
      console.error(
        "Failed to attach customer to Square order:",
        payload.errors?.map((error) => error.detail).join(", "),
      );
    }
  } catch (error) {
    console.error("attachCustomerToSquareOrder threw:", error);
  }
}

async function createSquareOrderTemplate({
  locationId,
  customerId,
  itemVariationId,
}: {
  locationId: string;
  customerId: string;
  itemVariationId: string;
}) {
  const response = await fetch(`${getSquareApiBaseUrl()}/v2/orders`, {
    method: "POST",
    headers: getSquareHeaders(),
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      order: {
        location_id: locationId,
        customer_id: customerId,
        state: "DRAFT",
        line_items: [
          {
            catalog_object_id: itemVariationId,
            quantity: "1",
          },
        ],
      },
    }),
  });
  const payload = (await response.json()) as SquareOrderResponse;

  if (!response.ok || !payload.order?.id) {
    const message =
      payload.errors?.map((error) => error.detail).filter(Boolean).join(", ") ||
      "Square order template creation failed";
    throw new Error(message);
  }

  return payload.order.id;
}

function formatYmd(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function createSquareSubscriptionForSandbox({
  locationId,
  planVariationId,
  customerId,
  orderTemplateId,
}: {
  locationId: string;
  planVariationId: string;
  customerId: string;
  orderTemplateId: string;
}) {
  const startDate = formatYmd(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  );
  const response = await fetch(`${getSquareApiBaseUrl()}/v2/subscriptions`, {
    method: "POST",
    headers: getSquareHeaders(),
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      location_id: locationId,
      plan_variation_id: planVariationId,
      customer_id: customerId,
      start_date: startDate,
      phases: [
        {
          ordinal: 0,
          order_template_id: orderTemplateId,
        },
      ],
    }),
  });
  const payload = (await response.json()) as {
    subscription?: { id?: string };
    errors?: { detail?: string }[];
  };

  if (!response.ok || !payload.subscription?.id) {
    const message =
      payload.errors?.map((error) => error.detail).filter(Boolean).join(", ") ||
      "Square subscription creation failed";
    throw new Error(message);
  }

  return payload.subscription.id;
}

async function ensureSandboxSubscriptionForPurchase({
  purchaseId,
  userId,
  productId,
  productKind,
  squareSubscriptionId,
}: {
  purchaseId: string;
  userId: string | null;
  productId: string;
  productKind: string;
  squareSubscriptionId: string | null;
}) {
  if (getSquareEnvironment() !== "sandbox") {
    return;
  }

  if (productKind !== "subscription") {
    return;
  }

  if (squareSubscriptionId) {
    return;
  }

  const locationId = process.env.SQUARE_LOCATION_ID;

  if (!locationId) {
    return;
  }

  try {
    const supabase = getAdminClient();
    const product = await getSquareProduct(productId, supabase);

    if (!product?.catalogObjectId) {
      return;
    }

    const resolved = await resolveSquareSubscriptionFromItemVariation(
      product.catalogObjectId,
    );

    if (!resolved) {
      return;
    }

    if (!userId) {
      return;
    }

    const customerId = await ensureSquareCustomerForUser({ supabase, userId });

    if (!customerId) {
      return;
    }

    const orderTemplateId = await createSquareOrderTemplate({
      locationId,
      customerId,
      itemVariationId: resolved.itemVariationId,
    });

    const subscriptionId = await createSquareSubscriptionForSandbox({
      locationId,
      planVariationId: resolved.planVariationId,
      customerId,
      orderTemplateId,
    });

    const { error } = await supabase
      .from("square_purchase")
      .update({
        square_subscription_id: subscriptionId,
        square_customer_id: customerId,
      })
      .eq("id", purchaseId)
      .is("square_subscription_id", null);

    if (error) {
      console.error("Error linking sandbox subscription to purchase:", error);
    }
  } catch (error) {
    console.error("Sandbox subscription bridge failed:", error);
  }
}

async function ensureCustomerLinkedToPurchase({
  supabase,
  purchaseId,
  userId,
  squareCustomerId,
  squareOrderId,
}: {
  supabase: SupabaseAdminClient;
  purchaseId: string;
  userId: string | null;
  squareCustomerId: string | null;
  squareOrderId: string | null;
}): Promise<string | null> {
  if (!userId) {
    return squareCustomerId;
  }

  let resolvedCustomerId = squareCustomerId;

  if (!resolvedCustomerId) {
    resolvedCustomerId = await ensureSquareCustomerForUser({ supabase, userId });
    if (!resolvedCustomerId) {
      return null;
    }

    const { error } = await supabase
      .from("square_purchase")
      .update({ square_customer_id: resolvedCustomerId })
      .eq("id", purchaseId)
      .is("square_customer_id", null);

    if (error) {
      console.error("Error attaching Square customer to purchase:", error);
    }
  }

  if (squareOrderId && resolvedCustomerId) {
    await attachCustomerToSquareOrder({
      orderId: squareOrderId,
      customerId: resolvedCustomerId,
    });
  }

  return resolvedCustomerId;
}

async function attachSquareSubscriptionToPurchase({
  purchaseId,
  productKind,
  squareCustomerId,
  fulfilledAt,
}: {
  purchaseId: string;
  productKind: string;
  squareCustomerId: string | null;
  fulfilledAt: string;
}) {
  if (productKind !== "subscription" || !squareCustomerId) {
    return;
  }

  try {
    const supabase = getAdminClient();

    const { data: linkedRows } = await supabase
      .from("square_purchase")
      .select("square_subscription_id")
      .neq("id", purchaseId)
      .not("square_subscription_id", "is", null);

    const alreadyLinked = new Set<string>(
      (linkedRows ?? [])
        .map((row) => row.square_subscription_id as string | null)
        .filter((value): value is string => Boolean(value)),
    );

    const subscriptions = (
      await searchSquareSubscriptionsForCustomer(squareCustomerId)
    ).filter((subscription) =>
      subscription.id ? !alreadyLinked.has(subscription.id) : false,
    );

    const squareSubscriptionId = pickSubscriptionForPurchase(
      subscriptions,
      fulfilledAt,
    );

    if (!squareSubscriptionId) {
      return;
    }

    const { error } = await supabase
      .from("square_purchase")
      .update({
        square_subscription_id: squareSubscriptionId,
        square_customer_id: squareCustomerId,
      })
      .eq("id", purchaseId)
      .is("square_subscription_id", null);

    if (error) {
      console.error("Error linking Square subscription to purchase:", error);
    }
  } catch (error) {
    console.error("Error resolving Square subscription for purchase:", error);
  }
}

type SquarePurchaseRow = {
  id: string;
  user_id: string | null;
  product_id: string;
  product_kind: string;
  session_id?: string | null;
  activity_id?: string | null;
  reserved_start_ts?: string | null;
  reserved_end_ts?: string | null;
  square_order_id?: string | null;
  square_payment_id?: string | null;
  square_customer_id?: string | null;
  status: string;
};

function getLatestActiveRegistrationIds(
  registrationIds: string[],
  statuses: { registration_id: string; status: string; created_at: string }[] | null,
) {
  const active = new Set<string>();
  const seen = new Set<string>();

  for (const status of statuses ?? []) {
    if (seen.has(status.registration_id)) {
      continue;
    }
    seen.add(status.registration_id);
    if (status.status !== "CANCELLED") {
      active.add(status.registration_id);
    }
  }

  for (const id of registrationIds) {
    if (!seen.has(id)) {
      active.add(id);
    }
  }

  return active;
}

async function registerUserForCourseSession({
  userId,
  sessionId,
  squarePaymentId,
  reservation,
}: {
  userId: string;
  sessionId: string;
  squarePaymentId?: string | null;
  reservation?: { start: string; end: string } | null;
}) {
  const supabase = getAdminClient();

  const { data: session, error: sessionError } = await supabase
    .from("session")
    .select("id, start_ts, end_ts, max_registrations, activity_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError || !session) {
    throw new Error(sessionError?.message ?? "Session introuvable");
  }

  const reservationStart = reservation?.start
    ? new Date(reservation.start)
    : null;
  const reservationEnd = reservation?.end ? new Date(reservation.end) : null;
  const isPracticeReservation = Boolean(reservationStart && reservationEnd);

  if (isPracticeReservation) {
    if (
      !reservationStart ||
      !reservationEnd ||
      Number.isNaN(reservationStart.getTime()) ||
      Number.isNaN(reservationEnd.getTime()) ||
      reservationEnd.getTime() <= reservationStart.getTime() ||
      reservationStart.getTime() < new Date(session.start_ts).getTime() ||
      reservationEnd.getTime() > new Date(session.end_ts).getTime()
    ) {
      throw new Error("Créneau de pratique libre invalide");
    }
  }

  if ((reservationStart ?? new Date(session.start_ts)).getTime() <= Date.now()) {
    throw new Error("Cette session n'est plus réservable");
  }

  const { data: registrations, error: registrationsError } = await supabase
    .from("registration")
    .select("id, user_id, reserved_start_ts, reserved_end_ts")
    .eq("session_id", sessionId);

  if (registrationsError) {
    throw new Error(registrationsError.message);
  }

  const registrationIds = registrations?.map((registration) => registration.id) ?? [];
  const { data: statuses, error: statusesError } = registrationIds.length
    ? await supabase
        .from("registration_status")
        .select("registration_id, status, created_at")
        .in("registration_id", registrationIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (statusesError) {
    throw new Error(statusesError.message);
  }

  const activeRegistrationIds = getLatestActiveRegistrationIds(
    registrationIds,
    statuses,
  );
  const activeRegistrations =
    registrations?.filter((registration) =>
      activeRegistrationIds.has(registration.id),
    ) ?? [];

  if (
    !isPracticeReservation &&
    activeRegistrations.some((registration) => registration.user_id === userId)
  ) {
    return { alreadyRegistered: true };
  }

  if (isPracticeReservation) {
    const overlappingOwnRegistration = activeRegistrations.some((registration) => {
      if (registration.user_id !== userId) return false;
      if (!registration.reserved_start_ts || !registration.reserved_end_ts) {
        return false;
      }
      return (
        new Date(registration.reserved_start_ts).getTime() < reservationEnd!.getTime() &&
        new Date(registration.reserved_end_ts).getTime() > reservationStart!.getTime()
      );
    });

    if (overlappingOwnRegistration) {
      return { alreadyRegistered: true };
    }

    if (session.max_registrations !== null) {
      const start = reservationStart!.getTime();
      const end = reservationEnd!.getTime();
      for (let hour = start; hour < end; hour += 60 * 60 * 1000) {
        const hourEnd = hour + 60 * 60 * 1000;
        const registeredCount = activeRegistrations.reduce((count, registration) => {
          if (!registration.reserved_start_ts || !registration.reserved_end_ts) {
            return count;
          }
          const registrationStart = new Date(registration.reserved_start_ts).getTime();
          const registrationEnd = new Date(registration.reserved_end_ts).getTime();
          return registrationStart < hourEnd && registrationEnd > hour
            ? count + 1
            : count;
        }, 0);

        if (registeredCount >= session.max_registrations) {
          throw new Error("Ce créneau est complet sur au moins une heure");
        }
      }
    }
  } else if (
    session.max_registrations !== null &&
    activeRegistrations.length >= session.max_registrations
  ) {
    throw new Error("Cette session est complète");
  }

  const paymentType = squarePaymentId
    ? `square:${squarePaymentId}`
    : "square";

  const { error: insertError } = await supabase.from("registration").insert({
    session_id: sessionId,
    user_id: userId,
    payment_type: paymentType,
    reserved_start_ts: reservationStart?.toISOString() ?? null,
    reserved_end_ts: reservationEnd?.toISOString() ?? null,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  return { alreadyRegistered: false };
}

async function fulfillCourseSquarePurchase({
  purchase,
  orderId,
  paymentId,
  paymentCustomerId,
}: {
  purchase: SquarePurchaseRow;
  orderId?: string | null;
  paymentId?: string | null;
  paymentCustomerId: string | null;
}) {
  const supabase = getAdminClient();

  if (!purchase.user_id) {
    console.error("Course Square purchase is missing user_id:", purchase.id);
    await supabase
      .from("square_purchase")
      .update({ status: "failed" })
      .eq("id", purchase.id);
    return;
  }

  if (!purchase.session_id) {
    console.error("Course Square purchase is missing session_id:", purchase.id);
    await supabase
      .from("square_purchase")
      .update({ status: "failed" })
      .eq("id", purchase.id);
    return;
  }

  const { data: claimedPurchase, error: claimError } = await supabase
    .from("square_purchase")
    .update({
      status: "processing",
      square_order_id: orderId ?? purchase.square_order_id,
      square_payment_id: paymentId ?? purchase.square_payment_id,
      square_customer_id: paymentCustomerId ?? purchase.square_customer_id ?? null,
    })
    .eq("id", purchase.id)
    .in("status", ["pending", "failed"])
    .select()
    .maybeSingle();

  if (claimError) {
    console.error("Error claiming course Square purchase:", claimError);
    throw claimError;
  }

  if (!claimedPurchase) {
    return;
  }

  try {
    await registerUserForCourseSession({
      userId: claimedPurchase.user_id,
      sessionId: claimedPurchase.session_id,
      squarePaymentId: paymentId ?? claimedPurchase.square_payment_id,
      reservation:
        claimedPurchase.reserved_start_ts && claimedPurchase.reserved_end_ts
          ? {
              start: claimedPurchase.reserved_start_ts,
              end: claimedPurchase.reserved_end_ts,
            }
          : null,
    });
  } catch (error) {
    console.error("Error registering course after Square payment:", error);
    await supabase
      .from("square_purchase")
      .update({ status: "failed" })
      .eq("id", claimedPurchase.id)
      .eq("status", "processing");
    throw error;
  }

  const { error: updateError } = await supabase
    .from("square_purchase")
    .update({
      status: "completed",
      fulfilled_at: new Date().toISOString(),
    })
    .eq("id", claimedPurchase.id)
    .eq("status", "processing");

  if (updateError) {
    console.error("Error marking course Square purchase completed:", updateError);
    throw updateError;
  }

  await ensureCustomerLinkedToPurchase({
    supabase,
    purchaseId: claimedPurchase.id,
    userId: claimedPurchase.user_id,
    squareCustomerId:
      paymentCustomerId ?? claimedPurchase.square_customer_id ?? null,
    squareOrderId: orderId ?? claimedPurchase.square_order_id ?? null,
  });
}

export async function fulfillSquarePurchase({
  orderId,
  paymentId,
}: {
  orderId?: string | null;
  paymentId?: string | null;
}) {
  if (!orderId && !paymentId) {
    return;
  }

  const supabase = getAdminClient();
  const filters = [];

  if (orderId) {
    filters.push(`square_order_id.eq.${orderId}`);
  }

  if (paymentId) {
    filters.push(`square_payment_id.eq.${paymentId}`);
  }

  const { data: purchaseByReference, error: purchaseError } = await supabase
    .from("square_purchase")
    .select("*")
    .or("status.eq.pending,and(status.eq.failed,product_kind.eq.course)")
    .or(filters.join(","))
    .maybeSingle();

  let purchase = purchaseByReference;

  let paymentCustomerId: string | null = null;

  if (!purchase && paymentId) {
    const payment = await retrieveSquarePayment(paymentId);
    paymentCustomerId = payment.customer_id?.trim() || null;
    const amountCents = payment.total_money?.amount;
    const buyerEmail = payment.buyer_email_address?.trim().toLowerCase();

    if (amountCents && buyerEmail) {
      const { data: usersList, error: usersError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      if (usersError) {
        console.error("Error looking up Square buyer:", usersError);
      } else if (usersList?.users) {
        const buyer = usersList.users.find((authUser) => {
          const email = (authUser as { email?: string }).email;
          return email?.trim().toLowerCase() === buyerEmail;
        });

        if (buyer) {
          const { data: pendingPurchase, error: pendingError } = await supabase
            .from("square_purchase")
            .select("*")
            .eq("status", "pending")
            .eq("user_id", buyer.id)
            .eq("amount_cents", amountCents)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (pendingError) {
            console.error("Error finding pending Square purchase:", pendingError);
          } else {
            purchase = pendingPurchase;
          }
        }
      }
    }
  }

  if (purchaseError || !purchase) {
    if (purchaseError) {
      console.error("Error finding Square purchase:", purchaseError);
    }
    return;
  }

  if (purchase.product_kind === "course" || purchase.product_kind === "discovery") {
    if (!paymentCustomerId && paymentId) {
      try {
        const payment = await retrieveSquarePayment(paymentId);
        paymentCustomerId = payment.customer_id?.trim() || null;
      } catch (error) {
        console.error("Error loading Square payment customer:", error);
      }
    }

    await fulfillCourseSquarePurchase({
      purchase: purchase as SquarePurchaseRow,
      orderId,
      paymentId,
      paymentCustomerId,
    });
    return;
  }

  const product = await getSquareProduct(purchase.product_id, supabase);

  if (!product) {
    await supabase
      .from("square_purchase")
      .update({ status: "failed" })
      .eq("id", purchase.id);
    return;
  }

  if (!paymentCustomerId && paymentId) {
    try {
      const payment = await retrieveSquarePayment(paymentId);
      paymentCustomerId = payment.customer_id?.trim() || null;
    } catch (error) {
      console.error("Error loading Square payment customer:", error);
    }
  }

  const { data: claimedPurchase, error: claimError } = await supabase
    .from("square_purchase")
    .update({
      status: "processing",
      square_order_id: orderId ?? purchase.square_order_id,
      square_payment_id: paymentId ?? purchase.square_payment_id,
      square_customer_id: paymentCustomerId ?? purchase.square_customer_id ?? null,
    })
    .eq("id", purchase.id)
    .eq("status", "pending")
    .select()
    .maybeSingle();

  if (claimError) {
    console.error("Error claiming Square purchase:", claimError);
    throw claimError;
  }

  if (!claimedPurchase) {
    return;
  }

  if (!claimedPurchase.user_id) {
    await supabase
      .from("square_purchase")
      .update({
        status: "completed",
        square_order_id: orderId ?? claimedPurchase.square_order_id,
        square_payment_id: paymentId ?? claimedPurchase.square_payment_id,
        fulfilled_at: new Date().toISOString(),
      })
      .eq("id", claimedPurchase.id)
      .eq("status", "processing");
    return;
  }

  const { error: creditError } = await supabase.from("credit").insert({
    user_id: claimedPurchase.user_id,
    amount: product.credits,
    payment_type: `square:${product.kind}`,
  });

  if (creditError) {
    console.error("Error fulfilling Square purchase:", creditError);
    throw creditError;
  }

  const fulfilledAt = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("square_purchase")
    .update({
      status: "completed",
      square_order_id: orderId ?? claimedPurchase.square_order_id,
      square_payment_id: paymentId ?? claimedPurchase.square_payment_id,
      square_customer_id:
        paymentCustomerId ?? claimedPurchase.square_customer_id ?? null,
      fulfilled_at: fulfilledAt,
    })
    .eq("id", claimedPurchase.id)
    .eq("status", "processing");

  if (updateError) {
    console.error("Error marking Square purchase completed:", updateError);
    throw updateError;
  }

  const resolvedCustomerId = await ensureCustomerLinkedToPurchase({
    supabase,
    purchaseId: claimedPurchase.id,
    userId: claimedPurchase.user_id,
    squareCustomerId:
      paymentCustomerId ?? claimedPurchase.square_customer_id ?? null,
    squareOrderId: orderId ?? claimedPurchase.square_order_id ?? null,
  });

  await attachSquareSubscriptionToPurchase({
    purchaseId: claimedPurchase.id,
    productKind: claimedPurchase.product_kind,
    squareCustomerId: resolvedCustomerId,
    fulfilledAt,
  });

  const { data: refreshedPurchase } = await getAdminClient()
    .from("square_purchase")
    .select("square_subscription_id")
    .eq("id", claimedPurchase.id)
    .maybeSingle();

  await ensureSandboxSubscriptionForPurchase({
    purchaseId: claimedPurchase.id,
    userId: claimedPurchase.user_id ?? null,
    productId: claimedPurchase.product_id,
    productKind: claimedPurchase.product_kind,
    squareSubscriptionId: refreshedPurchase?.square_subscription_id ?? null,
  });
}

// Fallback fulfillment for the Square redirect: webhooks can't always reach
// the app (e.g. local dev, misconfigured webhook URL), so when the buyer is
// redirected back to /account/square/return we verify the payment status with
// Square and run the same fulfillment pipeline. `fulfillSquarePurchase` uses
// idempotent status transitions, so it's safe to call concurrently with the
// webhook.
export async function fulfillSquarePurchaseFromRedirect({
  orderId,
  paymentId,
}: {
  orderId?: string | null;
  paymentId?: string | null;
}) {
  if (!orderId && !paymentId) {
    return { fulfilled: false, reason: "missing-ids" as const };
  }

  try {
    let resolvedOrderId = orderId ?? null;

    if (paymentId) {
      const payment = await retrieveSquarePayment(paymentId);

      if (payment.status !== "COMPLETED") {
        return { fulfilled: false, reason: "payment-not-completed" as const };
      }

      resolvedOrderId = payment.order_id ?? resolvedOrderId;
    }

    await fulfillSquarePurchase({
      orderId: resolvedOrderId,
      paymentId: paymentId ?? null,
    });

    return { fulfilled: true } as const;
  } catch (error) {
    console.error("Error fulfilling Square purchase from redirect:", error);
    return { fulfilled: false, reason: "error" as const };
  }
}

