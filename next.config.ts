import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'postgres',
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
