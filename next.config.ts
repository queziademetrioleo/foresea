import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow large PDF uploads (up to 50MB)
  serverExternalPackages: ['pdf-parse', 'pg'],
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
