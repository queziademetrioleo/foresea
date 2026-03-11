'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileUp } from 'lucide-react';

export default function Nav() {
    const path = usePathname();

    return (
        <nav className="nav">
            <div className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                    <img
                        src="/foresea-logo.png"
                        alt="Foresea"
                        style={{ height: 36, width: 'auto', objectFit: 'contain' }}
                    />
                    <span className="nav-app-name" style={{ borderBottom: '2px solid #5edafb', paddingBottom: '4px' }}>OPERACIONAL</span>
                </Link>
                <div style={{ display: 'flex', gap: '16px', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '16px' }}>
                    <span className="nav-app-name" style={{ opacity: 0.5, cursor: 'default', fontSize: '1rem' }}>ADM CONTRATUAL</span>
                    <span className="nav-app-name" style={{ opacity: 0.5, cursor: 'default', fontSize: '1rem' }}>FINANCEIRO</span>
                </div>
            </div>

            <div className="nav-links">
                <Link
                    href="https://foresea-dashboard.streamlit.app/"
                    target="_blank"
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
