/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true
  },
  transpilePackages: ["@asur/api-client", "@asur/constants", "@asur/types", "@asur/ui", "@asur/utils"]
};

export default nextConfig;
