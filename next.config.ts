import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ATENÇÃO: Mudança crítica para resolver o erro de "Módulo não encontrado"
  // Removendo 'serverExternalPackages'. Isso força o Next.js a incluir 
  // o driver de banco de dados diretamente no pacote (bundle).
  // Como estamos usando o 'postgres.js' (que é JS puro), isso vai funcionar.
  
  output: 'standalone',

  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
