"use client";

import { useEffect, useRef, useState } from "react";

export type StockEntry = { sku: string; stock: number };

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Subscribes to live variant stock for a product via SSE.
 * Returns a map of { [sku]: stock } that updates in real-time.
 * Falls back to `initialVariants` when SSE is unavailable.
 */
export function useStockStream(
  slug: string,
  initialVariants: Array<{ sku: string; stock: number }>
): { stockMap: Record<string, number>; live: boolean } {
  const [stockMap, setStockMap] = useState<Record<string, number>>(() =>
    Object.fromEntries(initialVariants.map((v) => [v.sku, v.stock]))
  );
  const [live, setLive] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!slug) return;

    // SSE not available in SSR or non-browser envs
    if (typeof window === "undefined" || !window.EventSource) return;

    const es = new EventSource(`${API_BASE}/api/v1/products/${encodeURIComponent(slug)}/stock-stream`);
    esRef.current = es;

    es.onopen = () => setLive(true);

    es.onmessage = (event) => {
      try {
        const entries: StockEntry[] = JSON.parse(event.data as string);
        setStockMap(Object.fromEntries(entries.map((e) => [e.sku, e.stock])));
        setLive(true);
      } catch {
        // Malformed message — ignore
      }
    };

    es.onerror = () => {
      setLive(false);
      es.close();
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [slug]);

  return { stockMap, live };
}
