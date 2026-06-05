import { Schema, model, models } from "mongoose";

export type AnnouncementBarConfig = {
  text: string;
  link?: string;
  bgColor: string;
  isActive: boolean;
};

export type ISiteConfig = {
  _id: string;          // always "singleton"
  announcementBar: AnnouncementBarConfig;
  freeShippingThreshold: number;  // rupees — default 1500
  shippingFee: number;            // rupees — default 250
  gstRate: number;                // decimal — default 0.18
  gstin?: string;                 // GST Identification Number for invoices
  businessName?: string;
  businessAddress?: string;
  updatedAt: string;
};

// Factory function — don't evaluate new Date() at module load time;
// the timestamp should reflect when the default is actually used.
export function makeDefaultConfig(): Omit<ISiteConfig, "_id"> {
  return {
    announcementBar: {
      text: "FREE SHIPPING on orders above ₹1,500 · Pan-India delivery",
      link: "/products",
      bgColor: "rgba(249,115,22,0.9)",
      isActive: true
    },
    freeShippingThreshold: 1500,
    shippingFee: 250,
    gstRate: 0.18,
    updatedAt: new Date().toISOString()
  };
}

// Convenience constant for places that just need the static values (no timestamp needed)
export const DEFAULT_CONFIG = makeDefaultConfig();

const siteConfigSchema = new Schema<ISiteConfig>(
  {
    _id:                   { type: String, default: "singleton" },
    announcementBar: {
      text:      { type: String, default: DEFAULT_CONFIG.announcementBar.text },
      link:      { type: String },
      bgColor:   { type: String, default: DEFAULT_CONFIG.announcementBar.bgColor },
      isActive:  { type: Boolean, default: true }
    },
    freeShippingThreshold: { type: Number, default: 1500 },
    shippingFee:           { type: Number, default: 250 },
    gstRate:               { type: Number, default: 0.18 },
    gstin:                 { type: String },
    businessName:          { type: String },
    businessAddress:       { type: String },
    updatedAt:             { type: String, required: true }
  },
  { versionKey: false, _id: false }
);

export const SiteConfigModel = models.SiteConfig ?? model<ISiteConfig>("SiteConfig", siteConfigSchema);

/** Lightweight helper for order/cart calculations — returns only the pricing constants. */
export type OrderPricingConfig = {
  freeShippingThreshold: number;
  shippingFee: number;
  gstRate: number;
};

export async function getOrderPricingConfig(): Promise<OrderPricingConfig> {
  try {
    const doc = await SiteConfigModel.findById("singleton")
      .select("freeShippingThreshold shippingFee gstRate")
      .lean<Pick<ISiteConfig, "freeShippingThreshold" | "shippingFee" | "gstRate">>()
      .exec();
    if (doc) {
      return { freeShippingThreshold: doc.freeShippingThreshold, shippingFee: doc.shippingFee, gstRate: doc.gstRate };
    }
  } catch { /* DB unavailable — fall through to defaults */ }
  return { freeShippingThreshold: 1500, shippingFee: 250, gstRate: 0.18 };
}
