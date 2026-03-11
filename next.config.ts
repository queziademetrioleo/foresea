import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize all server-only packages so Turbopack/webpack don't try to bundle them
  serverExternalPackages: [
    'pg',
    'pg-native',
    'pg-pool',
    'pg-protocol',
    'pg-types',
    'pgpass',
    'pdf-parse',
    'pdfjs-dist',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
