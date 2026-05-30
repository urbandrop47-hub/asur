export const vendorMetrics = [
  { label: "Tasks queued", value: "26", detail: "Pending packing or label prep" },
  { label: "Ready to ship", value: "9", detail: "Awaiting courier handoff" },
  { label: "Tracking uploaded", value: "71%", detail: "Most shipments updated this week" }
];

export const vendorWorkflow = [
  {
    title: "Print",
    description: "Vendor receives the task, prints the packing slip, and checks variant details against the order."
  },
  {
    title: "Pack",
    description: "Once the item is packed, the dashboard can move the task to ready-to-ship."
  },
  {
    title: "Ship",
    description: "Tracking is entered, the shipment status updates, and the customer is notified."
  }
];
