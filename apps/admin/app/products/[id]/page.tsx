"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Product, ProductVariant } from "@asur/types";
import { productFits } from "@asur/constants";
import { VariantEditor } from "../../../components/variant-editor";
import { api } from "../../../lib/api";

async function generateAiDescription(form: { title: string; category: string; tags: string; fit: string }, variants: ProductVariant[]): Promise<string> {
  const colors = [...new Set(variants.map((v) => v.color))];
  const sizes = [...new Set(variants.map((v) => v.size))];
  const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
  const res = await api.post<{ data: { description: string } }>("/api/v1/ai/description-gen", {
    title: form.title,
    category: form.category,
    tags,
    fit: form.fit || "regular",
    colors,
    sizes,
  });
  return res.data.description;
}

type FormState = {
  title: string;
  description: string;
  category: string;
  tags: string;
  collectionSlugs: string;
  fit: string;
  status: "draft" | "active" | "archived";
};

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [genLoading, setGenLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ data: Product }>(`/api/v1/admin/products/${id}`)
      .then((r) => {
        const p = r.data;
        setForm({
          title: p.title,
          description: p.description,
          category: p.category,
          tags: p.tags.join(", "),
          collectionSlugs: p.collectionSlugs.join(", "),
          fit: p.fit ?? "",
          status: p.status
        });
        setVariants(p.variants);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (variants.length === 0) { setError("Add at least one variant"); return; }

    setSaving(true);
    setError(null);

    try {
      await api.patch(`/api/v1/admin/products/${id}`, {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        collectionSlugs: form.collectionSlugs.split(",").map((s) => s.trim()).filter(Boolean),
        fit: form.fit || undefined,
        status: form.status,
        variants
      });
      router.push("/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api.del(`/api/v1/admin/products/${id}`);
      router.push("/products");
    } catch {
      setError("Failed to delete");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 720, display: "grid", gap: "1rem" }}>
        <div className="skeleton" style={{ height: 40, width: "40%" }} />
        <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
      </div>
    );
  }

  if (notFound || !form) {
    return (
      <div className="empty-state">
        <h2>Product not found</h2>
        <Link href="/products" className="btn-ghost">Back to products</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="section-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/products" style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>← Products</Link>
          <h1>{form.title || "Edit product"}</h1>
        </div>
        <button onClick={handleDelete} className="btn-danger" disabled={deleting}>
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>

      {/* Product ID — for copy/reference */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "monospace" }}>ID: {id}</span>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(id).catch(() => {})}
          style={{ padding: "0.15rem 0.45rem", borderRadius: 5, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "0.68rem", cursor: "pointer", fontFamily: "inherit" }}
        >Copy</button>
      </div>

      <form onSubmit={handleSave} style={{ display: "grid", gap: "1.25rem" }}>
        {error && (
          <div style={{ padding: "0.75rem 1rem", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", fontSize: "0.85rem", color: "var(--danger)" }}>
            {error}
          </div>
        )}

        <div className="card" style={{ display: "grid", gap: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Details</p>
          <div className="form-field">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="form-field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
              <label className="form-label" style={{ margin: 0 }}>Description</label>
              <button
                type="button"
                disabled={genLoading || !form.title.trim()}
                onClick={async () => {
                  setGenLoading(true);
                  try {
                    const desc = await generateAiDescription(form, variants);
                    set("description", desc);
                  } catch {
                    setError("AI generation failed. Is ANTHROPIC_API_KEY set?");
                  } finally {
                    setGenLoading(false);
                  }
                }}
                style={{ padding: "0.25rem 0.65rem", borderRadius: 6, border: "1px solid rgba(249,115,22,0.35)", background: "rgba(249,115,22,0.07)", color: "var(--accent)", fontSize: "0.72rem", fontWeight: 700, cursor: genLoading || !form.title.trim() ? "not-allowed" : "pointer", opacity: genLoading || !form.title.trim() ? 0.5 : 1 }}
              >
                {genLoading ? "Generating…" : "✦ Generate with AI"}
              </button>
            </div>
            <textarea className="form-input" value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} style={{ resize: "vertical" }} />
          </div>
          <div className="grid-2">
            <div className="form-field">
              <label className="form-label">Category</label>
              <input className="form-input" value={form.category} onChange={(e) => set("category", e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Fit</label>
              <select className="form-input" value={form.fit} onChange={(e) => set("fit", e.target.value)} style={{ cursor: "pointer" }}>
                <option value="">— select —</option>
                {productFits.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-field">
              <label className="form-label">Tags</label>
              <input className="form-input" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="streetwear, premium" />
            </div>
            <div className="form-field">
              <label className="form-label">Collections</label>
              <input className="form-input" value={form.collectionSlugs} onChange={(e) => set("collectionSlugs", e.target.value)} placeholder="core-collection" />
            </div>
          </div>
          <div className="form-field" style={{ maxWidth: 200 }}>
            <label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={(e) => set("status", e.target.value as FormState["status"])} style={{ cursor: "pointer" }}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="card" style={{ display: "grid", gap: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Variants</p>
          <VariantEditor variants={variants} onChange={setVariants} />
        </div>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <Link href="/products" className="btn-ghost">Cancel</Link>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
