import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { APP_NAME, APP_TAGLINE } from "@asur/constants";
import { AppProviders } from "../providers";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`
  },
  description: APP_TAGLINE
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AppProviders>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </AppProviders>
        {/* Razorpay checkout SDK — loaded lazily, only used on /checkout */}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
