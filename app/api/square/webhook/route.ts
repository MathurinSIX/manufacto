import { NextResponse } from "next/server";
import {
  fulfillSquarePurchase,
  linkSquareSubscriptionFromWebhook,
  retrieveSquarePayment,
  syncSquareSubscriptionStatusFromWebhook,
  verifySquareWebhookSignature,
} from "@/lib/square/server";

type SquareWebhookPayload = {
  type?: string;
  data?: {
    object?: {
      payment?: {
        id?: string;
        order_id?: string;
        status?: string;
      };
      subscription?: {
        id?: string;
        customer_id?: string;
        status?: string;
      };
    };
  };
};

function acknowledgeSquareWebhook() {
  return NextResponse.json({ received: true });
}

async function handleSquareWebhook(payload: SquareWebhookPayload) {
  if (payload.type === "subscription.created") {
    const subscription = payload.data?.object?.subscription;
    if (subscription) {
      await linkSquareSubscriptionFromWebhook(subscription);
      await syncSquareSubscriptionStatusFromWebhook(subscription);
    }
    return;
  }

  if (payload.type === "subscription.updated") {
    const subscription = payload.data?.object?.subscription;
    if (subscription) {
      await syncSquareSubscriptionStatusFromWebhook(subscription);
    }
    return;
  }

  if (payload.type !== "payment.updated" && payload.type !== "payment.created") {
    return;
  }

  const webhookPayment = payload.data?.object?.payment;
  const paymentId = webhookPayment?.id;

  if (!paymentId) {
    return;
  }

  const payment =
    webhookPayment.status && webhookPayment.order_id
      ? webhookPayment
      : await retrieveSquarePayment(paymentId);

  if (payment.status === "COMPLETED") {
    await fulfillSquarePurchase({
      orderId: payment.order_id,
      paymentId,
    });
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature");
  const requestUrl = new URL(request.url);
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ?? requestUrl.protocol.replace(":", "");
  const forwardedHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedUrl = forwardedHost
    ? `${forwardedProto}://${forwardedHost}${requestUrl.pathname}`
    : request.url;
  const configuredWebhookUrl = process.env.SQUARE_WEBHOOK_URL;
  const candidateUrls = [configuredWebhookUrl, forwardedUrl, request.url].filter(
    (url): url is string => Boolean(url),
  );

  const hasValidSignature = candidateUrls.some((notificationUrl) =>
    verifySquareWebhookSignature({
      body,
      signature,
      notificationUrl,
    }),
  );

  if (!hasValidSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let payload: SquareWebhookPayload;

  try {
    payload = JSON.parse(body) as SquareWebhookPayload;
  } catch (error) {
    console.error("Invalid Square webhook payload:", error);
    return acknowledgeSquareWebhook();
  }

  try {
    await handleSquareWebhook(payload);
  } catch (error) {
    console.error("Square webhook processing failed:", {
      type: payload.type,
      paymentId: payload.data?.object?.payment?.id,
      orderId: payload.data?.object?.payment?.order_id,
      subscriptionId: payload.data?.object?.subscription?.id,
      error,
    });
  }

  return acknowledgeSquareWebhook();
}

