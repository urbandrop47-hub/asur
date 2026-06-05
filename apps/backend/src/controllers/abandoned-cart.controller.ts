import type { RequestHandler } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler";
import { abandonedCartRepository } from "../repositories/abandoned-cart.repository";

const syncSchema = z.object({
  email: z.string().email(),
  customerName: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantSku: z.string(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
        productTitle: z.string(),
        productSlug: z.string(),
        imageUrl: z.string().optional(),
        size: z.string(),
        color: z.string(),
      })
    )
    .min(1),
  subtotal: z.number().positive(),
});

/** POST /api/v1/abandoned-cart/sync — called from checkout when user has an email */
export const syncAbandonedCart: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = syncSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Invalid cart data", errors: parsed.error.flatten() });
    return;
  }

  const user = res.locals.user as { id?: string } | undefined;
  await abandonedCartRepository.upsert({
    ...parsed.data,
    customerId: user?.id,
  });

  res.json({ success: true });
});

/** POST /api/v1/abandoned-cart/convert — marks email's open carts as converted */
export const convertAbandonedCart: RequestHandler = asyncHandler(async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ success: false, message: "email required" });
    return;
  }
  await abandonedCartRepository.markConverted(email);
  res.json({ success: true });
});
