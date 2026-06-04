"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSiteConfigStore } from "../store/site-config-store";

const DISMISS_KEY = "asur_ann_dismissed";

export function AnnouncementBar() {
  const { config, loaded, fetch } = useSiteConfigStore();
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetch();
    setMounted(true);
  }, [fetch]);

  useEffect(() => {
    if (!loaded) return;
    try {
      const prev = sessionStorage.getItem(DISMISS_KEY);
      // Show bar if: active AND not previously dismissed with this same text
      setDismissed(prev === config.announcementBar.text);
    } catch {
      setDismissed(false);
    }
  }, [loaded, config.announcementBar.text]);

  function dismiss() {
    try { sessionStorage.setItem(DISMISS_KEY, config.announcementBar.text); } catch {}
    setDismissed(true);
  }

  const bar = config.announcementBar;

  if (!mounted || !loaded || !bar.isActive || dismissed) return null;

  const content = (
    <span style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#130f0b" }}>
      {bar.text}
    </span>
  );

  return (
    <div
      role="banner"
      style={{
        position: "relative",
        background: bar.bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.55rem 2.5rem 0.55rem 1rem",
        zIndex: 1000,
        minHeight: 38
      }}
    >
      {bar.link ? (
        <Link href={bar.link} style={{ textDecoration: "none" }}>
          {content}
        </Link>
      ) : content}

      <button
        onClick={dismiss}
        aria-label="Dismiss announcement"
        style={{
          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer",
          color: "rgba(19,15,11,0.6)", fontSize: "1rem", lineHeight: 1,
          padding: "0.2rem 0.4rem", borderRadius: 4
        }}
      >
        ✕
      </button>
    </div>
  );
}
