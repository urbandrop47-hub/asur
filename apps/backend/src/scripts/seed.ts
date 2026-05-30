import { env } from "../config/env";
import { connectDatabase } from "../config/database";
import { UserModel } from "../models/user.model";
import { ProductModel } from "../models/product.model";
import { AdminInviteModel } from "../models/admin-invite.model";
import { createId } from "../lib/id";
import type { Product, UserProfile, AdminInvite } from "@asur/types";
import mongoose from "mongoose";

const now = () => new Date().toISOString();

function seedFlag(name: string, fallback = "") {
  return (process.env[name] ?? fallback).trim();
}

function makeTeeProducts(): Product[] {
  return [
    {
      id: createId("prd"),
      title: "Core Cotton Tee",
      slug: "core-cotton-tee",
      description: "A clean everyday tee with a structured neckline and a soft midweight hand feel.",
      category: "T-Shirts",
      tags: ["tee", "essential", "core"],
      media: [
        {
          url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80",
          alt: "Minimal cotton tee mockup"
        }
      ],
      collectionSlugs: ["basics", "tees"],
      drop: {
        slug: "launch-01",
        name: "Launch 01",
        season: "SS26"
      },
      fit: "regular",
      variants: [
        { size: "S", color: "Black", sku: "CORE-S-BLK", stock: 36, price: 1499 },
        { size: "M", color: "Black", sku: "CORE-M-BLK", stock: 42, price: 1499 },
        { size: "L", color: "Black", sku: "CORE-L-BLK", stock: 30, price: 1499 }
      ],
      seo: {
        title: "Core Cotton Tee",
        description: "Essential black T-shirt for everyday wear."
      },
      status: "active"
    },
    {
      id: createId("prd"),
      title: "Oversized Graphic Tee",
      slug: "oversized-graphic-tee",
      description: "Drop-shoulder oversized fit with a front graphic built for limited launches.",
      category: "T-Shirts",
      tags: ["tee", "graphic", "drop"],
      media: [
        {
          url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&q=80",
          alt: "Oversized graphic tee mockup"
        }
      ],
      collectionSlugs: ["graphics", "drops"],
      drop: {
        slug: "drop-01",
        name: "Drop 01",
        season: "FW26"
      },
      fit: "oversized",
      variants: [
        { size: "M", color: "Bone", sku: "GRPH-M-BNE", stock: 18, price: 1799 },
        { size: "L", color: "Bone", sku: "GRPH-L-BNE", stock: 16, price: 1799 },
        { size: "XL", color: "Bone", sku: "GRPH-XL-BNE", stock: 10, price: 1799 }
      ],
      seo: {
        title: "Oversized Graphic Tee",
        description: "Limited edition oversized tee for drop launches."
      },
      status: "active"
    },
    {
      id: createId("prd"),
      title: "Heavyweight Boxy Tee",
      slug: "heavyweight-boxy-tee",
      description: "A premium boxy silhouette with thicker cotton and a more structured fit.",
      category: "T-Shirts",
      tags: ["tee", "boxy", "premium"],
      media: [
        {
          url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80",
          alt: "Heavyweight boxy tee mockup"
        }
      ],
      collectionSlugs: ["premium", "tees"],
      fit: "boxy",
      variants: [
        { size: "S", color: "Olive", sku: "BOX-S-OLV", stock: 14, price: 1999 },
        { size: "M", color: "Olive", sku: "BOX-M-OLV", stock: 20, price: 1999 },
        { size: "L", color: "Olive", sku: "BOX-L-OLV", stock: 12, price: 1999 }
      ],
      seo: {
        title: "Heavyweight Boxy Tee",
        description: "Premium boxy-fit T-shirt with a structured silhouette."
      },
      status: "active"
    }
  ];
}

async function upsertUser(profile: UserProfile) {
  await UserModel.updateOne(
    { firebaseUid: profile.firebaseUid },
    {
      $set: profile
    },
    { upsert: true }
  ).exec();
}

async function upsertProduct(product: Product) {
  await ProductModel.updateOne(
    { slug: product.slug },
    {
      $set: product
    },
    { upsert: true }
  ).exec();
}

async function upsertInvite(invite: AdminInvite) {
  await AdminInviteModel.updateOne(
    { token: invite.token },
    {
      $set: invite
    },
    { upsert: true }
  ).exec();
}

async function main() {
  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required for seeding");
  }

  await connectDatabase();

  const shouldReset = seedFlag("SEED_RESET") === "true";
  if (shouldReset) {
    await Promise.all([UserModel.deleteMany({}), ProductModel.deleteMany({}), AdminInviteModel.deleteMany({})]);
  }

  const timestamp = now();
  const superAdminEmail = seedFlag("SEED_SUPER_ADMIN_EMAIL", seedFlag("SUPER_ADMIN_BOOTSTRAP_EMAIL", "admin@asur.local")).toLowerCase();
  const superAdminUid = seedFlag("SEED_SUPER_ADMIN_FIREBASE_UID", seedFlag("SUPER_ADMIN_BOOTSTRAP_FIREBASE_UID", "seed_super_admin"));
  const superAdminName = seedFlag("SEED_SUPER_ADMIN_NAME", seedFlag("SUPER_ADMIN_BOOTSTRAP_NAME", "ASUR Super Admin"));
  const customerEmail = seedFlag("SEED_CUSTOMER_EMAIL", "customer@asur.local").toLowerCase();
  const customerUid = seedFlag("SEED_CUSTOMER_FIREBASE_UID", "seed_customer");

  const superAdmin: UserProfile = {
    id: createId("usr"),
    firebaseUid: superAdminUid,
    phoneNumber: seedFlag("SEED_SUPER_ADMIN_PHONE", seedFlag("SUPER_ADMIN_BOOTSTRAP_PHONE", "+91 99999 00001")) || undefined,
    email: superAdminEmail,
    name: superAdminName,
    avatarUrl: seedFlag("SEED_SUPER_ADMIN_AVATAR_URL", seedFlag("SUPER_ADMIN_BOOTSTRAP_AVATAR_URL", "")) || undefined,
    role: "SUPER_ADMIN",
    addresses: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const customer: UserProfile = {
    id: createId("usr"),
    firebaseUid: customerUid,
    phoneNumber: "+91 99999 00002",
    email: customerEmail,
    name: "ASUR Customer",
    avatarUrl: undefined,
    role: "CUSTOMER",
    addresses: [
      {
        line1: "12 Brigade Road",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
        country: "India",
        label: "Home",
        isDefault: true
      }
    ],
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const products = makeTeeProducts();
  const invite: AdminInvite = {
    id: createId("ainv"),
    email: "ops@asur.local",
    role: "ADMIN",
    status: "pending",
    token: seedFlag("SEED_ADMIN_INVITE_TOKEN", "seed_admin_invite_token"),
    createdBy: superAdmin.id,
    notes: "Seed invite for local admin onboarding",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await upsertUser(superAdmin);
  await upsertUser(customer);
  await Promise.all(products.map((product) => upsertProduct(product)));
  await upsertInvite(invite);

  console.log(
    JSON.stringify(
      {
        success: true,
        seeded: {
          users: [superAdmin.email, customer.email],
          products: products.map((product) => product.slug),
          adminInvite: invite.token
        }
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
}

void main().catch((error) => {
  console.error("[seed] failed", error);
  process.exit(1);
});
