import { track } from "./analytics";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export type RazorpaySuccessPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type OpenRazorpayOptions = {
  key: string;
  amount: number;          // in paise
  currency: string;
  providerOrderId: string; // Razorpay order ID
  orderId: string;         // ASUR internal order ID
  name: string;
  description?: string;
  email?: string;
  contact?: string;
  onSuccess: (payload: RazorpaySuccessPayload) => void;
  onDismiss: () => void;
};

export function openRazorpayCheckout(opts: OpenRazorpayOptions): void {
  if (typeof window === "undefined" || !window.Razorpay) {
    // Razorpay script hasn't loaded yet — shouldn't happen with lazyOnload
    opts.onDismiss();
    return;
  }

  const rzp = new window.Razorpay({
    key: opts.key,
    amount: opts.amount,
    currency: opts.currency,
    order_id: opts.providerOrderId,
    name: opts.name,
    description: opts.description ?? "ASUR Order",
    prefill: {
      email: opts.email ?? "",
      contact: opts.contact ?? ""
    },
    theme: { color: "#f97316" },
    modal: {
      ondismiss: () => {
        track("payment_failed", { orderId: opts.orderId, reason: "dismissed" });
        opts.onDismiss();
      }
    },
    handler: (response: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => {
      track("payment_success", {
        orderId: opts.orderId,
        providerOrderId: response.razorpay_order_id,
        providerPaymentId: response.razorpay_payment_id
      });
      opts.onSuccess({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature
      });
    }
  });

  rzp.open();
}

/** Mock payment flow used when NEXT_PUBLIC_RAZORPAY_KEY is not set */
export function mockRazorpayCheckout(opts: Pick<OpenRazorpayOptions, "providerOrderId" | "onSuccess" | "onDismiss">): void {
  // Simulate the success callback with fake values
  setTimeout(() => {
    opts.onSuccess({
      razorpay_order_id: opts.providerOrderId,
      razorpay_payment_id: `pay_mock_${Date.now()}`,
      razorpay_signature: "mock_signature"
    });
  }, 800);
}
