/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true
  },
  transpilePackages: ["@asur/constants", "@asur/types", "@asur/ui", "@asur/utils"]
};

export default nextConfig;
