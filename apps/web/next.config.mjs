import { withSentryConfig } from "@sentry/nextjs";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    externalDir: true
  },
  transpilePackages: [
    "@asur/api-client",
    "@asur/constants",
    "@asur/types",
    "@asur/ui",
    "@asur/utils"
  ],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Cloudflare R2 public bucket (set R2_PUBLIC_URL in .env to enable)
      {
        protocol: "https",
        hostname: "*.r2.dev"
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com"
      },
      // Allow any custom R2 / CDN hostname via env var at build time
      ...(process.env.R2_PUBLIC_URL
        ? (() => {
            try {
              const u = new URL(process.env.R2_PUBLIC_URL);
              return [{ protocol: /** @type {"https"} */ ("https"), hostname: u.hostname }];
            } catch {
              return [];
            }
          })()
        : []),
      // Unsplash — used by the seed product images in dev
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  }
};

const configWithAnalyzer = withBundleAnalyzer(nextConfig);

export default process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
  ? withSentryConfig(configWithAnalyzer, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true
    })
  : configWithAnalyzer;
