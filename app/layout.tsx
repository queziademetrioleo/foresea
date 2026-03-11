import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import Nav from '@/components/Nav';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Foresea — Uptime Operacional',
  description: 'Plataforma de gestão de relatórios operacionais de sondas offshore Foresea',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={poppins.className}>
        <Nav />
        <main className="main-content">{children}</main>
      </body>
    </html>
  );
}
