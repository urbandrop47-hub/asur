export type AnalyticsEvent =
  | "product_viewed"
  | "size_selected"
  | "color_selected"
  | "add_to_cart"
  | "image_viewed"
  | "size_rec_used"
  | "visual_search_used"
  | "checkout_started"
  | "checkout_address_complete"
  | "checkout_review_complete"
  | "payment_success"
  | "payment_failed";

/**
 * Fire a funnel event. Client-only — safe to call from server components
 * because it no-ops when window is unavailable.
 *
 * Swap the console.log for Segment/PostHog/GA4 here when ready.
 */
export function track(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  console.log("[analytics]", event, props ?? {});
  // e.g. window.analytics?.track(event, props);
}
