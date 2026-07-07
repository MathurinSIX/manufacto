import {
  getSquareProductByCatalogObjectId,
} from "@/lib/square/load-products";
import {
  findSupabaseUserIdByEmail,
  getAdminClient,
  retrieveSquareCustomer,
  retrieveSquarePayment,
  syncSquareCustomerToBackend,
  upsertUserSquareCustomer,
} from "@/lib/square/server";

type SquareOrderLineItem = {
  uid?: string;
  catalog_object_id?: string;
  quantity?: string;
};

type SquareOrder = {
  id?: string;
  line_items?: SquareOrderLineItem[];
};

type SquareOrderResponse = {
  order?: SquareOrder;
  errors?: { detail?: string }[];
};

export type SquareCreditPackImportResult = {
  imported: number;
  skipped: number;
  errors: number;
};

export async function retrieveSquareOrder(
  orderId: string,
): Promise<SquareOrder | null> {
  const normalizedOrderId = orderId.trim();
  if (!normalizedOrderId) {
    return null;
  }

  const { getSquareApiBaseUrl } = await import("@/lib/square/environment");

  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Square access token is missing");
  }

  const response = await fetch(
    `${getSquareApiBaseUrl()}/v2/orders/${normalizedOrderId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Square-Version": process.env.SQUARE_API_VERSION ?? "2026-01-22",
      },
    },
  );
  const payload = (await response.json()) as SquareOrderResponse;

  if (!response.ok || !payload.order) {
    console.error(
      "Square order lookup failed:",
      payload.errors?.map((error) => error.detail).join(", "),
    );
    return null;
  }

  return payload.order;
}

async function resolveUserIdForSquarePayment({
  customerId,
  buyerEmail,
}: {
  customerId: string | null;
  buyerEmail: string | null;
}): Promise<{ userId: string | null; squareCustomerId: string | null }> {
  const supabase = getAdminClient();

  if (customerId) {
    const { data: mapping } = await supabase
      .from("user_square_customer")
      .select("user_id")
      .eq("square_customer_id", customerId)
      .maybeSingle();

    if (mapping?.user_id) {
      return { userId: mapping.user_id as string, squareCustomerId: customerId };
    }

    const customer = await retrieveSquareCustomer(customerId);
    if (customer) {
      const email =
        customer.email_address?.trim() ||
        buyerEmail?.trim() ||
        null;

      if (email) {
        await syncSquareCustomerToBackend({
          ...customer,
          email_address: email,
        });
      } else {
        console.warn(
          "[square-import] Square customer has no email; cannot link user:",
          customerId,
        );
        return { userId: null, squareCustomerId: customerId };
      }

      const { data: refreshedMapping } = await supabase
        .from("user_square_customer")
        .select("user_id")
        .eq("square_customer_id", customerId)
        .maybeSingle();

      if (refreshedMapping?.user_id) {
        return {
          userId: refreshedMapping.user_id as string,
          squareCustomerId: customerId,
        };
      }

      const updatedCustomer = await retrieveSquareCustomer(customerId);
      const referenceId = updatedCustomer?.reference_id?.trim();
      if (referenceId) {
        await upsertUserSquareCustomer(referenceId, customerId);
        return { userId: referenceId, squareCustomerId: customerId };
      }

      const userId = await findSupabaseUserIdByEmail(supabase, email);
      if (userId && customerId) {
        await upsertUserSquareCustomer(userId, customerId);
      }

      return { userId, squareCustomerId: customerId };
    }
  }

  if (buyerEmail) {
    const userId = await findSupabaseUserIdByEmail(supabase, buyerEmail);
    return { userId, squareCustomerId: customerId };
  }

  return { userId: null, squareCustomerId: customerId };
}

async function isCreditPackPaymentAlreadyImported({
  paymentId,
  productId,
}: {
  paymentId: string;
  productId: string;
}) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("square_purchase")
    .select("id")
    .eq("square_payment_id", paymentId)
    .eq("product_id", productId)
    .eq("status", "completed")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function importSquareCreditPackPayment({
  paymentId,
  orderId,
}: {
  paymentId?: string | null;
  orderId?: string | null;
}): Promise<SquareCreditPackImportResult> {
  const result: SquareCreditPackImportResult = {
    imported: 0,
    skipped: 0,
    errors: 0,
  };

  if (!paymentId?.trim()) {
    return result;
  }

  const normalizedPaymentId = paymentId.trim();
  const supabase = getAdminClient();

  let payment;
  try {
    payment = await retrieveSquarePayment(normalizedPaymentId);
  } catch (error) {
    console.error("[square-import] Payment lookup failed:", error);
    result.errors += 1;
    return result;
  }

  if (payment.status !== "COMPLETED") {
    result.skipped += 1;
    return result;
  }

  const resolvedOrderId = orderId?.trim() || payment.order_id?.trim() || null;
  if (!resolvedOrderId) {
    console.warn(
      "[square-import] Completed payment has no order; skipping:",
      normalizedPaymentId,
    );
    result.skipped += 1;
    return result;
  }

  const order = await retrieveSquareOrder(resolvedOrderId);
  if (!order?.line_items?.length) {
    result.skipped += 1;
    return result;
  }

  const paymentCustomerId = payment.customer_id?.trim() || null;
  const buyerEmail = payment.buyer_email_address?.trim().toLowerCase() || null;
  const { userId, squareCustomerId } = await resolveUserIdForSquarePayment({
    customerId: paymentCustomerId,
    buyerEmail,
  });

  if (!userId) {
    console.warn(
      "[square-import] No linkable Supabase user for payment:",
      normalizedPaymentId,
    );
    result.skipped += 1;
    return result;
  }

  if (squareCustomerId) {
    await upsertUserSquareCustomer(userId, squareCustomerId);
  }

  for (const lineItem of order.line_items) {
    const catalogObjectId = lineItem.catalog_object_id?.trim();
    if (!catalogObjectId) {
      continue;
    }

    const product = await getSquareProductByCatalogObjectId(
      catalogObjectId,
      supabase,
    );
    if (!product) {
      continue;
    }

    try {
      if (
        await isCreditPackPaymentAlreadyImported({
          paymentId: normalizedPaymentId,
          productId: product.id,
        })
      ) {
        result.skipped += 1;
        continue;
      }

      const quantity = Math.max(1, Number.parseInt(lineItem.quantity ?? "1", 10) || 1);
      const creditsGranted = product.credits * quantity;
      const lineUid = lineItem.uid?.trim() || catalogObjectId;
      const idempotencyKey = `import:${normalizedPaymentId}:${catalogObjectId}:${lineUid}`;
      const fulfilledAt = new Date().toISOString();

      const { error: purchaseError } = await supabase.from("square_purchase").insert({
        user_id: userId,
        product_id: product.id,
        product_kind: product.kind,
        amount_cents: product.amountCents * quantity,
        credits: creditsGranted,
        currency: payment.total_money?.currency ?? "EUR",
        status: "completed",
        square_order_id: resolvedOrderId,
        square_payment_id: normalizedPaymentId,
        square_customer_id: squareCustomerId,
        idempotency_key: idempotencyKey,
        fulfilled_at: fulfilledAt,
      });

      if (purchaseError) {
        if (purchaseError.code === "23505") {
          result.skipped += 1;
          continue;
        }

        throw purchaseError;
      }

      const { error: creditError } = await supabase.from("credit").insert({
        user_id: userId,
        amount: creditsGranted,
        payment_type: `square:${product.kind}`,
      });

      if (creditError) {
        throw creditError;
      }

      result.imported += 1;
    } catch (error) {
      console.error("[square-import] Failed to import credit pack line item:", {
        paymentId: normalizedPaymentId,
        catalogObjectId,
        error,
      });
      result.errors += 1;
    }
  }

  return result;
}

type SquareSearchPaymentsResponse = {
  payments?: { id?: string; status?: string; order_id?: string }[];
  cursor?: string;
  errors?: { detail?: string }[];
};

export async function searchRecentSquarePayments({
  days = 30,
  limit = 100,
}: {
  days?: number;
  limit?: number;
} = {}) {
  const { getSquareApiBaseUrl } = await import("@/lib/square/environment");

  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Square access token is missing");
  }

  const locationId = process.env.SQUARE_LOCATION_ID;
  const endAt = new Date().toISOString();
  const startAt = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const payments: { id?: string; status?: string; order_id?: string }[] = [];
  let cursor: string | undefined;

  while (true) {
    const body: Record<string, unknown> = {
      limit,
      query: {
        filter: {
          date_time_filter: {
            created_at: {
              start_at: startAt,
              end_at: endAt,
            },
          },
          ...(locationId ? { location_filter: { location_ids: [locationId] } } : {}),
        },
        sort: {
          sort_field: "CREATED_AT",
          sort_order: "DESC",
        },
      },
    };

    if (cursor) {
      body.cursor = cursor;
    }

    const response = await fetch(`${getSquareApiBaseUrl()}/v2/payments/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Square-Version": process.env.SQUARE_API_VERSION ?? "2026-01-22",
      },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as SquareSearchPaymentsResponse;

    if (!response.ok) {
      console.error(
        "Square payment search failed:",
        payload.errors?.map((error) => error.detail).join(", "),
      );
      break;
    }

    payments.push(...(payload.payments ?? []));

    if (!payload.cursor) {
      break;
    }

    cursor = payload.cursor;
  }

  return payments;
}

export async function reconcileSquareCreditPackPurchases({
  days = 30,
}: {
  days?: number;
} = {}) {
  const summary = {
    paymentsScanned: 0,
    imported: 0,
    skipped: 0,
    errors: 0,
  };

  const payments = await searchRecentSquarePayments({ days });

  for (const payment of payments) {
    if (payment.status !== "COMPLETED" || !payment.id) {
      continue;
    }

    summary.paymentsScanned += 1;

    try {
      const result = await importSquareCreditPackPayment({
        paymentId: payment.id,
        orderId: payment.order_id ?? null,
      });
      summary.imported += result.imported;
      summary.skipped += result.skipped;
      summary.errors += result.errors;
    } catch (error) {
      summary.errors += 1;
      console.error(
        "[square-purchase-sync] Failed to reconcile payment:",
        payment.id,
        error,
      );
    }
  }

  return summary;
}
