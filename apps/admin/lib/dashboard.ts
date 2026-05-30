export const adminMetrics = [
  { label: "Orders today", value: "128", detail: "Up 18% from yesterday" },
  { label: "Vendors active", value: "14", detail: "7 fulfillment partners online" },
  { label: "Payment success", value: "98.4%", detail: "Razorpay webhook verification healthy" },
  { label: "Products live", value: "42", detail: "Collections ready for the next drop" }
];

export const adminQueues = [
  {
    title: "Pending refunds",
    items: ["Order ASUR-9H21 - pending manual review", "Order ASUR-9H31 - split shipment missing invoice"]
  },
  {
    title: "Content approvals",
    items: ["Ember Overshirt media set", "Aurora campaign banner", "Drop-04 homepage hero"]
  },
  {
    title: "Vendor signals",
    items: ["Vendor 08 needs new tracking ID format", "Vendor 12 submitted late pickup window"]
  }
];
