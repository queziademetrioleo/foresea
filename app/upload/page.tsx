'use client';

import { useState, useCallback, useRef } from 'react';
import { FileText, Upload as UploadIcon, CheckCircle, AlertCircle, Loader2, ListTodo, BrainCircuit, Database, Lock } from 'lucide-react';

/* ─── Types ─────────────────────────────────────── */
type DocType = 'ADA' | 'ADP' | 'BM';

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

/* ─── Document Types Config ─────────────────────── */
const DOC_TYPES: { key: DocType; label: string; fullName: string; available: boolean }[] = [
    { key: 'ADA', label: 'ADA', fullName: 'Atestado Diário de Afretamento', available: false },
    { key: 'ADP', label: 'ADP', fullName: 'Atestado Diário de Perfuração', available: true },
    { key: 'BM',  label: 'BM',  fullName: 'Boletim de Medição', available: false },
];

/* ─── Helpers ───────────────────────────────────── */
function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─── Stepper Component ─────────────────────────── */
function StepDot({ status, label, icon }: { status: string; label: string; icon: React.ReactNode }) {
    const cls = ['step', status !== 'idle' ? status : ''].filter(Boolean).join(' ');
    const inner =
        status === 'done' ? <CheckCircle size={11} /> :
        status === 'error' ? <AlertCircle size={11} /> :
        status === 'active' ? <Loader2 size={11} className="animate-spin" style={{ animation: 'spin 0.8s linear infinite' }} /> :
        '○';

    return (
        <div className={cls}>
            <div className="step-dot">{inner}</div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{icon} {label}</span>
        </div>
    );
}

function Stepper({ steps }: { steps: StepStatus }) {
    return (
        <div className="stepper">
            <StepDot status={steps.upload} label="Upload" icon={<ListTodo size={13} />} />
            <div className="step-connector" />
            <StepDot status={steps.gemini} label="Gemini AI" icon={<BrainCircuit size={13} />} />
            <div className="step-connector" />
            <StepDot status={steps.db} label="Cloud SQL" icon={<Database size={13} />} />
        </div>
    );
}

/* ─── Extracted Preview Component ───────────────── */
function ExtractedPreview({ data, expanded, onToggle }: {
    data: Record<string, unknown>;
    expanded: boolean;
    onToggle: () => void;
}) {
    const d = data as {
        tipo_documento?: string; numero?: number; data?: string;
        sonda?: string; poco?: string;
        clausulas?: Record<string, number | string>;
        diesel_consumido?: Record<string, number>;
        oleo_diesel?: Record<string, number>;
        agua?: Record<string, number>;
        observacoes?: Record<string, string>;
    };

    const clausulas = d.clausulas ?? {};
    const clausulaKeys = ['101', '102', '104.1A', '104.1B', '104.1C', '104.1D', '104.2', '105', '107', '2.1.1'];

    return (
        <div className="extracted-preview">
            <div className="extracted-header" onClick={onToggle}>
                <h4><CheckCircle size={15} /> Dados extraídos pelo Gemini AI</h4>
                <span className="extracted-toggle">{expanded ? 'Ocultar ▲' : 'Ver Detalhes ▼'}</span>
            </div>
            {expanded && (
                <div className="extracted-body">
                    <div className="extracted-grid">
                        <div className="extracted-item">
                            <span className="extracted-label">Tipo</span>
                            <span className="extracted-value" style={{ color: 'var(--blue-sky)' }}>{d.tipo_documento ?? '—'}</span>
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
                            const val = clausulas[key];
                            const num = typeof val === 'number' ? val : null;
                            return (
                                <div key={key} className="clause-pill">
                                    <div className="clause-pill-label">{key}</div>
                                    <div className={`clause-pill-value ${num && num > 0 ? 'nonzero' : ''}`}>
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
                </div>
            )}
        </div>
    );
}

/* ─── Main Page ─────────────────────────────────── */
export default function UploadPage() {
    const [selectedDoc, setSelectedDoc] = useState<DocType>('ADP');
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

    const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));
    const toggleExpand = (id: string) => setFiles((prev) => prev.map((f) => f.id === id ? { ...f, expanded: !f.expanded } : f));

    const setStep = (id: string, step: keyof StepStatus, status: StepStatus[keyof StepStatus]) =>
        setFiles((prev) => prev.map((f) => f.id === id ? { ...f, steps: { ...f.steps, [step]: status } } : f));

    const setResult = (id: string, result: Record<string, unknown>) =>
        setFiles((prev) => prev.map((f) => f.id === id ? { ...f, result, expanded: true } : f));

    const setError = (id: string, error: string) =>
        setFiles((prev) => prev.map((f) => f.id === id ? { ...f, error } : f));

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
                setStep(entry.id, errMsg.includes('banco') ? 'db' : 'gemini', 'error');
                if (errMsg.includes('banco')) setStep(entry.id, 'gemini', 'done');
                setError(entry.id, errMsg);
                return;
            }
            setStep(entry.id, 'gemini', 'done');
            setStep(entry.id, 'db', 'active');
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
        for (const entry of pending) await processFile(entry);
        setProcessing(false);
    };

    const pendingCount = files.filter((f) => f.steps.db !== 'done' && !f.error).length;
    const doneCount = files.filter((f) => f.steps.db === 'done').length;
    const errorCount = files.filter((f) => !!f.error).length;

    return (
        <>
            {/* Hero Header */}
            <div className="hero-section">
                <img
                    src="/foresea-logo.png"
                    alt="Foresea"
                    className="hero-logo"
                />
                <h1 className="hero-title">
                    Uptime <span>Operacional</span>
                </h1>
                <p className="hero-subtitle">
                    Envie seus relatórios diários de sonda e deixe nossa IA extrair, validar e registrar os dados automaticamente no Cloud SQL.
                </p>
            </div>

            {/* Content Card */}
            <div className="doc-selector-section">
                <div className="doc-selector-card">

                    {/* Step 1: Document Type Selection */}
                    <div className="doc-selector-title">01 — Selecione o tipo de relatório</div>
                    <div className="doc-types-grid">
                        {DOC_TYPES.map((dt) => (
                            <button
                                key={dt.key}
                                className={[
                                    'doc-type-btn',
                                    !dt.available ? 'disabled' : '',
                                    selectedDoc === dt.key && dt.available ? 'active' : '',
                                ].filter(Boolean).join(' ')}
                                onClick={() => dt.available && setSelectedDoc(dt.key)}
                                disabled={!dt.available}
                                aria-label={`Selecionar ${dt.label}`}
                            >
                                {dt.available && <span className="doc-type-badge">Disponível</span>}
                                {!dt.available && <span className="doc-type-lock"><Lock size={12} /></span>}
                                <div className="doc-type-icon">{dt.key}</div>
                                <div className="doc-type-label">{dt.label}</div>
                                <div className="doc-type-desc">{dt.fullName}</div>
                            </button>
                        ))}
                    </div>

                    <div className="section-divider" />

                    {/* Step 2: Upload Area */}
                    <div className="doc-selector-title">02 — Envie o arquivo PDF ({selectedDoc})</div>
                    <div
                        className={`upload-area ${dragOver ? 'drag-over' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                    >
                        <div className="upload-area-icon">
                            <UploadIcon size={28} />
                        </div>
                        <div className="upload-area-title">Arraste o PDF aqui</div>
                        <div className="upload-area-sub">
                            Suporta múltiplos arquivos · Relatório tipo <strong>{selectedDoc}</strong>
                        </div>
                        <button
                            className="btn-select"
                            type="button"
                            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                        >
                            <UploadIcon size={16} />
                            Selecionar Arquivos
                        </button>
                        <div className="upload-hint">
                            <span>📋</span> PDF digitalizado ou escaneado — Gemini 2.5 Pro processa ambos
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
                            <div className="file-list" style={{ marginTop: 28 }}>
                                {files.map((entry) => (
                                    <div key={entry.id} className="file-card">
                                        <div className="file-card-header">
                                            <div className="file-icon">
                                                <FileText size={20} />
                                            </div>
                                            <div className="file-info">
                                                <div className="file-name">{entry.file.name}</div>
                                                <div className="file-size">{formatBytes(entry.file.size)}</div>
                                            </div>
                                            {!processing && entry.steps.db !== 'done' && (
                                                <button className="file-remove" onClick={() => removeFile(entry.id)} title="Remover">✕</button>
                                            )}
                                        </div>

                                        <Stepper steps={entry.steps} />

                                        {entry.error && (
                                            <div className="alert alert-error">
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

                            {/* Submit Bar */}
                            <div className="submit-bar">
                                <div className="submit-bar-info">
                                    <strong>{files.length}</strong> arquivo{files.length !== 1 ? 's' : ''} na fila
                                    {doneCount > 0 && <> · <span className="text-success" style={{ fontWeight: 600 }}>{doneCount} processado{doneCount !== 1 ? 's' : ''}</span></>}
                                    {errorCount > 0 && <> · <span className="text-error" style={{ fontWeight: 600 }}>{errorCount} com erro</span></>}
                                </div>
                                <button
                                    className="btn-process"
                                    onClick={processAll}
                                    disabled={processing || pendingCount === 0}
                                >
                                    {processing ? (
                                        <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Processando...</>
                                    ) : (
                                        <>Processar {pendingCount > 0 ? `${pendingCount} Arquivo${pendingCount !== 1 ? 's' : ''}` : ''}</>
                                    )}
                                </button>
                            </div>

                            {doneCount > 0 && !processing && (
                                <div className="alert alert-success" style={{ marginTop: 16 }}>
                                    <CheckCircle size={20} />
                                    <span>
                                        <strong>{doneCount} documento{doneCount !== 1 ? 's' : ''}</strong> processado{doneCount !== 1 ? 's' : ''} com sucesso e registrado{doneCount !== 1 ? 's' : ''} no Cloud SQL Foresea.
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
