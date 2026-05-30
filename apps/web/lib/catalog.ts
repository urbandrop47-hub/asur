import type { Product } from "@asur/types";

export const featuredProducts: Product[] = [
  {
    id: "prd_ember",
    title: "Ember Overshirt",
    slug: "ember-overshirt",
    description: "Structured layering piece with a dense hand-feel and a clean premium finish.",
    category: "Outerwear",
    tags: ["streetwear", "overshirt", "drop-01"],
    media: [],
    variants: [{ size: "M", color: "Obsidian", sku: "EMB-M-OBS", stock: 24, price: 8900 }],
    status: "active"
  },
  {
    id: "prd_aurora",
    title: "Aurora Cargo Trouser",
    slug: "aurora-cargo-trouser",
    description: "Tapered utility trouser with generous pocket architecture and a soft drape.",
    category: "Bottoms",
    tags: ["cargo", "utility", "drop-02"],
    media: [],
    variants: [{ size: "L", color: "Ash", sku: "AUR-L-ASH", stock: 18, price: 6400 }],
    status: "active"
  },
  {
    id: "prd_vanta",
    title: "Vanta Hoodie",
    slug: "vanta-hoodie",
    description: "Heavyweight hoodie built for long wear, layered fits, and cold launch nights.",
    category: "Knitwear",
    tags: ["hoodie", "essential", "drop-03"],
    media: [],
    variants: [{ size: "XL", color: "Graphite", sku: "VAN-XL-GRA", stock: 12, price: 5200 }],
    status: "active"
  }
];

export const releaseWorkflow = [
  {
    title: "Authenticate",
    description: "Firebase OTP and Google login create a clean identity layer before checkout begins."
  },
  {
    title: "Pay",
    description: "Razorpay creates and verifies payments before the order is committed to MongoDB."
  },
  {
    title: "Fulfill",
    description: "Vendor tasks are assigned to offline partners for packing, tracking, and shipment updates."
  }
];

export const commerceBlueprint = [
  {
    title: "Frontend",
    description: "Next.js storefront with premium visuals and mobile-first routing."
  },
  {
    title: "Backend",
    description: "Express service layer with route, controller, service, and repository boundaries."
  },
  {
    title: "Storage",
    description: "Cloudflare R2 for images, banners, and uploads with signed URLs."
  }
];
