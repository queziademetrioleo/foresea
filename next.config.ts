import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O modo 'standalone' cria uma pasta compacta com todas as dependências inclusas
  // Isso resolve erros de "Módulo não encontrado" em ambientes de nuvem
  output: 'standalone',
  
  serverExternalPackages: [
    'pg',
  ],
  
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  
  // Desabilita avisos de lint durante o build para agilizar o deploy
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, 
  }
};

export default nextConfig;
