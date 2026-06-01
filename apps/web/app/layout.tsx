import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { AppProviders } from "../providers";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://asur.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ASUR — Neither Divine. Nor Damned.",
    template: "%s — ASUR",
  },
  description: "Premium Indian streetwear. Single price. No restock. No apology.",
  alternates: {
    canonical: SITE_URL,
    languages: { "en-IN": SITE_URL },
  },
  openGraph: {
    siteName: "ASUR",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    site: "@wearASUR",
    creator: "@wearASUR",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600;700&family=Noto+Serif+Devanagari:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <AppProviders>
          <SiteHeader />
          <main id="main-content">{children}</main>
          <SiteFooter />
        </AppProviders>
        {/* Razorpay checkout SDK — loaded lazily, only used on /checkout */}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
