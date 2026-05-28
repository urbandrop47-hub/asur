import { APP_NAME } from "@asur/constants";
import type { Order, Product, UserProfile, VendorTask, Payment } from "@asur/types";
import { createId } from "../lib/id";

const now = () => new Date().toISOString();

export const mockStore = {
  users: [
    {
      id: createId("usr"),
      firebaseUid: "dev_seed_user",
      phoneNumber: "+91 99999 00000",
      email: "customer@asur.local",
      name: "ASUR Customer",
      role: "CUSTOMER",
      addresses: [],
      createdAt: now(),
      updatedAt: now()
    } satisfies UserProfile
  ],
  products: [
    {
      id: createId("prd"),
      title: `${APP_NAME} Ember Overshirt`,
      slug: "ember-overshirt",
      description: "A premium heavyweight overshirt tailored for layered streetwear fits.",
      category: "Outerwear",
      tags: ["streetwear", "outerwear", "premium"],
      media: [
        {
          url: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&q=80",
          alt: "Overshirt product mockup"
        }
      ],
      variants: [
        { size: "M", color: "Obsidian", sku: "EMB-M-OBS", stock: 42, price: 8900 },
        { size: "L", color: "Obsidian", sku: "EMB-L-OBS", stock: 18, price: 8900 }
      ],
      seo: {
        title: "ASUR Ember Overshirt",
        description: "Streetwear outerwear with a premium structured silhouette."
      },
      status: "active"
    } satisfies Product
  ],
  orders: [] as Order[],
  vendorTasks: [] as VendorTask[],
  payments: [] as Payment[]
};
