"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@asur/types";
import { api } from "../../../lib/api";
import { ProductCard } from "../../../components/product-card";
import { useAuthStore } from "../../../store/auth-store";

type Article = {
  _id: string;
  slug: string;
  title: string;
  requiresAccessCode?: boolean;
  type: "drop";
  heroImage?: string;
  excerpt?: string;
  collectionSlug?: string;
  publishedAt: string;
  tags: string[];
};

type Countdown = { days: number; hours: number; minutes: number; seconds: number };

function getCountdown(target: Date): Countdown {
  const diff = Math.max(0, target.getTime() - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

function CountdownBlock({ target }: { target: Date }) {
  const [cd, setCd] = useState<Countdown>(getCountdown(target));

  useEffect(() => {
    const t = setInterval(() => setCd(getCountdown(target)), 1000);
    return () => clearInterval(t);
  }, [target]);

  const units = [
    { label: "Days", value: cd.days },
    { label: "Hours", value: cd.hours },
    { label: "Min", value: cd.minutes },
    { label: "Sec", value: cd.seconds },
  ];

  return (
    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
      {units.map(({ label, value }) => (
        <div key={label} style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          minWidth: 72, padding: "1rem 1.25rem",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(249,115,22,0.2)",
          borderRadius: 16,
        }}>
          <span style={{ fontSize: "2rem", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.03em", color: "#f97316" }}>
            {String(value).padStart(2, "0")}
          </span>
          <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)", marginTop: "0.3rem" }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function NotifyMeForm() {
  const session = useAuthStore((s) => s.session);
  const [email, setEmail] = useState(session?.user.email ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "already" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setStatus("loading");
    try {
      const res = await api.post<{ success: boolean; alreadySubscribed: boolean }>(
        "/api/v1/newsletter/subscribe",
        { email: trimmed, source: "drop_notify" }
      );
      setStatus(res.alreadySubscribed ? "already" : "done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div style={{ padding: "1rem 1.25rem", borderRadius: 12, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "#4ade80", fontWeight: 600 }}>
          You&apos;re on the list. Check your inbox to confirm, then we&apos;ll notify you the moment this drops.
        </p>
      </div>
    );
  }

  if (status === "already") {
    return (
      <div style={{ padding: "1rem 1.25rem", borderRadius: 12, background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.2)", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "#f97316", fontWeight: 600 }}>
          You&apos;re already subscribed — we&apos;ll notify you when this drops.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
      <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)" }}>Be first in line.</p>
      <div style={{ display: "flex", gap: "0.5rem", width: "100%", maxWidth: 400, flexWrap: "wrap" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
          placeholder="your@email.com"
          required
          style={{
            flex: "1 1 180px", padding: "0.7rem 1rem", borderRadius: 999,
            border: status === "error" ? "1px solid var(--danger)" : "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)", color: "var(--text)", fontSize: "0.9rem", outline: "none", fontFamily: "inherit",
          }}
        />
        <button type="submit" disabled={status === "loading"}
          style={{ padding: "0.7rem 1.5rem", borderRadius: 999, fontWeight: 700, fontSize: "0.9rem", background: "linear-gradient(135deg,#f97316,#fb7185)", color: "#130f0b", border: "none", cursor: "pointer", flexShrink: 0, opacity: status === "loading" ? 0.7 : 1 }}>
          {status === "loading" ? "…" : "Notify Me"}
        </button>
      </div>
      {status === "error" && <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--danger)" }}>Something went wrong. Try again.</p>}
    </form>
  );
}

// ── Access code gate for restricted drops ─────────────────────────────────────
function AccessGate({ slug, onUnlock }: { slug: string; onUnlock: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  // Persist unlock in sessionStorage so page refreshes don't re-gate
  const STORAGE_KEY = `drop_access_${slug}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setChecking(true);
    try {
      await api.post(`/api/v1/articles/drops/${encodeURIComponent(slug)}/access`, { code: code.trim().toUpperCase() });
      sessionStorage.setItem(STORAGE_KEY, "1");
      onUnlock();
    } catch {
      setError("Invalid access code. Try again.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div style={{
      maxWidth: 420, margin: "6rem auto", padding: "2.5rem 2rem",
      borderRadius: 20, border: "1px solid rgba(249,115,22,0.2)",
      background: "rgba(249,115,22,0.04)", textAlign: "center",
    }}>
      <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔒</div>
      <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.2rem", fontWeight: 800 }}>
        Early access only
      </h2>
      <p style={{ margin: "0 0 1.5rem", fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
        This drop is restricted. Enter your access code to unlock it.
      </p>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
          placeholder="ACCESS CODE"
          maxLength={64}
          required
          style={{
            padding: "0.85rem 1rem", borderRadius: 12, textAlign: "center",
            border: error ? "1px solid var(--danger)" : "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)", color: "var(--text)",
            fontFamily: "var(--f-mono)", fontSize: "1rem", letterSpacing: "0.12em",
            outline: "none",
          }}
        />
        {error && (
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--danger)" }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={checking || !code.trim()}
          style={{
            padding: "0.85rem", borderRadius: 999, fontWeight: 700,
            fontSize: "0.95rem", cursor: "pointer", border: "none",
            background: "linear-gradient(135deg, #f97316, #fb7185)", color: "#130f0b",
            opacity: checking ? 0.7 : 1,
          }}
        >
          {checking ? "Checking…" : "Unlock drop"}
        </button>
      </form>
    </div>
  );
}

export default function DropPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!slug) return;
    // Check sessionStorage first — avoids flickering the gate on refresh
    const alreadyUnlocked = typeof window !== "undefined" && sessionStorage.getItem(`drop_access_${slug}`) === "1";
    if (alreadyUnlocked) setUnlocked(true);
    void api.get<{ data: Article }>(`/api/v1/articles/drops/${slug}`)
      .then(async (r) => {
        setArticle(r.data);
        if (r.data.collectionSlug) {
          const prodsRes = await api.get<{ data: Product[] }>(`/api/v1/products?collection=${encodeURIComponent(r.data.collectionSlug)}`).catch(() => ({ data: [] as Product[] }));
          setProducts(prodsRes.data ?? []);
        }
        setLoading(false);
      })
      .catch(() => { router.replace("/journal"); });
  }, [slug, router]);

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
        <div className="skeleton" style={{ height: 420, borderRadius: 20, marginBottom: "2rem" }} />
        <div className="skeleton skeleton-line" style={{ height: 36, width: "50%", margin: "0 auto 1rem" }} />
      </div>
    );
  }

  if (!article) return null;

  // Show access gate if the drop requires a code and hasn't been unlocked yet
  if (article.requiresAccessCode && !unlocked) {
    return (
      <div style={{ padding: "0 1rem" }}>
        <AccessGate slug={article.slug} onUnlock={() => setUnlocked(true)} />
      </div>
    );
  }

  const dropDate = article.publishedAt ? new Date(article.publishedAt) : null;
  const isLive = !dropDate || dropDate <= new Date();

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 1rem 4rem" }}>
      {/* Hero */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "21/9", borderRadius: "0 0 24px 24px", overflow: "hidden", marginBottom: "2.5rem" }}>
        {article.heroImage ? (
          <Image src={article.heroImage} alt={article.title} fill sizes="960px" style={{ objectFit: "cover" }} priority />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(249,115,22,0.2), rgba(139,92,246,0.2))" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(11,10,15,0.85))" }} />
        <div style={{ position: "absolute", bottom: "2rem", left: "2rem", right: "2rem" }}>
          <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", background: "rgba(249,115,22,0.2)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)", backdropFilter: "blur(8px)" }}>
            Drop
          </span>
          <h1 style={{ margin: "0.6rem 0 0", fontSize: "clamp(1.6rem, 4vw, 2.6rem)", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#f6f1ea" }}>
            {article.title}
          </h1>
        </div>
      </div>

      {/* Countdown or Live badge */}
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        {!isLive && dropDate ? (
          <>
            <p style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)" }}>
              Dropping in
            </p>
            <CountdownBlock target={dropDate} />
          </>
        ) : (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1.25rem", borderRadius: 999, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} />
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#4ade80" }}>Drop is live</span>
          </div>
        )}
      </div>

      {/* Excerpt / narrative */}
      {article.excerpt && (
        <div style={{ maxWidth: 600, margin: "0 auto 3rem" }}>
          <p style={{ textAlign: "center", fontSize: "1.05rem", color: "rgba(246,241,234,0.65)", lineHeight: 1.8, fontStyle: "italic", margin: "0 0 1.5rem" }}>
            &ldquo;{article.excerpt}&rdquo;
          </p>
          {article.tags.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
              {article.tags.map((tag) => (
                <span key={tag} style={{ padding: "3px 10px", borderRadius: 999, fontSize: "0.68rem", fontWeight: 600, background: "rgba(255,255,255,0.06)", color: "rgba(246,241,234,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Products or Notify Me */}
      {isLive && products.length > 0 ? (
        <section>
          <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.1rem", fontWeight: 800, textAlign: "center" }}>Shop the drop</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1.25rem" }}>
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      ) : !isLive ? (
        <div style={{ textAlign: "center", padding: "2rem", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 20, background: "rgba(249,115,22,0.04)" }}>
          <NotifyMeForm />
        </div>
      ) : (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "3rem 0" }}>
          <p>Products for this drop are coming soon.</p>
        </div>
      )}

      <div style={{ marginTop: "3rem", textAlign: "center" }}>
        <Link href="/journal" style={{ fontSize: "0.85rem", color: "var(--text-muted)", textDecoration: "underline" }}>← Back to Journal</Link>
      </div>
    </div>
  );
}
