import type { RequestHandler } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler";
import { articleRepository } from "../repositories/article.repository";

function parsePageParam(value: unknown, fallback: number, max = Number.POSITIVE_INFINITY) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(1, Math.floor(parsed)));
}

// ── Public endpoints ──────────────────────────────────────────────────────────

export const listArticlesController: RequestHandler = asyncHandler(async (req, res) => {
  const type = typeof req.query.type === "string" ? req.query.type : undefined;
  const tag = typeof req.query.tag === "string" ? req.query.tag : undefined;
  const page = parsePageParam(req.query.page, 1);
  const limit = parsePageParam(req.query.limit, 12, 24);

  const { docs, total } = await articleRepository.list({ type: type as never, tag, page, limit });
  res.json({ success: true, data: docs, total, page, limit });
});

export const getArticleBySlugController: RequestHandler = asyncHandler(async (req, res) => {
  const slug = typeof req.params.slug === "string" ? req.params.slug : "";
  const article = await articleRepository.findPublishedBySlug(slug);
  if (!article) {
    res.status(404).json({ success: false, message: "Article not found" });
    return;
  }
  res.json({ success: true, data: article });
});

export const getDropBySlugController: RequestHandler = asyncHandler(async (req, res) => {
  const slug = typeof req.params.slug === "string" ? req.params.slug : "";
  const article = await articleRepository.findDropBySlug(slug);
  if (!article) {
    res.status(404).json({ success: false, message: "Drop not found" });
    return;
  }
  res.json({ success: true, data: article });
});

export const getLatestArticlesController: RequestHandler = asyncHandler(async (req, res) => {
  const limit = parsePageParam(req.query.limit, 3, 10);
  const docs = await articleRepository.findLatest(limit);
  res.json({ success: true, data: docs });
});

export const getRelatedArticlesController: RequestHandler = asyncHandler(async (req, res) => {
  const slug = typeof req.params.slug === "string" ? req.params.slug : "";
  const article = await articleRepository.findPublishedBySlug(slug);
  if (!article) {
    res.status(404).json({ success: false, message: "Article not found" });
    return;
  }
  const related = await articleRepository.findRelated(slug, article.tags, 3);
  res.json({ success: true, data: related });
});

// ── Admin endpoints ───────────────────────────────────────────────────────────

export const adminListArticlesController: RequestHandler = asyncHandler(async (req, res) => {
  const page = parsePageParam(req.query.page, 1);
  const limit = parsePageParam(req.query.limit, 20, 50);
  const { docs, total } = await articleRepository.adminList({ page, limit });
  res.json({ success: true, data: docs, total, page, limit });
});

export const adminGetArticleController: RequestHandler = asyncHandler(async (req, res) => {
  const article = await articleRepository.adminFindById(String(req.params.id));
  if (!article) {
    res.status(404).json({ success: false, message: "Article not found" });
    return;
  }
  res.json({ success: true, data: article });
});

const blockSchema = z.object({
  type: z.enum(["text", "image", "product_embed"]),
  content: z.string(),
  caption: z.string().optional(),
  order: z.number().int().default(0),
});

const articleWriteSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes").optional(),
  title: z.string().min(1).max(300),
  type: z.enum(["blog", "lookbook", "drop"]),
  status: z.enum(["draft", "published"]).default("draft"),
  heroImage: z.string().url().optional().or(z.literal("")),
  excerpt: z.string().max(500).optional(),
  blocks: z.array(blockSchema).default([]),
  tags: z.array(z.string()).default([]),
  collectionSlug: z.string().optional(),
  publishedAt: z.string().datetime({ offset: true }).optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
});

export const adminCreateArticleController: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = articleWriteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten() });
    return;
  }

  const { publishedAt, ...rest } = parsed.data;
  // If published but no explicit date given, default to now so the article is visible immediately.
  const resolvedPublishedAt = publishedAt
    ? new Date(publishedAt)
    : rest.status === "published" ? new Date() : undefined;
  const data = {
    ...rest,
    slug: rest.slug ?? rest.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    publishedAt: resolvedPublishedAt,
  };

  const article = await articleRepository.create(data);
  res.status(201).json({ success: true, data: article });
});

export const adminUpdateArticleController: RequestHandler = asyncHandler(async (req, res) => {
  const existing = await articleRepository.adminFindById(String(req.params.id));
  if (!existing) {
    res.status(404).json({ success: false, message: "Article not found" });
    return;
  }

  const parsed = articleWriteSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Validation failed", errors: parsed.error.flatten() });
    return;
  }

  const { publishedAt, ...rest } = parsed.data;
  // If transitioning to published without a date and no date was previously set, default to now.
  const needsPublishedAt =
    rest.status === "published" &&
    publishedAt === undefined &&
    !existing.publishedAt;
  const data = {
    ...rest,
    ...(publishedAt !== undefined ? { publishedAt: new Date(publishedAt) } : {}),
    ...(needsPublishedAt ? { publishedAt: new Date() } : {}),
  };

  const updated = await articleRepository.update(String(req.params.id), data);
  res.json({ success: true, data: updated });
});

export const adminDeleteArticleController: RequestHandler = asyncHandler(async (req, res) => {
  const deleted = await articleRepository.delete(String(req.params.id));
  if (!deleted) {
    res.status(404).json({ success: false, message: "Article not found" });
    return;
  }
  res.json({ success: true });
});
