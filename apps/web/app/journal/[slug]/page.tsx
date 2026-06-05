"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@asur/types";
import { api } from "../../../lib/api";
import { ProductCard } from "../../../components/product-card";

type ArticleBlock = {
  type: "text" | "image" | "product_embed";
  content: string;
  caption?: string;
  order: number;
};

type Article = {
  _id: string;
  slug: string;
  title: string;
  type: "blog" | "lookbook" | "drop";
  heroImage?: string;
  excerpt?: string;
  blocks: ArticleBlock[];
  tags: string[];
  publishedAt: string;
  seoTitle?: string;
  seoDescription?: string;
};

// ── Simple text block renderer: newlines → paragraphs ─────────────
function TextBlock({ content }: { content: string }) {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {content.split("\n\n").filter(Boolean).map((para, i) => (
        <p key={i} style={{ margin: 0, fontSize: "1rem", lineHeight: 1.8, color: "rgba(246,241,234,0.82)" }}>
          {para}
        </p>
      ))}
    </div>
  );
}

function ImageBlock({ content, caption }: { content: string; caption?: string }) {
  return (
    <figure style={{ margin: "1.5rem 0" }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 16, overflow: "hidden", background: "rgba(255,255,255,0.04)" }}>
        <Image src={content} alt={caption ?? "Article image"} fill sizes="(max-width:768px) 100vw, 760px" style={{ objectFit: "cover" }} />
      </div>
      {caption && (
        <figcaption style={{ marginTop: "0.6rem", fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center", fontStyle: "italic" }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function ProductEmbedBlock({ slugs }: { slugs: string[] }) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetches = slugs.map((slug) =>
      api.get<{ data: Product }>(`/api/v1/products/${slug}`).then((r) => r.data).catch(() => null)
    );
    Promise.all(fetches).then((results) => {
      setProducts(results.filter((p): p is Product => !!p));
    });
  }, [slugs]);

  if (products.length === 0) return null;

  return (
    <div style={{ margin: "1.5rem 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}

function RelatedCard({ article }: { article: Article }) {
  const href = article.type === "drop" ? `/drops/${article.slug}` : `/journal/${article.slug}`;
  return (
    <Link href={href} style={{ display: "block", textDecoration: "none" }}>
      <article style={{ border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", background: "rgba(255,255,255,0.02)", transition: "border-color 0.2s" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
        <div style={{ position: "relative", aspectRatio: "16/9", background: "rgba(255,255,255,0.04)" }}>
          {article.heroImage
            ? <Image src={article.heroImage} alt={article.title} fill sizes="360px" style={{ objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(249,115,22,0.1), rgba(139,92,246,0.1))" }} />
          }
        </div>
        <div style={{ padding: "1rem" }}>
          <p style={{ margin: "0 0 0.35rem", fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--f-mono)" }}>
            {new Date(article.publishedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
          <h3 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 700, lineHeight: 1.3 }}>{article.title}</h3>
        </div>
      </article>
    </Link>
  );
}

export default function JournalSlugPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    void api.get<{ data: Article }>(`/api/v1/articles/${slug}`)
      .then((r) => {
        setArticle(r.data);
        setLoading(false);
        // Fetch related articles separately — failure must not redirect away from the loaded article
        void api.get<{ data: Article[] }>(`/api/v1/articles/${slug}/related`)
          .then((rel) => setRelated(rel.data ?? []))
          .catch(() => { /* silently skip related */ });
      })
      .catch(() => { router.replace("/journal"); });
  }, [slug, router]);

  if (loading) {
    return (
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "2rem 1rem" }}>
        <div className="skeleton" style={{ height: 420, borderRadius: 20, marginBottom: "2rem" }} />
        <div className="skeleton skeleton-line" style={{ height: 36, width: "60%", marginBottom: "1rem" }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-line" style={{ height: 16, marginBottom: "0.75rem", width: i % 3 === 2 ? "70%" : "100%" }} />
        ))}
      </div>
    );
  }

  if (!article) return null;

  const sortedBlocks = [...article.blocks].sort((a, b) => a.order - b.order);

  return (
    <article style={{ maxWidth: 760, margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Breadcrumb */}
      <nav style={{ marginBottom: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
        <Link href="/journal" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Journal</Link>
        <span style={{ margin: "0 0.4rem" }}>›</span>
        <span>{article.title}</span>
      </nav>

      {/* Hero */}
      {article.heroImage && (
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/7", borderRadius: 20, overflow: "hidden", marginBottom: "2rem" }}>
          <Image src={article.heroImage} alt={article.title} fill sizes="760px" style={{ objectFit: "cover" }} priority />
        </div>
      )}

      {/* Meta */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <span style={{
          padding: "3px 10px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
          background: article.type === "lookbook" ? "rgba(139,92,246,0.15)" : "rgba(249,115,22,0.12)",
          color: article.type === "lookbook" ? "#a78bfa" : "#f97316",
        }}>
          {article.type}
        </span>
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "var(--f-mono)" }}>
          {new Date(article.publishedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
        </span>
      </div>

      <h1 style={{ margin: "0 0 1rem", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
        {article.title}
      </h1>

      {article.excerpt && (
        <p style={{ margin: "0 0 2rem", fontSize: "1.05rem", color: "rgba(246,241,234,0.55)", lineHeight: 1.7, borderLeft: "3px solid rgba(249,115,22,0.4)", paddingLeft: "1rem" }}>
          {article.excerpt}
        </p>
      )}

      {/* Blocks */}
      <div style={{ display: "grid", gap: "2rem" }}>
        {sortedBlocks.map((block, i) => {
          if (block.type === "text") return <TextBlock key={i} content={block.content} />;
          if (block.type === "image") return <ImageBlock key={i} content={block.content} caption={block.caption} />;
          if (block.type === "product_embed") {
            const slugs = block.content.split(",").map((s) => s.trim()).filter(Boolean);
            return <ProductEmbedBlock key={i} slugs={slugs} />;
          }
          return null;
        })}
      </div>

      {/* Tags */}
      {article.tags.length > 0 && (
        <div style={{ marginTop: "2.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {article.tags.map((tag) => (
            <span key={tag} style={{ padding: "4px 12px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600, background: "rgba(255,255,255,0.06)", color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.08)" }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.1rem", fontWeight: 800 }}>More from the journal</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
            {related.map((r) => <RelatedCard key={r._id} article={r as Article} />)}
          </div>
        </section>
      )}
    </article>
  );
}
