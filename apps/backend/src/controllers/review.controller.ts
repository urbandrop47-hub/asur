import type { RequestHandler } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { AppError } from "../lib/errors";
import { reviewRepository } from "../repositories/review.repository";
import { orderRepository } from "../repositories/order.repository";
import { productRepository } from "../repositories/product.repository";
import { getReviewImageUploadUrl } from "../services/r2-upload.service";

const createReviewSchema = z.object({
  productId: z.string().min(1),
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  body: z.string().min(10, "Review must be at least 10 characters").max(2000),
  images: z.array(z.string().url()).max(3).optional().default([])
});

function parsePageParam(value: unknown, fallback: number, max = Number.POSITIVE_INFINITY) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(1, Math.floor(parsed)));
}

// POST /api/v1/reviews — authenticated customer submits a review
export const createReviewController: RequestHandler = asyncHandler(async (req, res) => {
  const customerId: string = res.locals.user.id;
  const input = createReviewSchema.parse(req.body);

  // Verify the order exists and belongs to this customer
  const order = await orderRepository.findById(input.orderId, customerId);
  if (!order) {
    throw new AppError(404, "Order not found");
  }

  // Only allow reviews after shipment (shipped or delivered)
  const qualifyingStatuses = ["shipped", "delivered"];
  if (!qualifyingStatuses.includes(order.status)) {
    throw new AppError(422, "Reviews can only be submitted for shipped or delivered orders");
  }

  // The product must be in this order's line items
  const hasProduct = order.items.some((item) => item.productId === input.productId);
  if (!hasProduct) {
    throw new AppError(422, "This product is not part of the specified order");
  }

  // One review per customer per product
  const existing = await reviewRepository.findByCustomerAndProduct(customerId, input.productId);
  if (existing) {
    throw new AppError(409, "You have already reviewed this product");
  }

  const review = await reviewRepository.create({
    orderId: input.orderId,
    customerId,
    productId: input.productId,
    rating: input.rating,
    body: input.body,
    images: input.images
  });

  sendSuccess(res, review, "Review submitted — it will appear once approved", 201);
});

// GET /api/v1/products/:slug/reviews — public, paginated
export const listProductReviewsController: RequestHandler = asyncHandler(async (req, res) => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const page = parsePageParam(req.query.page, 1);
  const pageSize = parsePageParam(req.query.pageSize, 10, 50);

  const product = await productRepository.findBySlug(slug);
  if (!product) {
    res.status(404).json({ success: false, message: "Product not found" });
    return;
  }

  const { reviews, aggregate } = await reviewRepository.listForProduct(product.id, page, pageSize);
  sendSuccess(res, { reviews, aggregate }, "Reviews fetched");
});

// Admin: GET /api/v1/admin/reviews — all reviews for moderation
// ?filter=pending → unapproved only; ?filter=approved → approved only; no param → all
export const listAdminReviewsController: RequestHandler = asyncHandler(async (req, res) => {
  const page = parsePageParam(req.query.page, 1);
  const filter = req.query.filter as string | undefined;
  const approvedOnly =
    filter === "approved" ? true :
    filter === "pending" ? false :
    undefined;

  const { reviews, total } = await reviewRepository.listAll(page, 20, approvedOnly);
  sendSuccess(res, { reviews, total }, "Reviews fetched");
});

// Admin: PATCH /api/v1/admin/reviews/:id — approve or reject
export const moderateReviewController: RequestHandler = asyncHandler(async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { action } = z.object({ action: z.enum(["approve", "reject"]) }).parse(req.body);

  if (action === "approve") {
    const review = await reviewRepository.approve(id);
    if (!review) {
      res.status(404).json({ success: false, message: "Review not found" });
      return;
    }
    sendSuccess(res, review, "Review approved");
  } else {
    const deleted = await reviewRepository.deleteById(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: "Review not found" });
      return;
    }
    sendSuccess(res, null, "Review rejected and removed");
  }
});

// POST /api/v1/reviews/:id/helpful — authenticated, vote a review helpful/unhelpful
export const voteHelpfulController: RequestHandler = asyncHandler(async (req, res) => {
  const customerId: string = res.locals.user.id;
  const reviewId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { vote } = z.object({ vote: z.enum(["up", "down"]) }).parse(req.body);
  const review = await reviewRepository.voteHelpful(reviewId, customerId, vote);
  if (!review) throw new AppError(404, "Review not found");
  sendSuccess(res, review, "Vote recorded");
});

// POST /api/v1/reviews/upload-url — authenticated, get pre-signed R2 upload URL for review image
export const getReviewUploadUrlController: RequestHandler = asyncHandler(async (req, res) => {
  const { contentType } = z.object({
    contentType: z.enum(["image/jpeg", "image/png", "image/webp"])
  }).parse(req.body);
  const result = await getReviewImageUploadUrl(contentType);
  sendSuccess(res, result, "Upload URL generated");
});
