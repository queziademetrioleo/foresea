'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileUp } from 'lucide-react';

export default function Nav() {
    const path = usePathname();

    return (
        <nav className="nav">
            <Link href="/upload" className="nav-logo">
                <img
                    src="/foresea-logo.png"
                    alt="Foresea"
                    style={{ height: 36, width: 'auto', objectFit: 'contain' }}
                />
                <span className="nav-app-name">Uptime Operacional</span>
            </Link>

            <div className="nav-links">
                <Link
                    href="/dashboard"
                    className={`nav-link ${path === '/dashboard' ? 'active' : ''}`}
                >
                    <LayoutDashboard size={16} />
                    Dashboard
                </Link>
                <Link
                    href="/upload"
                    className={`nav-link ${path === '/upload' ? 'active' : ''}`}
                >
                    <FileUp size={16} />
                    Upload
                </Link>
            </div>
        </nav>
    );
}
