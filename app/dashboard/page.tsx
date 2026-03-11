'use client';

import { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { Droplet, Flame, Activity, Ship, Gauge, Map } from 'lucide-react';
import { DBRow } from '@/lib/mappers';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function DashboardPage() {
    const [data, setData] = useState<DBRow[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/data?limit=100')
            .then(res => res.json())
            .then(json => {
                if (json.data) {
                    // Sort ascending by date for charts
                    const sorted = [...json.data].sort((a, b) =>
                        new Date(a.data_registro || '').getTime() - new Date(b.data_registro || '').getTime()
                    );
                    setData(sorted);
                }
                if (json.summary) {
                    setSummary(json.summary);
                }
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--cyan)' }}></div>
            </div>
        );
    }

    // Calculate KPIs (fallback to local calculation if summary is missing)
    const totalRelatorios = summary?.total_registros ?? data.length;

    // Uptime Ratio
    const totalUptime = summary?.total_uptime_h ?? data.reduce((acc, row) => acc + (row.clausula_101 || 0), 0);
    const totalDowntime = summary?.total_downtime_h ?? data.reduce((acc, row) => acc + (row.clausula_102 || 0), 0);
    const possibleHours = totalRelatorios * 24;
    const uptimeRatio = possibleHours > 0 ? (totalUptime / possibleHours) * 100 : 0;

    const totalDiesel = summary?.total_diesel_m3 ?? data.reduce((acc, row) =>
        acc + (row.diesel_consumido_contratada || 0) + (row.diesel_consumido_petrobras || 0), 0
    );

    const totalAgua = summary?.total_agua_m3 ?? data.reduce((acc, row) => acc + (row.agua_consumida || 0), 0);

    // Charts Config
    const chartLabels = data.map(d => {
        if (!d.data_registro) return '';
        const date = new Date(d.data_registro);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });

    const uptimeChartData = {
        labels: chartLabels,
        datasets: [
            {
                label: 'Horas em Operação (Cláusula 101)',
                data: data.map(d => d.clausula_101 || 0),
                borderColor: '#2BC48A',
                backgroundColor: 'rgba(43, 196, 138, 0.1)',
                fill: true,
                tension: 0.4,
            },
            {
                label: 'Downtime (Cláusula 102)',
                data: data.map(d => d.clausula_102 || 0),
                borderColor: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.4,
            }
        ]
    };

    const consumosChartData = {
        labels: chartLabels,
        datasets: [
            {
                label: 'Diesel Consumido (m³)',
                data: data.map(d => (d.diesel_consumido_contratada || 0) + (d.diesel_consumido_petrobras || 0)),
                backgroundColor: '#1E2A5A',
                borderRadius: 4,
            },
            {
                label: 'Água Consumida (m³)',
                data: data.map(d => d.agua_consumida || 0),
                backgroundColor: '#2FA8D8',
                borderRadius: 4,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const, labels: { color: '#6B7280', font: { family: 'Inter' } } }
        },
        scales: {
            x: { grid: { color: '#E2E8F0' }, ticks: { color: '#6B7280' } },
            y: { grid: { color: '#E2E8F0' }, ticks: { color: '#6B7280' } }
        }
    };

    return (
        <div className="dashboard-container" style={{ padding: '40px 24px', maxWidth: '1400px', margin: '0 auto' }}>

            {/* Header KV */}
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '48px', fontWeight: '800', color: 'var(--blue-brand)', letterSpacing: '-1px', marginBottom: '8px' }}>
                    Indicadores de Operação Offshore
                </h1>
                <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>Monitoramento em tempo real de sondas e poços</p>
            </div>

            {/* KPI Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                marginBottom: '40px'
            }}>
                <div className="kpi-card" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-card)', borderBottom: '4px solid var(--success)' }}>
                    <div className="flex items-center gap-3 mb-4">
                        <div style={{ width: 40, height: 40, borderRadius: '8px', background: 'rgba(43, 196, 138, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                            <Activity size={20} />
                        </div>
                        <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Uptime Operacional</h3>
                    </div>
                    <div style={{ fontSize: '64px', fontWeight: '800', color: 'var(--success)', lineHeight: '1' }}>
                        {uptimeRatio.toFixed(1)}%
                    </div>
                </div>

                <div className="kpi-card" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-card)', borderBottom: '4px solid var(--blue-brand)' }}>
                    <div className="flex items-center gap-3 mb-4">
                        <div style={{ width: 40, height: 40, borderRadius: '8px', background: 'rgba(30, 42, 90, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-brand)' }}>
                            <Ship size={20} />
                        </div>
                        <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Relatórios Validados</h3>
                    </div>
                    <div style={{ fontSize: '64px', fontWeight: '800', color: 'var(--blue-brand)', lineHeight: '1' }}>
                        {totalRelatorios}
                    </div>
                </div>

                <div className="kpi-card" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-leaf)', padding: '24px', boxShadow: 'var(--shadow-card)', borderBottom: '4px solid var(--warning)' }}>
                    <div className="flex items-center gap-3 mb-4">
                        <div style={{ width: 40, height: 40, borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
                            <Flame size={20} />
                        </div>
                        <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Diesel Consumido (m³)</h3>
                    </div>
                    <div style={{ fontSize: '64px', fontWeight: '800', color: 'var(--warning)', lineHeight: '1' }}>
                        {totalDiesel.toFixed(0)}
                    </div>
                </div>

                <div className="kpi-card" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-card)', borderBottom: '4px solid var(--info)' }}>
                    <div className="flex items-center gap-3 mb-4">
                        <div style={{ width: 40, height: 40, borderRadius: '8px', background: 'rgba(47, 168, 216, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--info)' }}>
                            <Droplet size={20} />
                        </div>
                        <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Água Consumida (m³)</h3>
                    </div>
                    <div style={{ fontSize: '64px', fontWeight: '800', color: 'var(--info)', lineHeight: '1' }}>
                        {totalAgua.toFixed(0)}
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                gap: '24px',
                marginBottom: '40px'
            }}>
                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-card)' }}>
                    <div className="flex items-center gap-2 mb-6">
                        <Gauge size={20} color="var(--blue-brand)" />
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>Evolução de Uptime vs Downtime</h2>
                    </div>
                    <div style={{ height: '320px' }}>
                        {data.length > 0 ? <Line data={uptimeChartData} options={chartOptions as any} /> : <p className="text-muted">Sem dados ainda.</p>}
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-card)' }}>
                    <div className="flex items-center gap-2 mb-6">
                        <Activity size={20} color="var(--blue-brand)" />
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>Consumo de Recursos (Diesel/Água)</h2>
                    </div>
                    <div style={{ height: '320px' }}>
                        {data.length > 0 ? <Bar data={consumosChartData} options={chartOptions as any} /> : <p className="text-muted">Sem dados ainda.</p>}
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center gap-2 mb-6">
                    <Map size={20} color="var(--blue-brand)" />
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>Tabela de Monitoramento Diário</h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)' }}>
                                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Data</th>
                                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Sonda</th>
                                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Poço</th>
                                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Operação (h)</th>
                                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Downtime (h)</th>
                                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Diesel (m³)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-slate-50 transition-colors">
                                    <td style={{ padding: '16px', color: 'var(--text-primary)', fontWeight: '500' }}>
                                        {row.data_registro ? new Date(row.data_registro).toLocaleDateString('pt-BR') : '-'}
                                    </td>
                                    <td style={{ padding: '16px', color: 'var(--blue-mid)', fontWeight: '600' }}>{row.sonda}</td>
                                    <td style={{ padding: '16px', color: 'var(--text-primary)' }}>{row.poco}</td>
                                    <td style={{ padding: '16px', color: 'var(--success)', fontWeight: '600' }}>{row.clausula_101?.toFixed(1) || '0.0'}</td>
                                    <td style={{ padding: '16px', color: row.clausula_102 && row.clausula_102 > 0 ? 'var(--error)' : 'var(--text-muted)' }}>
                                        {row.clausula_102?.toFixed(1) || '0.0'}
                                    </td>
                                    <td style={{ padding: '16px', color: 'var(--warning)', fontWeight: '600' }}>
                                        {((row.diesel_consumido_contratada || 0) + (row.diesel_consumido_petrobras || 0)).toFixed(1)}
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        Nenhum relatório processado. Faça upload de documentos na página inicial.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
