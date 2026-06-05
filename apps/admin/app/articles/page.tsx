"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";

type Article = {
  _id: string;
  slug: string;
  title: string;
  type: "blog" | "lookbook" | "drop";
  status: "draft" | "published";
  publishedAt?: string;
  updatedAt: string;
  tags: string[];
};

const TYPE_COLORS: Record<string, string> = {
  blog: "#38bdf8",
  lookbook: "#a78bfa",
  drop: "#f97316",
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const limit = 20;

  async function fetchArticles(p = 1) {
    setLoading(true);
    try {
      const res = await api.get<{ data: Article[]; total: number }>(`/api/v1/admin/articles?page=${p}&limit=${limit}`);
      setArticles(res.data ?? []);
      setTotal(res.total ?? 0);
      setPage(p);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void fetchArticles(); }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.del(`/api/v1/admin/articles/${id}`);
      await fetchArticles(page);
    } catch {
      alert("Failed to delete article.");
    } finally {
      setDeleting(null);
    }
  }

  async function toggleStatus(id: string, currentStatus: "draft" | "published") {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    const now = new Date().toISOString();
    try {
      await api.patch(`/api/v1/admin/articles/${id}`, {
        status: newStatus,
        ...(newStatus === "published" ? { publishedAt: now } : {}),
      });
      setArticles((prev) => prev.map((a) => a._id === id ? { ...a, status: newStatus, ...(newStatus === "published" ? { publishedAt: now } : {}) } : a));
    } catch {
      alert("Failed to update status.");
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ padding: "2rem", maxWidth: 1080 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: "0 0 0.2rem", fontSize: "1.5rem", fontWeight: 800 }}>Articles</h1>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>Blog, lookbooks, and drops</p>
        </div>
        <Link href="/articles/new" style={{
          padding: "0.7rem 1.4rem", borderRadius: 999, fontWeight: 700, fontSize: "0.88rem",
          background: "linear-gradient(135deg, #38bdf8, #8b5cf6)", color: "#0b1020",
          textDecoration: "none", display: "inline-block"
        }}>
          + New article
        </Link>
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.03)" }}>
                {["Title", "Type", "Status", "Published", ""].map((h) => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} style={{ padding: "0.75rem 1rem" }}>
                        <div className="skeleton skeleton-line" style={{ height: 14, width: j === 0 ? "80%" : "60%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                    No articles yet. <Link href="/articles/new" style={{ color: "var(--accent)" }}>Create one →</Link>
                  </td>
                </tr>
              ) : (
                articles.map((a) => (
                  <tr key={a._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "0.75rem 1rem", maxWidth: 280 }}>
                      <p style={{ margin: 0, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</p>
                      <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--f-mono)" }}>{a.slug}</p>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700, textTransform: "capitalize", color: TYPE_COLORS[a.type] ?? "var(--text-muted)", background: `${TYPE_COLORS[a.type] ?? "#888"}18` }}>
                        {a.type}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <button
                        onClick={() => toggleStatus(a._id, a.status)}
                        style={{
                          padding: "3px 10px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", border: "none",
                          background: a.status === "published" ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.07)",
                          color: a.status === "published" ? "#4ade80" : "var(--text-muted)",
                        }}
                      >
                        {a.status === "published" ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                      {a.publishedAt
                        ? new Date(a.publishedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Link href={`/articles/${a._id}`} style={{ padding: "4px 10px", borderRadius: 8, fontSize: "0.78rem", fontWeight: 600, background: "rgba(255,255,255,0.07)", color: "var(--text)", textDecoration: "none" }}>
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(a._id, a.title)}
                          disabled={deleting === a._id}
                          style={{ padding: "4px 10px", borderRadius: 8, fontSize: "0.78rem", fontWeight: 600, background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer", opacity: deleting === a._id ? 0.5 : 1 }}
                        >
                          {deleting === a._id ? "…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>{total} article{total !== 1 ? "s" : ""}</p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={() => fetchArticles(page - 1)} disabled={page <= 1} style={{ padding: "0.4rem 0.8rem", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer", opacity: page <= 1 ? 0.4 : 1, fontSize: "0.82rem" }}>← Prev</button>
              <span style={{ padding: "0.4rem 0.65rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>{page}/{totalPages}</span>
              <button onClick={() => fetchArticles(page + 1)} disabled={page >= totalPages} style={{ padding: "0.4rem 0.8rem", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer", opacity: page >= totalPages ? 0.4 : 1, fontSize: "0.82rem" }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
