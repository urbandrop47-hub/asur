import type { RequestHandler } from "express";
import { z } from "zod";
import { adminRoles, productFits } from "@asur/constants";
import type { Product } from "@asur/types";
import { verifyFirebaseIdToken } from "../auth/firebase";
import { asyncHandler } from "../lib/async-handler";
import { createId } from "../lib/id";
import { sendSuccess } from "../lib/response";
import { acceptAdminInvite, createAdminInvite, getAdminAccessModel, listAdminInvites } from "../services/admin.service";
import { productRepository } from "../repositories/product.repository";
import { orderRepository } from "../repositories/order.repository";

// ─── Helpers ─────────────────────────────────────────────────

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ─── Schemas ─────────────────────────────────────────────────

const variantSchema = z.object({
  size: z.string().min(1),
  color: z.string().min(1),
  sku: z.string().min(1),
  stock: z.number().int().nonnegative(),
  price: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().optional()
});

const createProductSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2).optional(),
  description: z.string().min(10),
  category: z.string().min(2),
  tags: z.array(z.string()).default([]),
  variants: z.array(variantSchema).min(1),
  collectionSlugs: z.array(z.string()).default([]),
  fit: z.enum(productFits).optional(),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  media: z
    .array(z.object({ url: z.string().url(), alt: z.string().optional(), width: z.number().optional(), height: z.number().optional() }))
    .default([])
});

const updateProductSchema = createProductSchema.partial();

const createAdminInviteRequestSchema = z.object({
  email: z.string().email(),
  role: z.enum(adminRoles),
  createdBy: z.string().min(1).optional(),
  notes: z.string().optional()
});

const acceptAdminInviteRequestSchema = z.object({
  token: z.string().min(16),
  idToken: z.string().min(10)
});

// ─── Invite controllers ───────────────────────────────────────

export const getAdminAccessController: RequestHandler = asyncHandler(async (_req, res) => {
  sendSuccess(res, getAdminAccessModel(), "Admin access model fetched");
});

export const listAdminInvitesController: RequestHandler = asyncHandler(async (_req, res) => {
  const invites = await listAdminInvites();
  sendSuccess(res, invites, "Admin invites fetched");
});

export const createAdminInviteController: RequestHandler = asyncHandler(async (req, res) => {
  const payload = createAdminInviteRequestSchema.parse(req.body);
  const invite = await createAdminInvite({
    ...payload,
    createdBy: res.locals.adminUser?.id ?? payload.createdBy
  });
  sendSuccess(res, invite, "Admin invite created", 201);
});

export const acceptAdminInviteController: RequestHandler = asyncHandler(async (req, res) => {
  const payload = acceptAdminInviteRequestSchema.parse(req.body);
  const identity = await verifyFirebaseIdToken(payload.idToken);
  const result = await acceptAdminInvite({
    token: payload.token,
    firebaseUid: identity.firebaseUid,
    phoneNumber: identity.phoneNumber,
    email: identity.email,
    name: identity.name,
    avatarUrl: identity.avatarUrl
  });

  if (!result) {
    res.status(404).json({ success: false, message: "Invite not found or already used" });
    return;
  }

  sendSuccess(res, result, "Admin invite accepted");
});

// ─── Product controllers ──────────────────────────────────────

export const listAdminProductsController: RequestHandler = asyncHandler(async (_req, res) => {
  const products = await productRepository.list();
  const withSummary = (products ?? []).map((p) => ({
    ...p,
    variantCount: p.variants.length,
    totalStock: p.variants.reduce((s, v) => s + v.stock, 0),
    priceRange:
      p.variants.length === 0
        ? null
        : {
            min: Math.min(...p.variants.map((v) => v.price)),
            max: Math.max(...p.variants.map((v) => v.price))
          }
  }));
  sendSuccess(res, withSummary, "Products fetched");
});

export const getAdminProductController: RequestHandler = asyncHandler(async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const product = await productRepository.findById(id);
  if (!product) {
    res.status(404).json({ success: false, message: "Product not found" });
    return;
  }
  sendSuccess(res, product, "Product fetched");
});

export const createAdminProductController: RequestHandler = asyncHandler(async (req, res) => {
  const body = createProductSchema.parse(req.body);
  const now = new Date().toISOString();
  const product: Product = {
    id: createId("prd"),
    title: body.title,
    slug: body.slug ?? slugify(body.title),
    description: body.description,
    category: body.category,
    tags: body.tags,
    media: body.media,
    variants: body.variants,
    collectionSlugs: body.collectionSlugs,
    fit: body.fit,
    status: body.status,
    // @ts-expect-error createdAt/updatedAt not in Product type but stored for ordering
    createdAt: now,
    updatedAt: now
  };
  const created = await productRepository.create(product);
  sendSuccess(res, created, "Product created", 201);
});

export const updateAdminProductController: RequestHandler = asyncHandler(async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const body = updateProductSchema.parse(req.body);
  const updates: Partial<Product> & { updatedAt?: string } = {
    ...body,
    updatedAt: new Date().toISOString()
  };
  if (body.title && !body.slug) {
    updates.slug = slugify(body.title);
  }
  const updated = await productRepository.update(id, updates);
  if (!updated) {
    res.status(404).json({ success: false, message: "Product not found" });
    return;
  }
  sendSuccess(res, updated, "Product updated");
});

export const deleteAdminProductController: RequestHandler = asyncHandler(async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const deleted = await productRepository.deleteById(id);
  if (!deleted) {
    res.status(404).json({ success: false, message: "Product not found" });
    return;
  }
  sendSuccess(res, null, "Product deleted");
});

// ─── Order controllers ────────────────────────────────────────

export const listAdminOrdersController: RequestHandler = asyncHandler(async (_req, res) => {
  const orders = await orderRepository.listAll();
  sendSuccess(res, orders, "Orders fetched");
});

export const getAdminOrderController: RequestHandler = asyncHandler(async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const order = await orderRepository.findByIdAdmin(id);
  if (!order) {
    res.status(404).json({ success: false, message: "Order not found" });
    return;
  }
  sendSuccess(res, order, "Order fetched");
});
