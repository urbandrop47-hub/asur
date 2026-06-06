import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { Anton, Archivo, JetBrains_Mono, Noto_Serif_Devanagari } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AppProviders } from "../providers";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { AnnouncementBar } from "../components/announcement-bar";
import { ExitIntentPopup } from "../components/exit-intent-popup";
import { BottomTabBar } from "../components/bottom-tab-bar";
import { SwRegister } from "../components/sw-register";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

const notoSerifDevanagari = Noto_Serif_Devanagari({
  subsets: ["latin", "devanagari"],
  weight: ["400", "600", "700"],
  variable: "--font-deva",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://weareasur.in";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#06070b" },
    { media: "(prefers-color-scheme: light)", color: "#f97316" },
  ],
};

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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ASUR",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${anton.variable} ${archivo.variable} ${jetbrainsMono.variable} ${notoSerifDevanagari.variable}`}>
      <head />
      <body suppressHydrationWarning>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <AppProviders>
          <AnnouncementBar />
          <SiteHeader />
          <main id="main-content">{children}</main>
          <SiteFooter />
          <BottomTabBar />
          <ExitIntentPopup />
        </AppProviders>
        <SwRegister />
        {/* Razorpay checkout SDK — loaded lazily, only used on /checkout */}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        <Analytics />
      </body>
    </html>
  );
}
