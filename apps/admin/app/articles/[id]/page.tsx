"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../../lib/api";

type BlockType = "text" | "image" | "product_embed";
type ArticleType = "blog" | "lookbook" | "drop";
type ArticleStatus = "draft" | "published";

type Block = {
  type: BlockType;
  content: string;
  caption?: string;
  order: number;
};

type FormState = {
  title: string;
  slug: string;
  type: ArticleType;
  status: ArticleStatus;
  heroImage: string;
  excerpt: string;
  tags: string;
  collectionSlug: string;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  blocks: Block[];
};

const EMPTY: FormState = {
  title: "", slug: "", type: "blog", status: "draft",
  heroImage: "", excerpt: "", tags: "", collectionSlug: "",
  publishedAt: "", seoTitle: "", seoDescription: "", blocks: [],
};

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function ArticleEditorPage() {
  const params = useParams<{ id?: string }>();
  const id = params.id;
  const router = useRouter();
  const isNew = !id || id === "new";

  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;
    void api.get<{ data: FormState & { _id: string; tags: string[] } }>(`/api/v1/admin/articles/${id}`)
      .then((r) => {
        const d = r.data;
        setForm({
          title: d.title ?? "",
          slug: d.slug ?? "",
          type: d.type ?? "blog",
          status: d.status ?? "draft",
          heroImage: d.heroImage ?? "",
          excerpt: d.excerpt ?? "",
          tags: Array.isArray(d.tags) ? d.tags.join(", ") : "",
          collectionSlug: d.collectionSlug ?? "",
          publishedAt: d.publishedAt ? new Date(d.publishedAt as unknown as string).toISOString().slice(0, 16) : "",
          seoTitle: d.seoTitle ?? "",
          seoDescription: d.seoDescription ?? "",
          blocks: (d.blocks as Block[]) ?? [],
        });
        setLoading(false);
      })
      .catch(() => router.replace("/articles"));
  }, [id, isNew, router]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setError(null);
  }

  function addBlock(type: BlockType) {
    const order = form.blocks.length;
    setForm((f) => ({ ...f, blocks: [...f.blocks, { type, content: "", order }] }));
  }

  function updateBlock(idx: number, partial: Partial<Block>) {
    setForm((f) => ({
      ...f,
      blocks: f.blocks.map((b, i) => i === idx ? { ...b, ...partial } : b),
    }));
  }

  function removeBlock(idx: number) {
    setForm((f) => ({
      ...f,
      blocks: f.blocks.filter((_, i) => i !== idx).map((b, i) => ({ ...b, order: i })),
    }));
  }

  function moveBlock(idx: number, dir: -1 | 1) {
    const newBlocks = [...form.blocks];
    const target = idx + dir;
    if (target < 0 || target >= newBlocks.length) return;
    [newBlocks[idx], newBlocks[target]] = [newBlocks[target], newBlocks[idx]];
    setForm((f) => ({ ...f, blocks: newBlocks.map((b, i) => ({ ...b, order: i })) }));
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || slugify(form.title.trim()),
        type: form.type,
        status: form.status,
        heroImage: form.heroImage.trim(),
        excerpt: form.excerpt.trim() || undefined,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        collectionSlug: form.collectionSlug.trim() || undefined,
        publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : undefined,
        seoTitle: form.seoTitle.trim() || undefined,
        seoDescription: form.seoDescription.trim() || undefined,
        blocks: form.blocks,
      };

      if (isNew) {
        await api.post("/api/v1/admin/articles", payload);
      } else {
        await api.patch(`/api/v1/admin/articles/${id}`, payload);
      }
      router.push("/articles");
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? "Failed to save article");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "0.7rem 0.9rem", borderRadius: 10,
    border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)",
    color: "var(--text)", fontSize: "0.88rem", outline: "none", fontFamily: "inherit",
    boxSizing: "border-box" as const,
  };

  const labelStyle = { display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "0.4rem" };

  if (loading) {
    return (
      <div style={{ padding: "2rem", maxWidth: 800 }}>
        <div className="skeleton skeleton-line" style={{ height: 32, width: "40%", marginBottom: "2rem" }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10, marginBottom: "1rem" }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 800 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <Link href="/articles" style={{ fontSize: "0.82rem", color: "var(--text-muted)", textDecoration: "none" }}>← Articles</Link>
        <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800 }}>{isNew ? "New Article" : "Edit Article"}</h1>
      </div>

      {error && (
        <div style={{ padding: "0.75rem 1rem", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "var(--danger)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gap: "1.25rem" }}>
        {/* Title */}
        <div>
          <label style={labelStyle}>Title *</label>
          <input style={inputStyle} value={form.title} onChange={(e) => {
            set("title", e.target.value);
            if (!form.slug || form.slug === slugify(form.title)) set("slug", slugify(e.target.value));
          }} placeholder="Article title" />
        </div>

        {/* Slug */}
        <div>
          <label style={labelStyle}>Slug</label>
          <input style={{ ...inputStyle, fontFamily: "var(--f-mono)", fontSize: "0.82rem" }} value={form.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="auto-generated from title" />
        </div>

        {/* Type + Status */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Type</label>
            <select style={inputStyle} value={form.type} onChange={(e) => set("type", e.target.value as ArticleType)}>
              <option value="blog">Blog</option>
              <option value="lookbook">Lookbook</option>
              <option value="drop">Drop</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select style={inputStyle} value={form.status} onChange={(e) => set("status", e.target.value as ArticleStatus)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        {/* Publish date */}
        <div>
          <label style={labelStyle}>Publish date {form.type === "drop" ? "(sets countdown timer)" : "(leave blank = publish immediately)"}</label>
          <input type="datetime-local" style={inputStyle} value={form.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} />
        </div>

        {/* Hero image */}
        <div>
          <label style={labelStyle}>Hero image URL</label>
          <input style={inputStyle} value={form.heroImage} onChange={(e) => set("heroImage", e.target.value)} placeholder="https://..." />
        </div>

        {/* Excerpt */}
        <div>
          <label style={labelStyle}>Excerpt</label>
          <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} placeholder="Short description shown in cards" />
        </div>

        {/* Tags */}
        <div>
          <label style={labelStyle}>Tags (comma-separated)</label>
          <input style={inputStyle} value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="streetwear, drop, lookbook" />
        </div>

        {/* Collection slug (for drops) */}
        {form.type === "drop" && (
          <div>
            <label style={labelStyle}>Collection slug (links products to this drop)</label>
            <input style={{ ...inputStyle, fontFamily: "var(--f-mono)", fontSize: "0.82rem" }} value={form.collectionSlug} onChange={(e) => set("collectionSlug", e.target.value)} placeholder="void-season-2026" />
          </div>
        )}

        {/* SEO */}
        <details style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "1rem" }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-muted)" }}>SEO settings</summary>
          <div style={{ display: "grid", gap: "0.85rem", marginTop: "1rem" }}>
            <div>
              <label style={labelStyle}>SEO title</label>
              <input style={inputStyle} value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} placeholder="Overrides article title in search results" />
            </div>
            <div>
              <label style={labelStyle}>SEO description</label>
              <textarea style={{ ...inputStyle, minHeight: 72, resize: "vertical" }} value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} placeholder="Meta description for search results" />
            </div>
          </div>
        </details>

        {/* Content blocks */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Content blocks</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {(["text", "image", "product_embed"] as BlockType[]).map((t) => (
                <button key={t} onClick={() => addBlock(t)} style={{ padding: "4px 10px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 600, background: "rgba(255,255,255,0.07)", border: "1px solid var(--border)", color: "var(--text)", cursor: "pointer" }}>
                  + {t === "product_embed" ? "Products" : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {form.blocks.length === 0 && (
            <div style={{ padding: "1.5rem", textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 12, color: "var(--text-muted)", fontSize: "0.85rem" }}>
              No blocks yet. Add text, image, or product embeds.
            </div>
          )}

          <div style={{ display: "grid", gap: "0.75rem" }}>
            {form.blocks.map((block, idx) => (
              <div key={idx} style={{ border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", padding: "2px 8px", background: "rgba(255,255,255,0.06)", borderRadius: 6 }}>
                    {block.type}
                  </span>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button onClick={() => moveBlock(idx, -1)} disabled={idx === 0} style={{ padding: "3px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: "0.78rem", opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                    <button onClick={() => moveBlock(idx, 1)} disabled={idx === form.blocks.length - 1} style={{ padding: "3px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: "0.78rem", opacity: idx === form.blocks.length - 1 ? 0.3 : 1 }}>↓</button>
                    <button onClick={() => removeBlock(idx)} style={{ padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "var(--danger)", cursor: "pointer", fontSize: "0.78rem" }}>✕</button>
                  </div>
                </div>

                {block.type === "text" && (
                  <textarea
                    style={{ ...inputStyle, minHeight: 140, resize: "vertical", fontSize: "0.85rem" }}
                    value={block.content}
                    onChange={(e) => updateBlock(idx, { content: e.target.value })}
                    placeholder="Paragraph text. Separate paragraphs with a blank line."
                  />
                )}

                {block.type === "image" && (
                  <>
                    <input style={{ ...inputStyle, marginBottom: "0.5rem" }} value={block.content} onChange={(e) => updateBlock(idx, { content: e.target.value })} placeholder="Image URL" />
                    <input style={inputStyle} value={block.caption ?? ""} onChange={(e) => updateBlock(idx, { caption: e.target.value })} placeholder="Caption (optional)" />
                  </>
                )}

                {block.type === "product_embed" && (
                  <input
                    style={inputStyle}
                    value={block.content}
                    onChange={(e) => updateBlock(idx, { content: e.target.value })}
                    placeholder="Product slugs, comma-separated: void-tee-black, ravan-hoodie"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1, padding: "0.85rem", borderRadius: 999, fontWeight: 700, fontSize: "0.95rem",
              background: saving ? "rgba(56,189,248,0.5)" : "linear-gradient(135deg, #38bdf8, #8b5cf6)",
              color: "#0b1020", border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving…" : isNew ? "Create article" : "Save changes"}
          </button>
          <Link href="/articles" style={{ padding: "0.85rem 1.5rem", borderRadius: 999, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", textDecoration: "none", fontWeight: 600, fontSize: "0.88rem", display: "flex", alignItems: "center" }}>
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
