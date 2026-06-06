import type { Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { env, hasAnthropicKey } from "../config/env";
import { ProductModel } from "../models/product.model";

const client = hasAnthropicKey ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

function noKey(res: Response) {
  return res.status(503).json({ success: false, error: "AI features are not configured on this server." });
}

// ── POST /api/v1/ai/size-rec ─────────────────────────────────────────────────
// Body: { height: number, weight: number, fit: string, sizes: string[] }
export async function sizeRecommendation(req: Request, res: Response) {
  if (!client) return noKey(res);
  const { height, weight, fit = "regular", sizes = [] } = req.body as {
    height?: number; weight?: number; fit?: string; sizes?: string[];
  };

  if (!height || !weight) {
    return res.status(400).json({ success: false, error: "height and weight are required" });
  }

  const prompt = `You are a sizing expert for ASUR, an Indian premium streetwear brand.
Provide a size recommendation based on the following information:
- Height: ${height} cm
- Weight: ${weight} kg
- Preferred fit: ${fit} (slim = fitted to body, regular = relaxed but not oversized, loose = intentionally oversized)
- Available sizes: ${sizes.length > 0 ? sizes.join(", ") : "XS, S, M, L, XL, XXL"}

Consider Indian body proportions and that ASUR uses 230 GSM heavyweight cotton (no stretch).
Respond ONLY with a JSON object: {"size": "<recommended size>", "reason": "<one sentence explanation, max 15 words>"}`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const parsed = JSON.parse(text) as { size: string; reason: string };

    return res.json({ success: true, data: parsed });
  } catch {
    return res.status(500).json({ success: false, error: "Size recommendation failed. Try again." });
  }
}

// ── POST /api/v1/ai/description-gen ──────────────────────────────────────────
// Admin-only. Body: { title, category, tags, fit, colors, sizes }
export async function generateDescription(req: Request, res: Response) {
  if (!client) return noKey(res);
  const { title, category, tags = [], fit, colors = [], sizes = [] } = req.body as {
    title?: string; category?: string; tags?: string[]; fit?: string;
    colors?: string[]; sizes?: string[];
  };

  if (!title) return res.status(400).json({ success: false, error: "title is required" });

  const colorStr = colors.length > 0 ? colors.join(", ") : "various";
  const sizeStr = sizes.length > 0 ? sizes.join(", ") : "XS–XXL";
  const tagStr = tags.length > 0 ? tags.join(", ") : "";

  const prompt = `You are a copywriter for ASUR, a premium Indian streetwear brand.
Brand voice: direct, confident, minimal. No fluff, no superlatives, no "perfect for" or "elevate your look" phrases.
Write like the brand speaks — factual about the garment, confident about its place in a wardrobe.

Write a product description (2–3 sentences, max 60 words total) for:
Title: ${title}
Category: ${category ?? "apparel"}
Fit: ${fit ?? "regular"}
Colors: ${colorStr}
Sizes: ${sizeStr}${tagStr ? `\nKeywords: ${tagStr}` : ""}

Respond ONLY with the description text, no quotes, no markdown.`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    return res.json({ success: true, data: { description: text } });
  } catch {
    return res.status(500).json({ success: false, error: "Description generation failed. Try again." });
  }
}

// ── POST /api/v1/ai/visual-search ────────────────────────────────────────────
// Body: { imageBase64: string, mediaType: "image/jpeg"|"image/png"|"image/webp" }
export async function visualSearch(req: Request, res: Response) {
  if (!client) return noKey(res);
  const { imageBase64, mediaType = "image/jpeg" } = req.body as {
    imageBase64?: string; mediaType?: "image/jpeg" | "image/png" | "image/webp";
  };

  if (!imageBase64) return res.status(400).json({ success: false, error: "imageBase64 is required" });
  // base64 is ~33% larger than binary; 4_000_000 chars ≈ 3 MB binary
  if (imageBase64.length > 4_000_000) {
    return res.status(413).json({ success: false, error: "Image too large. Please use an image under 3 MB." });
  }

  const analysisPrompt = `Analyze this clothing item image. Extract:
1. Primary color (one word)
2. Garment type (e.g., t-shirt, hoodie, sweatshirt, jacket, shirt)
3. Up to 3 style keywords (e.g., oversized, graphic, minimal, streetwear, solid)

Respond ONLY with JSON: {"color": "<color>", "type": "<type>", "keywords": ["<kw1>", "<kw2>"]}`;

  try {
    const vision = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
          { type: "text", text: analysisPrompt },
        ],
      }],
    });

    const text = vision.content[0].type === "text" ? vision.content[0].text.trim() : "";
    const attrs = JSON.parse(text) as { color: string; type: string; keywords: string[] };

    // Search products using extracted attributes
    const searchTerms = [attrs.color, attrs.type, ...attrs.keywords].filter(Boolean);
    const regex = new RegExp(searchTerms.join("|"), "i");

    const products = await ProductModel.find({
      status: "active",
      $or: [
        { title: regex },
        { description: regex },
        { tags: { $in: searchTerms } },
        { category: regex },
      ],
    })
      .select("title slug description category tags media variants")
      .limit(6)
      .lean();

    return res.json({
      success: true,
      data: {
        attributes: attrs,
        products,
      },
    });
  } catch {
    return res.status(500).json({ success: false, error: "Visual search failed. Try again." });
  }
}
