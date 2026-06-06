import { Schema, model, models } from "mongoose";

export type ArticleBlockType = "text" | "image" | "product_embed";

export type ArticleBlock = {
  type: ArticleBlockType;
  content: string; // text: markdown-lite body; image: URL; product_embed: comma-separated slugs
  caption?: string; // for image blocks
  order: number;
};

export type ArticleStatus = "draft" | "published";
export type ArticleType = "blog" | "lookbook" | "drop";

export type ArticleDoc = {
  slug: string;
  title: string;
  type: ArticleType;
  status: ArticleStatus;
  heroImage?: string;
  excerpt?: string;
  blocks: ArticleBlock[];
  tags: string[];
  collectionSlug?: string; // only for type="drop"
  publishedAt?: Date;
  seoTitle?: string;
  seoDescription?: string;
  /** Optional access code gate for drops — set to a non-empty string to require it */
  accessCode?: string;
  createdAt: Date;
  updatedAt: Date;
};

const blockSchema = new Schema<ArticleBlock>(
  {
    type: { type: String, enum: ["text", "image", "product_embed"], required: true },
    content: { type: String, required: true },
    caption: { type: String },
    order: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const articleSchema = new Schema<ArticleDoc>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    title: { type: String, required: true },
    type: { type: String, enum: ["blog", "lookbook", "drop"], required: true },
    status: { type: String, enum: ["draft", "published"], required: true, default: "draft", index: true },
    heroImage: { type: String },
    excerpt: { type: String },
    blocks: { type: [blockSchema], default: [] },
    tags: { type: [String], default: [] },
    collectionSlug: { type: String },
    publishedAt: { type: Date, index: true },
    seoTitle: { type: String },
    seoDescription: { type: String },
    accessCode: { type: String },
    createdAt: { type: Date, default: () => new Date() },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

export const ArticleModel = models.Article ?? model<ArticleDoc>("Article", articleSchema);
