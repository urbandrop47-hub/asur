"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ProductVariant } from "@asur/types";
import { productFits } from "@asur/constants";
import { VariantEditor } from "../../../components/variant-editor";
import { api } from "../../../lib/api";

type FormState = {
  title: string;
  description: string;
  category: string;
  tags: string;
  collectionSlugs: string;
  fit: string;
  status: "draft" | "active" | "archived";
};

const INIT: FormState = {
  title: "", description: "", category: "", tags: "",
  collectionSlugs: "", fit: "", status: "draft"
};

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INIT);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (form.description.trim().length < 10) { setError("Description must be at least 10 characters"); return; }
    if (!form.category.trim()) { setError("Category is required"); return; }
    if (variants.length === 0) { setError("Add at least one variant"); return; }

    setSaving(true);
    setError(null);

    try {
      await api.post("/api/v1/admin/products", {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        collectionSlugs: form.collectionSlugs.split(",").map((s) => s.trim()).filter(Boolean),
        fit: form.fit || undefined,
        status: form.status,
        variants,
        media: []
      });
      router.push("/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="section-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/products" style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>← Products</Link>
          <h1>New product</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.25rem" }}>
        {error && (
          <div style={{ padding: "0.75rem 1rem", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", fontSize: "0.85rem", color: "var(--danger)" }}>
            {error}
          </div>
        )}

        <div className="card" style={{ display: "grid", gap: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Details</p>
          <div className="form-field">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="WeAreASUR Ember Overshirt" />
          </div>
          <div className="form-field">
            <label className="form-label">Description *</label>
            <textarea
              className="form-input"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Product description..."
              rows={3}
              style={{ resize: "vertical" }}
            />
          </div>
          <div className="grid-2">
            <div className="form-field">
              <label className="form-label">Category *</label>
              <input className="form-input" value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Outerwear" />
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
              <label className="form-label">Tags (comma-separated)</label>
              <input className="form-input" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="streetwear, premium" />
            </div>
            <div className="form-field">
              <label className="form-label">Collections (comma-separated slugs)</label>
              <input className="form-input" value={form.collectionSlugs} onChange={(e) => set("collectionSlugs", e.target.value)} placeholder="core-collection" />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={(e) => set("status", e.target.value as FormState["status"])} style={{ cursor: "pointer" }}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="card" style={{ display: "grid", gap: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Variants *</p>
          <VariantEditor variants={variants} onChange={setVariants} />
        </div>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <Link href="/products" className="btn-ghost">Cancel</Link>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Create product"}
          </button>
        </div>
      </form>
    </div>
  );
}
