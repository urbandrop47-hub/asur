"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Product, ProductVariant, ProductVideo } from "@asur/types";
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
  status: "draft" | "active" | "archived" | "preorder";
  preorderShipDate: string;
  preorderNote: string;
};

// ── Video row component ──────────────────────────────────────────────────────
function VideoRow({
  video,
  index,
  onUpdate,
  onDelete,
}: {
  video: ProductVideo;
  index: number;
  onUpdate: (idx: number, updated: ProductVideo) => void;
  onDelete: (idx: number) => void;
}) {
  const posterInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [posterError, setPosterError] = useState<string | null>(null);

  async function handlePosterUpload(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPosterError("Only JPEG, PNG, or WebP images allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPosterError("Poster must be under 5 MB");
      return;
    }
    setPosterError(null);
    setUploadingPoster(true);
    try {
      const res = await api.post<{ data: { uploadUrl: string; publicUrl: string } }>(
        "/api/v1/admin/products/upload-poster-url",
        { contentType: file.type }
      );
      const { uploadUrl, publicUrl } = res.data;
      const putRes = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!putRes.ok) throw new Error(`R2 upload failed (${putRes.status})`);
      onUpdate(index, { ...video, poster: publicUrl });
    } catch {
      setPosterError("Poster upload failed");
    } finally {
      setUploadingPoster(false);
    }
  }

  return (
    <div style={{
      border: "1px solid var(--border)", borderRadius: 12,
      overflow: "hidden", background: "rgba(255,255,255,0.02)",
    }}>
      {/* Video preview */}
      <div style={{ position: "relative", aspectRatio: "16/9", background: "rgba(0,0,0,0.3)" }}>
        <video
          src={video.url}
          poster={video.poster}
          controls
          muted
          playsInline
          preload="metadata"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>

      {/* Controls */}
      <div style={{ padding: "0.75rem", display: "grid", gap: "0.6rem" }}>
        {/* Label */}
        <div className="form-field" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: "0.7rem" }}>
            Label <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(shown as badge in gallery)</span>
          </label>
          <input
            className="form-input"
            value={video.label ?? ""}
            onChange={(e) => onUpdate(index, { ...video, label: e.target.value || undefined })}
            placeholder="e.g. Campaign film, Behind the scenes"
            style={{ fontSize: "0.82rem" }}
          />
        </div>

        {/* Poster */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          {video.poster && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.poster}
              alt="Poster"
              style={{ width: 64, height: 36, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }}
            />
          )}
          <button
            type="button"
            onClick={() => posterInputRef.current?.click()}
            disabled={uploadingPoster}
            style={{
              padding: "0.3rem 0.7rem", borderRadius: 6, border: "1px solid var(--border)",
              background: "transparent", color: "var(--text-muted)", fontSize: "0.75rem",
              cursor: uploadingPoster ? "not-allowed" : "pointer", opacity: uploadingPoster ? 0.5 : 1,
            }}
          >
            {uploadingPoster ? "Uploading…" : video.poster ? "Replace poster" : "Set poster image"}
          </button>
          {video.poster && (
            <button
              type="button"
              onClick={() => onUpdate(index, { ...video, poster: undefined })}
              style={{ padding: "0.3rem 0.6rem", borderRadius: 6, border: "none", background: "none", color: "var(--danger)", fontSize: "0.75rem", cursor: "pointer" }}
            >
              ✕ Remove
            </button>
          )}
          <input
            ref={posterInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handlePosterUpload(f);
              e.target.value = "";
            }}
          />
        </div>
        {posterError && <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--danger)" }}>{posterError}</p>}

        {/* URL display + delete */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "space-between" }}>
          <span style={{
            fontFamily: "var(--f-mono)", fontSize: "0.65rem", color: "var(--text-muted)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
          }}>
            {video.url}
          </span>
          <button
            type="button"
            onClick={() => { if (confirm("Remove this video?")) onDelete(index); }}
            style={{
              flexShrink: 0, padding: "0.3rem 0.65rem", borderRadius: 6,
              border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.07)",
              color: "var(--danger)", fontSize: "0.72rem", cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Videos tab ───────────────────────────────────────────────────────────────
function VideosTab({
  videos,
  onChange,
  onUploadingChange,
}: {
  videos: ProductVideo[];
  onChange: (v: ProductVideo[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleVideoUpload(file: File) {
    if (!["video/mp4", "video/webm"].includes(file.type)) {
      setUploadError("Only MP4 or WebM videos allowed");
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      setUploadError("Video must be under 200 MB");
      return;
    }
    setUploadError(null);
    setUploading(true);
    onUploadingChange?.(true);
    setUploadProgress("Getting upload URL…");

    try {
      const res = await api.post<{ data: { uploadUrl: string; publicUrl: string } }>(
        "/api/v1/admin/products/upload-video-url",
        { contentType: file.type }
      );
      const { uploadUrl, publicUrl } = res.data;

      setUploadProgress("Uploading video…");
      const putRes = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!putRes.ok) throw new Error(`R2 upload failed (${putRes.status})`);

      onChange([...videos, { url: publicUrl }]);
    } catch {
      setUploadError("Upload failed — check R2 configuration");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      setUploadProgress(null);
    }
  }

  function updateVideo(idx: number, updated: ProductVideo) {
    const next = [...videos];
    next[idx] = updated;
    onChange(next);
  }

  function deleteVideo(idx: number) {
    onChange(videos.filter((_, i) => i !== idx));
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    const next = [...videos];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  }

  function moveDown(idx: number) {
    if (idx === videos.length - 1) return;
    const next = [...videos];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChange(next);
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {/* Header + upload button */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Product videos
          </p>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "var(--text-muted)" }}>
            First video plays on hover in product cards. All appear in the PDP gallery after images.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            flexShrink: 0, padding: "0.55rem 1rem", borderRadius: 8,
            border: "1px solid rgba(249,115,22,0.4)", background: "rgba(249,115,22,0.08)",
            color: uploading ? "var(--text-muted)" : "var(--accent)",
            fontSize: "0.82rem", fontWeight: 700,
            cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.55 : 1,
          }}
        >
          {uploading ? (uploadProgress ?? "Uploading…") : "+ Upload video"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleVideoUpload(f);
            e.target.value = "";
          }}
        />
      </div>

      {uploadError && (
        <div style={{ padding: "0.6rem 0.9rem", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.82rem", color: "var(--danger)" }}>
          {uploadError}
        </div>
      )}

      {/* Video list */}
      {videos.length === 0 ? (
        <div style={{ padding: "2.5rem", textAlign: "center", border: "1px dashed var(--border)", borderRadius: 12, color: "var(--text-muted)", fontSize: "0.85rem" }}>
          No videos yet. Upload an MP4 or WebM file.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {videos.map((video, idx) => (
            <div key={`${video.url}-${idx}`} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.5rem", alignItems: "start" }}>
              <VideoRow video={video} index={idx} onUpdate={updateVideo} onDelete={deleteVideo} />
              {/* Reorder buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", paddingTop: 4 }}>
                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  title="Move up"
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    border: "1px solid var(--border)", background: "transparent",
                    color: idx === 0 ? "rgba(255,255,255,0.1)" : "var(--text-muted)",
                    fontSize: "0.75rem", cursor: idx === 0 ? "not-allowed" : "pointer",
                  }}
                >▲</button>
                <button
                  type="button"
                  onClick={() => moveDown(idx)}
                  disabled={idx === videos.length - 1}
                  title="Move down"
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    border: "1px solid var(--border)", background: "transparent",
                    color: idx === videos.length - 1 ? "rgba(255,255,255,0.1)" : "var(--text-muted)",
                    fontSize: "0.75rem", cursor: idx === videos.length - 1 ? "not-allowed" : "pointer",
                  }}
                >▼</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-muted)" }}>
        Changes are saved when you click <strong>Save changes</strong> at the bottom of the page.
      </p>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
type Tab = "details" | "variants" | "videos";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("details");
  const [form, setForm] = useState<FormState | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [videos, setVideos] = useState<ProductVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
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
          status: p.status,
          preorderShipDate: p.preorderShipDate ?? "",
          preorderNote: p.preorderNote ?? "",
        });
        setVariants(p.variants);
        setVideos(p.videos ?? []);
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
    if (form.status === "preorder" && !form.preorderShipDate) {
      setError("Estimated ship date is required for pre-order products");
      return;
    }

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
        preorderShipDate: form.preorderShipDate || undefined,
        preorderNote: form.preorderNote || undefined,
        variants,
        videos,
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

  const tabStyle = (t: Tab): React.CSSProperties => ({
    padding: "0.45rem 1rem",
    borderRadius: 8,
    border: "none",
    background: tab === t ? "rgba(249,115,22,0.12)" : "transparent",
    color: tab === t ? "var(--accent)" : "var(--text-muted)",
    fontWeight: tab === t ? 700 : 500,
    fontSize: "0.82rem",
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
  });

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
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "monospace" }}>ID: {id}</span>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(id).catch(() => {})}
          style={{ padding: "0.15rem 0.45rem", borderRadius: 5, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "0.68rem", cursor: "pointer", fontFamily: "inherit" }}
        >Copy</button>
      </div>

      {/* Tab bar */}
      <div style={{
        display: "flex", gap: "0.25rem", padding: "0.3rem",
        borderRadius: 10, background: "rgba(255,255,255,0.04)",
        border: "1px solid var(--border)", marginBottom: "1.25rem", width: "fit-content",
      }}>
        <button type="button" style={tabStyle("details")} onClick={() => setTab("details")}>Details</button>
        <button type="button" style={tabStyle("variants")} onClick={() => setTab("variants")}>Variants</button>
        <button type="button" style={tabStyle("videos")} onClick={() => setTab("videos")}>
          Videos
          {videos.length > 0 && (
            <span style={{ marginLeft: "0.35rem", padding: "1px 6px", borderRadius: 999, fontSize: "0.65rem", fontWeight: 700, background: "rgba(249,115,22,0.2)", color: "var(--accent)" }}>
              {videos.length}
            </span>
          )}
        </button>
      </div>

      <form onSubmit={handleSave} style={{ display: "grid", gap: "1.25rem" }}>
        {error && (
          <div style={{ padding: "0.75rem 1rem", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", fontSize: "0.85rem", color: "var(--danger)" }}>
            {error}
          </div>
        )}

        {/* ── Details tab ── */}
        {tab === "details" && (
          <>
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
                    title={!form.title.trim() ? "Enter a product title first" : genLoading ? "Generating…" : "Generate description with AI"}
                    style={{ padding: "0.25rem 0.65rem", borderRadius: 6, border: "1px solid rgba(249,115,22,0.35)", background: "rgba(249,115,22,0.07)", color: genLoading || !form.title.trim() ? "var(--text-muted)" : "var(--accent)", fontSize: "0.72rem", fontWeight: 700, cursor: genLoading || !form.title.trim() ? "not-allowed" : "pointer", opacity: genLoading || !form.title.trim() ? 0.45 : 1 }}
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
                  <option value="preorder">Pre-order</option>
                </select>
              </div>
            </div>

            {/* Pre-order fields — only shown when status = preorder */}
            {form.status === "preorder" && (
              <div className="card" style={{ display: "grid", gap: "1rem", borderColor: "rgba(249,115,22,0.3)" }}>
                <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  📦 Pre-order settings
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-field">
                    <label className="form-label">Estimated ship date *</label>
                    <input
                      className="form-input"
                      type="date"
                      value={form.preorderShipDate}
                      onChange={(e) => set("preorderShipDate", e.target.value)}
                      style={{ borderColor: !form.preorderShipDate ? "rgba(249,115,22,0.5)" : undefined }}
                    />
                    {!form.preorderShipDate && (
                      <p style={{ margin: "0.25rem 0 0", fontSize: "0.72rem", color: "var(--accent)" }}>Required for pre-order</p>
                    )}
                  </div>
                  <div className="form-field">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <label className="form-label">Customer-facing note <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span></label>
                      <span style={{ fontSize: "0.68rem", color: form.preorderNote.length > 180 ? "var(--accent)" : "var(--text-muted)" }}>
                        {form.preorderNote.length}/200
                      </span>
                    </div>
                    <input
                      className="form-input"
                      type="text"
                      value={form.preorderNote}
                      onChange={(e) => set("preorderNote", e.target.value)}
                      placeholder="Ships September 2026"
                      maxLength={200}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Variants tab ── */}
        {tab === "variants" && (
          <div className="card" style={{ display: "grid", gap: "1rem" }}>
            <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Variants</p>
            <VariantEditor variants={variants} onChange={setVariants} />
          </div>
        )}

        {/* ── Videos tab ── */}
        {tab === "videos" && (
          <div className="card" style={{ display: "grid", gap: "1rem" }}>
            <VideosTab videos={videos} onChange={setVideos} onUploadingChange={setVideoUploading} />
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <Link href="/products" className="btn-ghost">Cancel</Link>
          <button type="submit" className="btn-primary" disabled={saving || videoUploading} title={videoUploading ? "Wait for video upload to finish" : undefined}>
            {saving ? "Saving…" : videoUploading ? "Uploading video…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
