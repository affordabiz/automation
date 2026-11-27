/** The two things a client can pay for. Prices are in cents (USD). */
export type ProductKey = "renew" | "new";

export interface Product {
  key: ProductKey;
  name: string;
  summary: string;
  amountCents: number;
  currency: "usd";
}

export const PRODUCTS: Record<ProductKey, Product> = {
  renew: {
    key: "renew",
    name: "Renew Personalized Webpage (same template as last year)",
    summary: "Keep the same template and update your details.",
    amountCents: 3299,
    currency: "usd",
  },
  new: {
    key: "new",
    name: "New Personalized Webpage (or new template)",
    summary: "Start a new webpage, or switch to a new template.",
    amountCents: 4699,
    currency: "usd",
  },
};

export const PRODUCT_LIST: readonly Product[] = [PRODUCTS.renew, PRODUCTS.new];

export function isProductKey(value: unknown): value is ProductKey {
  return value === "renew" || value === "new";
}

export function formatMoney(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

export type PaymentStatus = "pending" | "paid" | "failed" | "expired" | "refunded" | "disputed";

export const PAYMENT_STATUSES: readonly PaymentStatus[] = ["paid", "failed", "pending", "expired", "refunded", "disputed"];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  failed: "Failed",
  expired: "Abandoned",
  refunded: "Refunded",
  disputed: "Disputed",
};
