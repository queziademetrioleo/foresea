'use client';

import { useState, useCallback, useRef } from 'react';
import { FileText, Upload as UploadIcon, CheckCircle, AlertCircle, Loader2, ListTodo, BrainCircuit, Database } from 'lucide-react';

interface StepStatus {
    upload: 'idle' | 'active' | 'done' | 'error';
    gemini: 'idle' | 'active' | 'done' | 'error';
    db: 'idle' | 'active' | 'done' | 'error';
}

interface FileEntry {
    id: string;
    file: File;
    steps: StepStatus;
    result?: Record<string, unknown>;
    error?: string;
    expanded: boolean;
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StepDot({ status, label, icon }: { status: string; label: string; icon: React.ReactNode }) {
    const cls = status === 'idle' ? 'step' : `step ${status}`;
    let inner: React.ReactNode = status === 'done' ? <CheckCircle size={12} /> : status === 'error' ? <AlertCircle size={12} /> : status === 'active' ? <Loader2 size={12} className="animate-spin" /> : null;

    // Fallback if not done/error/active
    if (status === 'idle') inner = '○';

    return (
        <div className={cls}>
            <div className="step-dot" style={{
                borderColor: status === 'active' ? 'var(--cyan)' : status === 'done' ? 'var(--success)' : status === 'error' ? 'var(--error)' : 'var(--border)'
            }}>
                {inner}
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {icon} {label}
            </span>
        </div>
    );
}

function Stepper({ steps }: { steps: StepStatus }) {
    return (
        <div className="stepper" style={{ background: '#F8FAFC', padding: '16px', borderRadius: 'var(--radius-md)', margin: '12px 0' }}>
            <StepDot status={steps.upload} label="Upload" icon={<ListTodo size={14} />} />
            <div className="step-connector" />
            <StepDot status={steps.gemini} label="Gemini Cloud" icon={<BrainCircuit size={14} />} />
            <div className="step-connector" />
            <StepDot status={steps.db} label="Cloud SQL" icon={<Database size={14} />} />
        </div>
    );
}

function ExtractedPreview({
    data,
    expanded,
    onToggle,
}: {
    data: Record<string, unknown>;
    expanded: boolean;
    onToggle: () => void;
}) {
    const d = data as {
        tipo_documento?: string;
        numero?: number;
        data?: string;
        sonda?: string;
        poco?: string;
        clausulas?: Record<string, number | string>;
        diesel_consumido?: Record<string, number>;
        oleo_diesel?: Record<string, number>;
        agua?: Record<string, number>;
        observacoes?: Record<string, string>;
        vagas_excedentes_utilizadas_petrobras?: number;
        outras_clausulas_encontradas?: string;
    };

    const clausulas = d.clausulas ?? {};
    const clausulaKeys = ['101', '102', '104.1A', '104.1B', '104.1C', '104.1D', '104.2', '104.2B', '104.2C', '105', '107', '2.1.1'];

    return (
        <div className="extracted-preview" style={{ marginTop: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div className="extracted-header" onClick={onToggle} style={{ background: 'var(--bg-primary)' }}>
                <h4 style={{ color: 'var(--blue-brand)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={16} /> Dados extraídos pelo Gemini Cloud
                </h4>
                <span className="extracted-toggle" style={{ color: 'var(--blue-brand)', fontWeight: '600' }}>
                    {expanded ? 'Ocultar Detalhes' : 'Ver Dados Extraídos'}
                </span>
            </div>
            {expanded && (
                <div className="extracted-body">
                    <div className="extracted-grid">
                        <div className="extracted-item">
                            <span className="extracted-label">Tipo</span>
                            <span className="extracted-value" style={{ color: 'var(--cyan)' }}>{d.tipo_documento ?? '—'}</span>
                        </div>
                        <div className="extracted-item">
                            <span className="extracted-label">Número</span>
                            <span className="extracted-value">#{d.numero ?? '—'}</span>
                        </div>
                        <div className="extracted-item">
                            <span className="extracted-label">Data</span>
                            <span className="extracted-value">{d.data ?? '—'}</span>
                        </div>
                        <div className="extracted-item">
                            <span className="extracted-label">Sonda</span>
                            <span className="extracted-value">{d.sonda ?? '—'}</span>
                        </div>
                        <div className="extracted-item" style={{ gridColumn: '1 / -1' }}>
                            <span className="extracted-label">Poço</span>
                            <span className="extracted-value">{d.poco ?? '—'}</span>
                        </div>
                    </div>

                    <div className="extracted-section-title">Cláusulas (horas)</div>
                    <div className="extracted-clauses">
                        {clausulaKeys.map((key) => {
                            const val = key === 'motivo_102' ? undefined : clausulas[key];
                            const num = typeof val === 'number' ? val : null;
                            return (
                                <div key={key} className="clause-pill" style={{ background: '#F8FAFC' }}>
                                    <div className="clause-pill-label">{key}</div>
                                    <div className={`clause-pill-value ${num && num > 0 ? 'nonzero' : ''}`} style={{ color: num && num > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
                                        {num !== null ? num : '—'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {d.diesel_consumido && (
                        <>
                            <div className="extracted-section-title">Diesel Consumido (m³)</div>
                            <div className="extracted-grid">
                                <div className="extracted-item">
                                    <span className="extracted-label">Contratada</span>
                                    <span className="extracted-value">{d.diesel_consumido.contratada ?? '—'}</span>
                                </div>
                                <div className="extracted-item">
                                    <span className="extracted-label">Petrobras</span>
                                    <span className="extracted-value">{d.diesel_consumido.petrobras ?? '—'}</span>
                                </div>
                            </div>
                        </>
                    )}

                    {d.oleo_diesel && (
                        <>
                            <div className="extracted-section-title">Óleo Diesel (m³)</div>
                            <div className="extracted-grid">
                                <div className="extracted-item">
                                    <span className="extracted-label">Inicial</span>
                                    <span className="extracted-value">{d.oleo_diesel.inicial ?? '—'}</span>
                                </div>
                                <div className="extracted-item">
                                    <span className="extracted-label">Recebido</span>
                                    <span className="extracted-value">{d.oleo_diesel.recebido ?? '—'}</span>
                                </div>
                                <div className="extracted-item">
                                    <span className="extracted-label">Atual</span>
                                    <span className="extracted-value">{d.oleo_diesel.atual ?? '—'}</span>
                                </div>
                            </div>
                        </>
                    )}

                    {d.agua && (
                        <>
                            <div className="extracted-section-title">Água (m³)</div>
                            <div className="extracted-grid">
                                <div className="extracted-item">
                                    <span className="extracted-label">Inicial</span>
                                    <span className="extracted-value">{d.agua.inicial ?? '—'}</span>
                                </div>
                                <div className="extracted-item">
                                    <span className="extracted-label">Atual</span>
                                    <span className="extracted-value">{d.agua.atual ?? '—'}</span>
                                </div>
                                <div className="extracted-item">
                                    <span className="extracted-label">Produzida</span>
                                    <span className="extracted-value">{d.agua.produzida ?? '—'}</span>
                                </div>
                                <div className="extracted-item">
                                    <span className="extracted-label">Consumida</span>
                                    <span className="extracted-value">{d.agua.consumida ?? '—'}</span>
                                </div>
                            </div>
                        </>
                    )}

                    {d.observacoes?.fiscalizacao && (
                        <>
                            <div className="extracted-section-title">Observação Fiscalização</div>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, background: '#F8FAFC', padding: '12px', borderRadius: '8px' }}>
                                {d.observacoes.fiscalizacao}
                            </p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default function UploadPage() {
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const [processing, setProcessing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const addFiles = useCallback((newFiles: File[]) => {
        const pdfs = newFiles.filter((f) => f.name.toLowerCase().endsWith('.pdf'));
        if (!pdfs.length) return;
        setFiles((prev) => [
            ...prev,
            ...pdfs.map((f) => ({
                id: `${f.name}-${Date.now()}-${Math.random()}`,
                file: f,
                steps: { upload: 'idle', gemini: 'idle', db: 'idle' } as StepStatus,
                expanded: false,
            })),
        ]);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        addFiles(Array.from(e.dataTransfer.files));
    }, [addFiles]);

    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const toggleExpand = (id: string) => {
        setFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, expanded: !f.expanded } : f))
        );
    };

    const setStep = (id: string, step: keyof StepStatus, status: StepStatus[keyof StepStatus]) => {
        setFiles((prev) =>
            prev.map((f) =>
                f.id === id ? { ...f, steps: { ...f.steps, [step]: status } } : f
            )
        );
    };

    const setResult = (id: string, result: Record<string, unknown>) => {
        setFiles((prev) =>
            prev.map((f) =>
                f.id === id ? { ...f, result, expanded: true } : f
            )
        );
    };

    const setError = (id: string, error: string) => {
        setFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, error } : f))
        );
    };

    const processFile = async (entry: FileEntry) => {
        setStep(entry.id, 'upload', 'active');
        const form = new FormData();
        form.append('file', entry.file);

        try {
            setStep(entry.id, 'upload', 'done');
            setStep(entry.id, 'gemini', 'active');

            const res = await fetch('/api/upload', { method: 'POST', body: form });
            const json = await res.json();

            if (!res.ok) {
                const errMsg = json.error ?? 'Erro desconhecido';
                // Detect which step failed
                if (errMsg.includes('PDF') || errMsg.includes('texto')) {
                    setStep(entry.id, 'gemini', 'error');
                } else if (errMsg.includes('banco') || errMsg.includes('inserir')) {
                    setStep(entry.id, 'gemini', 'done');
                    setStep(entry.id, 'db', 'error');
                } else {
                    setStep(entry.id, 'gemini', 'error');
                }
                setError(entry.id, errMsg);
                return;
            }

            setStep(entry.id, 'gemini', 'done');
            setStep(entry.id, 'db', 'active');

            // Small delay for UX
            await new Promise((r) => setTimeout(r, 400));
            setStep(entry.id, 'db', 'done');
            setResult(entry.id, json.dados);
        } catch (err) {
            setStep(entry.id, 'upload', 'error');
            setError(entry.id, err instanceof Error ? err.message : 'Erro de rede');
        }
    };

    const processAll = async () => {
        const pending = files.filter((f) => f.steps.db !== 'done' && !f.error);
        if (!pending.length) return;
        setProcessing(true);
        // Process sequentially to avoid rate limits
        for (const entry of pending) {
            await processFile(entry);
        }
        setProcessing(false);
    };

    const pendingCount = files.filter((f) => f.steps.db !== 'done' && !f.error).length;
    const doneCount = files.filter((f) => f.steps.db === 'done').length;
    const errorCount = files.filter((f) => !!f.error).length;

    return (
        <div className="upload-page">
            <div className="page-header" style={{ textAlign: 'center' }}>
                <div className="page-badge">Foresea Cloud Intelligence</div>
                <h1 className="page-title" style={{ color: 'var(--blue-brand)' }}>
                    Importar <span>Relatórios Diários</span>
                </h1>
                <p className="page-subtitle" style={{ margin: '0 auto 40px' }}>
                    Extração automática de relatórios ADA, ADP ou BM via Gemini 2.5 Pro.
                    Monitoramento em tempo real e integração direta com Cloud SQL.
                </p>
            </div>

            {/* Drop Zone */}
            <div
                className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                style={{ padding: '64px 32px' }}
            >
                <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: 'var(--cyan-dim)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', margin: '0 auto 24px', color: 'var(--cyan)'
                }}>
                    <UploadIcon size={32} />
                </div>
                <div className="drop-title" style={{ fontSize: '24px', fontWeight: '700' }}>Arraste seus PDFs aqui</div>
                <div className="drop-subtitle" style={{ color: 'var(--text-secondary)' }}>
                    ou clique para selecionar arquivos do seu computador
                </div>
                <button className="btn-upload" type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }} style={{ marginTop: '24px', borderRadius: 'var(--radius-md)', padding: '12px 32px' }}>
                    Selecionar Arquivos
                </button>
                <div className="drop-hint" style={{ marginTop: '20px' }}>
                    <span>📋</span> Suporta múltiplos arquivos — ADA, ADP e BM
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    className="drop-input"
                    accept=".pdf"
                    multiple
                    onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
                />
            </div>

            {/* File List */}
            {files.length > 0 && (
                <>
                    <div className="file-list" style={{ marginTop: '40px' }}>
                        {files.map((entry) => (
                            <div key={entry.id} className="file-card" style={{ boxShadow: 'var(--shadow-card)', border: 'none' }}>
                                <div className="file-card-header">
                                    <div className="file-icon" style={{ background: 'var(--bg-primary)', color: 'var(--blue-brand)' }}>
                                        <FileText size={20} />
                                    </div>
                                    <div className="file-info">
                                        <div className="file-name" style={{ fontWeight: '700' }}>{entry.file.name}</div>
                                        <div className="file-size">{formatBytes(entry.file.size)}</div>
                                    </div>
                                    {!processing && entry.steps.db !== 'done' && (
                                        <button
                                            className="file-remove"
                                            onClick={() => removeFile(entry.id)}
                                            title="Remover"
                                        >✕</button>
                                    )}
                                </div>

                                <Stepper steps={entry.steps} />

                                {entry.error && (
                                    <div className="alert alert-error" style={{ marginTop: 12 }}>
                                        <AlertCircle size={16} />
                                        <span>{entry.error}</span>
                                    </div>
                                )}

                                {entry.result && (
                                    <ExtractedPreview
                                        data={entry.result}
                                        expanded={entry.expanded}
                                        onToggle={() => toggleExpand(entry.id)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Submit bar */}
                    <div className="submit-bar" style={{ boxShadow: 'var(--shadow-card)', border: 'none', background: 'var(--bg-card)' }}>
                        <div className="submit-bar-info" style={{ color: 'var(--text-secondary)' }}>
                            <strong>{files.length}</strong> arquivo{files.length !== 1 ? 's' : ''} na fila
                            {doneCount > 0 && <> · <span className="text-success" style={{ fontWeight: '600' }}>{doneCount} processado{doneCount !== 1 ? 's' : ''}</span></>}
                            {errorCount > 0 && <> · <span className="text-error" style={{ fontWeight: '600' }}>{errorCount} com erro</span></>}
                        </div>
                        <button
                            className="btn-process"
                            onClick={processAll}
                            disabled={processing || pendingCount === 0}
                            style={{
                                background: 'linear-gradient(135deg, var(--blue-brand), var(--blue-mid))',
                                color: 'white',
                                borderRadius: 'var(--radius-md)',
                                padding: '14px 40px'
                            }}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    Enviar {pendingCount > 0 ? `${pendingCount} Arquivo${pendingCount !== 1 ? 's' : ''}` : ''}
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}

            {doneCount > 0 && !processing && (
                <div className="alert alert-success" style={{ marginTop: 24, boxShadow: 'var(--shadow-card)' }}>
                    <CheckCircle size={20} />
                    <span style={{ fontWeight: '500' }}>
                        {doneCount} documento{doneCount !== 1 ? 's' : ''} processado{doneCount !== 1 ? 's' : ''} com sucesso e inserido{doneCount !== 1 ? 's' : ''} no Cloud SQL Foresea.
                    </span>
                </div>
            )}
        </div>
    );
}
