'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileUp } from 'lucide-react';

export default function Nav() {
    const path = usePathname();

    return (
        <nav className="nav">
            <Link href="/upload" className="nav-logo">
                {/* Official Foresea SVG logo from CDN */}
                <img
                    src="https://foresea.com/wp-content/uploads/2023/06/logo_menu.svg"
                    alt="Foresea"
                    className="nav-logo-img"
                    style={{ height: 32 }}
                    onError={(e) => {
                        // Fallback: text logo
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
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
