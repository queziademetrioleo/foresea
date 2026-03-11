'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileUp } from 'lucide-react';

export default function Nav() {
    const path = usePathname();

    return (
        <nav className="nav">
            <Link href="/dashboard" className="nav-logo">
                <div className="nav-logo-icon" style={{
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, var(--blue-brand), var(--blue-mid))',
                    color: 'white'
                }}>
                    F
                </div>
                <div>
                    <div className="nav-logo-text" style={{ color: 'var(--blue-brand)' }}>Foresea</div>
                    <div className="nav-logo-sub">Operations Intelligence</div>
                </div>
            </Link>

            <div className="nav-links">
                <Link
                    href="/dashboard"
                    className={`nav-link ${path === '/dashboard' ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <LayoutDashboard size={18} />
                    Dashboard
                </Link>
                <Link
                    href="/upload"
                    className={`nav-link ${path === '/upload' ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <FileUp size={18} />
                    Upload
                </Link>
            </div>
        </nav>
    );
}
