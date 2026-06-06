/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true
  },
  transpilePackages: ["@asur/api-client", "@asur/constants", "@asur/types", "@asur/ui", "@asur/utils"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Cloudflare R2 public bucket
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      // Allow explicit R2_PUBLIC_URL hostname at build time
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
      // Unsplash — seed images in dev
      { protocol: "https", hostname: "images.unsplash.com" }
    ]
  }
};

export default nextConfig;
