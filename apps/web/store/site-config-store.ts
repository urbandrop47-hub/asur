import { create } from "zustand";

export type SiteConfig = {
  announcementBar: {
    text: string;
    link?: string;
    bgColor: string;
    isActive: boolean;
  };
  freeShippingThreshold: number;
  shippingFee: number;
  gstRate: number;
};

const DEFAULTS: SiteConfig = {
  announcementBar: {
    text: "FREE SHIPPING on orders above ₹1,500 · Pan-India delivery",
    link: "/products",
    bgColor: "rgba(249,115,22,0.9)",
    isActive: true
  },
  freeShippingThreshold: 1500,
  shippingFee: 250,
  gstRate: 0.18
};

type SiteConfigStore = {
  config: SiteConfig;
  loaded: boolean;
  fetch: () => Promise<void>;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const useSiteConfigStore = create<SiteConfigStore>((set, get) => ({
  config: DEFAULTS,
  loaded: false,
  fetch: async () => {
    if (get().loaded) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/config/public`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.data) set({ config: { ...DEFAULTS, ...json.data }, loaded: true });
    } catch {
      // silent — fall back to defaults
      set({ loaded: true });
    }
  }
}));
