import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export default function Home() {
    return (
        <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 64px)' }}>
            <div style={{ backgroundColor: '#1A1D56', padding: '60px 40px 120px', textAlign: 'center' }}>
                <h1 className="hero-title" style={{ margin: 0 }}>
                    Portal de informações <span style={{ background: 'linear-gradient(90deg, #10C1FF, #1DD693)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Operacionais</span>
                </h1>
            </div>

            <div className="doc-selector-section">
                <div className="doc-selector-card">
                    <div className="doc-types-grid" style={{ marginBottom: 0 }}>
                        {/* Uptime Card */}
                        <Link href="/upload" style={{ textDecoration: 'none' }}>
                            <div className="doc-type-btn active" style={{ height: '100%', minHeight: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <div className="doc-type-label" style={{ fontSize: '1.5rem', marginBottom: '12px' }}>UPTIME</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10C1FF', fontSize: '0.9rem', fontWeight: 600 }}>
                                    Acessar Módulo <ArrowUpRight size={18} />
                                </div>
                            </div>
                        </Link>

                        {/* Bad Card */}
                        <div className="doc-type-btn disabled" style={{ height: '100%', minHeight: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div className="doc-type-label" style={{ fontSize: '1.5rem', marginBottom: '12px' }}>BAD</div>
                            <div className="doc-type-desc">Em desenvolvimento</div>
                        </div>

                        {/* Day Rate Card */}
                        <div className="doc-type-btn disabled" style={{ height: '100%', minHeight: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div className="doc-type-label" style={{ fontSize: '1.5rem', marginBottom: '12px' }}>DAY RATE</div>
                            <div className="doc-type-desc">Em desenvolvimento</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
