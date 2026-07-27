import { API_BASE } from "./api";
import { canUseCookieCategory } from "./cookie-consent";

export type FunnelEvent =
  | "PRODUCT_VIEWED" | "SEARCH" | "CART_ITEM_ADDED" | "CART_ITEM_REMOVED"
  | "CHECKOUT_STARTED" | "SHIPPING_SELECTED" | "FREIGHT_CALCULATED"
  | "PAYMENT_SELECTED" | "FORM_ERROR" | "CHARGE_CREATED" | "PAYMENT_APPROVED"
  | "CART_ABANDONED" | "ORDER_COMPLETED";

export function trackFunnel(event: FunnelEvent, context?: string): void {
  if (typeof window === "undefined" || !canUseCookieCategory("analytics")) return;
  void fetch(`${API_BASE}/metricas/funil`, {
    method: "POST",
    credentials: "omit",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, context: context?.slice(0, 32) }),
  }).catch(() => undefined);
}
