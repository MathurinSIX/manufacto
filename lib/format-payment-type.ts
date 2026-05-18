export function parseSquarePaymentId(paymentType: string | null | undefined): string | null {
  if (!paymentType) {
    return null;
  }
  if (paymentType.startsWith("square:")) {
    const paymentId = paymentType.slice("square:".length).trim();
    return paymentId.length > 0 ? paymentId : null;
  }
  return null;
}

export function formatPaymentTypeLabel(paymentType: string): string {
  if (paymentType === "credits" || paymentType === "credit") {
    return "Crédits";
  }
  if (paymentType === "stripe") {
    return "Stripe";
  }
  if (paymentType === "admin") {
    return "Admin";
  }
  if (paymentType === "square" || paymentType.startsWith("square:")) {
    return "Square";
  }
  return paymentType;
}
