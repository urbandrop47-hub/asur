import { ArticleModel } from "../models/article.model";
import type { ArticleDoc, ArticleType } from "../models/article.model";

type ListParams = {
  type?: ArticleType;
  tag?: string;
  page?: number;
  limit?: number;
};

export const articleRepository = {
  async list(params: ListParams): Promise<{ docs: ArticleDoc[]; total: number }> {
    const { type, tag, page = 1, limit = 12 } = params;
    const now = new Date();

    const filter: Record<string, unknown> = {
      status: "published",
      publishedAt: { $lte: now },
    };
    if (type) filter.type = type;
    if (tag) filter.tags = tag;

    const skip = (page - 1) * limit;
    const [rawDocs, total] = await Promise.all([
      ArticleModel.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(limit).lean(),
      ArticleModel.countDocuments(filter),
    ]);
    return { docs: rawDocs as unknown as ArticleDoc[], total };
  },

  async findBySlug(slug: string): Promise<ArticleDoc | null> {
    const doc = await ArticleModel.findOne({ slug: slug.toLowerCase() }).lean();
    return doc as unknown as ArticleDoc | null;
  },

  async findPublishedBySlug(slug: string): Promise<ArticleDoc | null> {
    const now = new Date();
    const doc = await ArticleModel.findOne({
      slug: slug.toLowerCase(),
      status: "published",
      publishedAt: { $lte: now },
    }).lean();
    return doc as unknown as ArticleDoc | null;
  },

  /** For drops: returns article even if publishedAt is in the future (for countdown display) */
  async findDropBySlug(slug: string): Promise<ArticleDoc | null> {
    const doc = await ArticleModel.findOne({
      slug: slug.toLowerCase(),
      type: "drop",
      status: "published",
    }).lean();
    return doc as unknown as ArticleDoc | null;
  },

  async findLatest(limit: number): Promise<ArticleDoc[]> {
    const now = new Date();
    const docs = await ArticleModel.find({
      status: "published",
      publishedAt: { $lte: now },
    })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();
    return docs as unknown as ArticleDoc[];
  },

  async findRelated(slug: string, tags: string[], limit: number): Promise<ArticleDoc[]> {
    const now = new Date();
    const docs = await ArticleModel.find({
      slug: { $ne: slug },
      status: "published",
      publishedAt: { $lte: now },
      tags: tags.length ? { $in: tags } : { $exists: true },
    })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();
    return docs as unknown as ArticleDoc[];
  },

  // ── Admin ──────────────────────────────────────────────────────────────────

  async adminList(params: { page?: number; limit?: number }): Promise<{ docs: (ArticleDoc & { _id: string })[]; total: number }> {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    const [rawDocs, total] = await Promise.all([
      ArticleModel.find().sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      ArticleModel.countDocuments(),
    ]);
    return { docs: rawDocs as unknown as (ArticleDoc & { _id: string })[], total };
  },

  async adminFindById(id: string): Promise<(ArticleDoc & { _id: string }) | null> {
    const doc = await ArticleModel.findById(id).lean();
    return doc as unknown as (ArticleDoc & { _id: string }) | null;
  },

  async create(data: Partial<ArticleDoc>): Promise<ArticleDoc & { _id: string }> {
    const now = new Date();
    const doc = await ArticleModel.create({ ...data, createdAt: now, updatedAt: now });
    return doc.toObject() as unknown as ArticleDoc & { _id: string };
  },

  async update(id: string, data: Partial<ArticleDoc>): Promise<(ArticleDoc & { _id: string }) | null> {
    const doc = await ArticleModel.findByIdAndUpdate(
      id,
      { $set: { ...data, updatedAt: new Date() } },
      { new: true }
    ).lean();
    return doc as unknown as (ArticleDoc & { _id: string }) | null;
  },

  async delete(id: string): Promise<boolean> {
    const res = await ArticleModel.findByIdAndDelete(id);
    return !!res;
  },
};
