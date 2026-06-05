"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "../../lib/api";

type Article = {
  _id: string;
  slug: string;
  title: string;
  type: "blog" | "lookbook" | "drop";
  heroImage?: string;
  excerpt?: string;
  tags: string[];
  publishedAt: string;
};

type Tab = "all" | "lookbook" | "blog";

const TYPE_LABELS: Record<Tab, string> = { all: "All", lookbook: "Lookbooks", blog: "Blog" };

function ArticleCard({ article, hero = false }: { article: Article; hero?: boolean }) {
  const date = new Date(article.publishedAt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
  const typeLabel = article.type === "lookbook" ? "Lookbook" : article.type === "drop" ? "Drop" : "Blog";
  const typeBg = article.type === "lookbook" ? "rgba(139,92,246,0.15)" : article.type === "drop" ? "rgba(249,115,22,0.15)" : "rgba(56,189,248,0.1)";
  const typeColor = article.type === "lookbook" ? "#a78bfa" : article.type === "drop" ? "#f97316" : "#38bdf8";

  return (
    <Link
      href={article.type === "drop" ? `/drops/${article.slug}` : `/journal/${article.slug}`}
      style={{ display: "block", textDecoration: "none" }}
    >
      <article
        style={{
          border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden",
          background: "rgba(255,255,255,0.02)",
          transition: "border-color 0.2s, transform 0.2s",
          height: "100%",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.transform = ""; }}
      >
        {/* Hero image */}
        <div style={{ position: "relative", aspectRatio: hero ? "16/7" : "16/9", background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
          {article.heroImage ? (
            <Image src={article.heroImage} alt={article.title} fill sizes="(max-width:768px) 100vw, 680px" style={{ objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(249,115,22,0.12), rgba(139,92,246,0.12))", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "2rem", opacity: 0.3 }}>◈</span>
            </div>
          )}
          {/* type badge */}
          <span style={{ position: "absolute", top: 12, left: 12, padding: "3px 10px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", background: typeBg, color: typeColor, backdropFilter: "blur(8px)" }}>
            {typeLabel}
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: hero ? "1.5rem 1.75rem" : "1.1rem 1.25rem" }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--f-mono)" }}>{date}</p>
          <h2 style={{ margin: "0 0 0.6rem", fontSize: hero ? "1.4rem" : "1rem", fontWeight: 800, lineHeight: 1.25, letterSpacing: "-0.01em" }}>
            {article.title}
          </h2>
          {article.excerpt && (
            <p style={{ margin: 0, fontSize: "0.88rem", color: "rgba(246,241,234,0.55)", lineHeight: 1.65, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {article.excerpt}
            </p>
          )}
          {article.tags.length > 0 && (
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.85rem" }}>
              {article.tags.slice(0, 3).map((tag) => (
                <span key={tag} style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.68rem", fontWeight: 600, background: "rgba(255,255,255,0.06)", color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

export default function JournalPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<Tab>("all");
  const [loading, setLoading] = useState(true);
  const limit = 12;

  async function fetchArticles(t: Tab, p: number) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (t !== "all") params.set("type", t);
      const res = await api.get<{ data: Article[]; total: number }>(`/api/v1/articles?${params}`);
      setArticles(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void fetchArticles(tab, 1); setPage(1); }, [tab]);

  const hero = articles[0];
  const rest = articles.slice(1);
  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.3rem", fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 900, letterSpacing: "-0.02em" }}>Journal</h1>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>Stories, lookbooks, and drop culture from ASUR.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {(["all", "lookbook", "blog"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "0.5rem 1.1rem", borderRadius: 999, fontSize: "0.85rem", fontWeight: 600,
              background: tab === t ? "linear-gradient(135deg, #f97316, #fb7185)" : "rgba(255,255,255,0.06)",
              color: tab === t ? "#130f0b" : "var(--text-muted)",
              border: "1px solid " + (tab === t ? "transparent" : "rgba(255,255,255,0.08)"),
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: "1.5rem" }}>
          <div className="skeleton" style={{ height: 380, borderRadius: 20 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 280, borderRadius: 20 }} />
            ))}
          </div>
        </div>
      ) : articles.length === 0 ? (
        <div style={{ textAlign: "center", padding: "5rem 0", color: "var(--text-muted)" }}>
          <p style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Nothing here yet</p>
          <p style={{ fontSize: "0.88rem" }}>Check back soon for stories, lookbooks, and drops.</p>
        </div>
      ) : (
        <>
          {/* Hero card */}
          {hero && (
            <div style={{ marginBottom: "2rem" }}>
              <ArticleCard article={hero} hero />
            </div>
          )}

          {/* Grid */}
          {rest.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
              {rest.map((a) => <ArticleCard key={a._id} article={a} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <button onClick={() => { setPage(page - 1); fetchArticles(tab, page - 1); }} disabled={page <= 1}
                style={{ padding: "0.5rem 1rem", borderRadius: 999, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1, fontSize: "0.85rem" }}>
                ← Prev
              </button>
              <span style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>{page} / {totalPages}</span>
              <button onClick={() => { setPage(page + 1); fetchArticles(tab, page + 1); }} disabled={page >= totalPages}
                style={{ padding: "0.5rem 1rem", borderRadius: 999, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.4 : 1, fontSize: "0.85rem" }}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
