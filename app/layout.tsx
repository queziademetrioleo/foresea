import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Nav from '@/components/Nav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Foresea — Uptime Operacional',
  description: 'Plataforma de gestão de documentos operacionais de sondas offshore Foresea',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Nav />
        <main className="main-content">{children}</main>
      </body>
    </html>
  );
}
