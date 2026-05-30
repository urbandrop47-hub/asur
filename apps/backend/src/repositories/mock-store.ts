import { APP_NAME } from "@asur/constants";
import type { AdminInvite, Order, Product, UserProfile, VendorTask, Payment } from "@asur/types";
import { createId } from "../lib/id";

const now = () => new Date().toISOString();

const users: UserProfile[] = [
  {
    id: createId("usr"),
    firebaseUid: "dev_seed_user",
    phoneNumber: "+91 99999 00000",
    email: "customer@asur.local",
    name: "ASUR Customer",
    avatarUrl: undefined,
    role: "CUSTOMER",
    addresses: [],
    createdAt: now(),
    updatedAt: now()
  }
];

const products: Product[] = [
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
    collectionSlugs: ["core-collection"],
    drop: {
      slug: "launch-01",
      name: "Launch 01",
      season: "SS26"
    },
    fit: "oversized",
    variants: [
      { size: "M", color: "Obsidian", sku: "EMB-M-OBS", stock: 42, price: 8900 },
      { size: "L", color: "Obsidian", sku: "EMB-L-OBS", stock: 18, price: 8900 }
    ],
    seo: {
      title: "ASUR Ember Overshirt",
      description: "Streetwear outerwear with a premium structured silhouette."
    },
    status: "active"
  }
];

export const mockStore = {
  users,
  products,
  adminInvites: [] as AdminInvite[],
  orders: [] as Order[],
  vendorTasks: [] as VendorTask[],
  payments: [] as Payment[]
};
