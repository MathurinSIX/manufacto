import { getSquareApiBaseUrl } from "@/lib/square/environment";

type SquareApiError = { detail?: string; code?: string };

type SquareSubscription = {
  id?: string;
  customer_id?: string;
  location_id?: string;
  plan_variation_id?: string;
  status?: string;
  created_at?: string;
  canceled_date?: string;
};

type SearchSubscriptionsResponse = {
  subscriptions?: SquareSubscription[];
  cursor?: string;
  errors?: SquareApiError[];
};

type CancelSubscriptionResponse = {
  subscription?: SquareSubscription;
  errors?: SquareApiError[];
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

function formatSquareErrors(errors?: SquareApiError[]) {
  return (
    errors?.map((error) => error.detail).filter(Boolean).join(", ") ||
    "Square subscriptions request failed"
  );
}

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["ACTIVE", "PENDING"]);

export async function searchSquareSubscriptionsForCustomer(customerId: string) {
  const locationId = process.env.SQUARE_LOCATION_ID;
  const subscriptions: SquareSubscription[] = [];
  let cursor: string | undefined;

  do {
    const response = await fetch(`${getSquareApiBaseUrl()}/v2/subscriptions/search`, {
      method: "POST",
      headers: getSquareHeaders(),
      body: JSON.stringify({
        cursor,
        limit: 100,
        query: {
          filter: {
            customer_ids: [customerId],
            ...(locationId ? { location_ids: [locationId] } : {}),
          },
        },
      }),
    });

    const payload = (await response.json()) as SearchSubscriptionsResponse;

    if (!response.ok) {
      throw new Error(formatSquareErrors(payload.errors));
    }

    subscriptions.push(...(payload.subscriptions ?? []));
    cursor = payload.cursor;
  } while (cursor);

  return subscriptions;
}

export function pickSubscriptionForPurchase(
  subscriptions: SquareSubscription[],
  fulfilledAt?: string | null,
) {
  const candidates = subscriptions.filter(
    (subscription) =>
      subscription.id &&
      subscription.status &&
      ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status),
  );

  if (!candidates.length) {
    return null;
  }

  if (candidates.length === 1) {
    return candidates[0]?.id ?? null;
  }

  if (!fulfilledAt) {
    return (
      candidates
        .slice()
        .sort(
          (left, right) =>
            new Date(right.created_at ?? 0).getTime() -
            new Date(left.created_at ?? 0).getTime(),
        )[0]?.id ?? null
    );
  }

  const fulfilledTime = new Date(fulfilledAt).getTime();
  const ranked = candidates
    .map((subscription) => ({
      subscription,
      distance: Math.abs(
        new Date(subscription.created_at ?? 0).getTime() - fulfilledTime,
      ),
    }))
    .sort((left, right) => left.distance - right.distance);

  return ranked[0]?.subscription.id ?? null;
}

export async function resolveSquareSubscriptionId({
  squareSubscriptionId,
  squareCustomerId,
  squarePaymentId,
  fulfilledAt,
  retrievePayment,
}: {
  squareSubscriptionId?: string | null;
  squareCustomerId?: string | null;
  squarePaymentId?: string | null;
  fulfilledAt?: string | null;
  retrievePayment: (paymentId: string) => Promise<{ customer_id?: string }>;
}) {
  if (squareSubscriptionId?.trim()) {
    return squareSubscriptionId.trim();
  }

  let customerId = squareCustomerId?.trim() || null;

  if (!customerId && squarePaymentId?.trim()) {
    const payment = await retrievePayment(squarePaymentId.trim());
    customerId = payment.customer_id?.trim() || null;
  }

  if (!customerId) {
    return null;
  }

  const subscriptions = await searchSquareSubscriptionsForCustomer(customerId);
  return pickSubscriptionForPurchase(subscriptions, fulfilledAt);
}

export async function cancelSquareSubscription(subscriptionId: string) {
  const response = await fetch(
    `${getSquareApiBaseUrl()}/v2/subscriptions/${subscriptionId}/cancel`,
    {
      method: "POST",
      headers: getSquareHeaders(),
    },
  );
  const payload = (await response.json()) as CancelSubscriptionResponse;

  if (!response.ok) {
    throw new Error(formatSquareErrors(payload.errors));
  }

  return payload.subscription;
}
