"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { api } from "../../../lib/api";

function ConfirmHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const token = searchParams.get("token");
    if (!token) {
      router.replace("/newsletter/confirmed?status=invalid");
      return;
    }
    void api.get(`/api/v1/newsletter/confirm?token=${encodeURIComponent(token)}`)
      .then(() => router.replace("/newsletter/confirmed"))
      .catch(() => router.replace("/newsletter/confirmed?status=invalid"));
  }, [router, searchParams]);

  return (
    <div style={{ maxWidth: 420, margin: "8rem auto", padding: "0 1rem", textAlign: "center" }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(249,115,22,0.3)", borderTopColor: "#f97316", animation: "spin 0.8s linear infinite", margin: "0 auto 1.5rem" }} />
      <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)" }}>Confirming your subscription…</p>
    </div>
  );
}

export default function NewsletterConfirmPage() {
  return (
    <Suspense>
      <ConfirmHandler />
    </Suspense>
  );
}
