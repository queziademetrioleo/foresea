import { useState } from 'react';
import {
  UploadCloud,
  FileText,
  BarChart3,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity
} from 'lucide-react';
import './index.css';

// Mock report data for the POC
const mockReport = {
  documentId: "DOC-2024-00129",
  processedAt: new Date().toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  vessel: "Sonda Norbe VIII",
  overallUptime: "99.2%",
  metrics: [
    { label: "Tempo Operacional", value: "714h", icon: <Clock size={20} /> },
    { label: "Paradas Programadas", value: "4h", icon: <Settings size={20} /> },
    { label: "Eventos Não Programados", value: "2", icon: <AlertTriangle size={20} /> },
    { label: "Disponibilidade", value: "Alta", icon: <Activity size={20} /> },
  ],
  insights: [
    "A embarcação manteve um desempenho superior à meta de 98% de uptime no período analisado.",
    "Foram identificadas 2 ocorrências de manutenção corretiva de baixa gravidade, prontamente tratadas.",
    "Recomenda-se revisão preventiva no módulo de perfuração principal na próxima janela de manutenção."
  ]
};

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState<typeof mockReport | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const simulateProcessing = () => {
    if (!file) return;
    setIsProcessing(true);

    // Simulate API call to Gemini Pro / Backend
    setTimeout(() => {
      setIsProcessing(false);
      setReport(mockReport);
    }, 2500);
  };

  const resetForm = () => {
    setFile(null);
    setReport(null);
  };

  return (
    <div className="layout-container">
      {/* Header */}
      <header className="header" style={{ position: 'relative', zIndex: 100, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
        <div className="logo-container">
          <img src="/foresea-logo.svg" alt="Foresea" style={{ height: '55px' }} />
        </div>
        <div className="header-actions">
          <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            <Settings size={18} />
            Ajustes
          </button>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            QO
          </div>
        </div>
      </header>

      {/* Hero Banner Section */}
      <div style={{
        height: '40vh',
        minHeight: '300px',
        maxHeight: '400px',
        width: '100%',
        position: 'relative',
        background: 'linear-gradient(90deg, var(--color-cyan) 0%, var(--color-green) 100%)',
        backgroundImage: 'url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")', // Stock image representing offshore/drilling/machinery
        backgroundSize: 'cover',
        backgroundPosition: 'center 40%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'inset 0 0 0 1000px rgba(25, 27, 69, 0.6)' // Navy overlay
      }}>

        {/* Curvilinear Cutout Effect mimicking the Foresea website */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          overflow: 'hidden',
          lineHeight: 0,
          transform: 'rotate(180deg)'
        }}>
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ position: 'relative', display: 'block', width: 'calc(100% + 1.3px)', height: '60px' }}>
            <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" fill="#F4F7FB"></path>
          </svg>
        </div>

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 10, padding: '0 2rem' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-1px', color: 'white', marginBottom: '1rem', textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
            Uptime Operacional
          </h1>
          <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', color: 'rgba(255, 255, 255, 0.9)', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            Análise Inteligente e Consolidação de Métricas extraídas de relatórios de embarcações.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content" style={{ marginTop: '-40px', position: 'relative', zIndex: 20 }}>

        <div className="dashboard-grid">

          {/* Main Workspace Column */}
          <div className="glass-panel" style={{ padding: '2rem' }}>

            {!report ? (
              <>
                <h2 className="card-title">
                  <UploadCloud size={24} style={{ color: 'var(--color-cyan)' }} />
                  Processamento de Documento
                </h2>
                <p style={{ color: 'var(--color-gray-500)', marginBottom: '1.5rem' }}>
                  Faça o upload dos relatórios operacionais em PDF ou texto para extrair as métricas de uptime com o Gemini Pro e consolidar os dados.
                </p>

                <div
                  className={`upload-area ${dragActive ? 'dragging' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload')?.click()}
                  style={{ padding: '5rem 2rem', minHeight: '300px' }}
                >
                  <input
                    type="file"
                    id="file-upload"
                    style={{ display: 'none' }}
                    onChange={handleChange}
                    accept=".pdf,.doc,.docx,.txt"
                  />

                  {file ? (
                    <>
                      <FileText size={48} style={{ color: 'var(--color-green)', marginBottom: '1rem' }} />
                      <p className="upload-text">{file.name}</p>
                      <p className="upload-hint">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </>
                  ) : (
                    <>
                      <div className="upload-icon">
                        <UploadCloud size={32} />
                      </div>
                      <p className="upload-text">Arraste e solte o documento aqui</p>
                      <p className="upload-hint">ou clique para procurar em seus arquivos (PDF, DOCX, TXT)</p>
                    </>
                  )}
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  {file && (
                    <button className="btn-secondary" onClick={() => setFile(null)} disabled={isProcessing}>
                      Cancelar
                    </button>
                  )}
                  <button
                    className="btn-primary"
                    onClick={simulateProcessing}
                    disabled={!file || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="loader" />
                        Aguarde, processando com IA...
                      </>
                    ) : (
                      <>
                        <BarChart3 size={20} />
                        Analisar Documento
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              // Report View
              <div className="report-container">
                <div className="report-header">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 className="card-title" style={{ marginBottom: 0 }}>
                      <CheckCircle2 size={24} style={{ color: 'var(--color-green)' }} />
                      Análise Concluída
                    </h2>
                    <span style={{ backgroundColor: 'rgba(33, 205, 142, 0.1)', color: 'var(--color-green)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 600 }}>
                      Sucesso
                    </span>
                  </div>
                  <div className="report-meta">
                    <span>Documento: <strong>{report.documentId}</strong> ({file?.name})</span>
                    <span>Processado em: {report.processedAt}</span>
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--color-navy)',
                    color: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    marginBottom: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center'
                  }}
                >
                  <p style={{ color: 'var(--color-cyan)', fontWeight: 600, marginBottom: '0.5rem', fontSize: '1.1rem' }}>Uptime Geral Identificado</p>
                  <h3 style={{ fontSize: '3rem', margin: 0, fontWeight: 800 }}>{report.overallUptime}</h3>
                  <p style={{ color: 'var(--color-gray-300)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Ativo: {report.vessel}</p>
                </div>

                <h4 style={{ color: 'var(--color-navy)', marginBottom: '1rem', fontSize: '1.1rem' }}>Métricas Extraídas</h4>
                <div className="metric-grid" style={{ marginBottom: '2rem' }}>
                  {report.metrics.map((m, idx) => (
                    <div className="metric-card" key={idx}>
                      <div className="metric-icon">{m.icon}</div>
                      <div className="metric-info">
                        <h5>{m.label}</h5>
                        <p>{m.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="report-section">
                  <h4>Insights do Gemini Pro</h4>
                  <ul style={{ paddingLeft: '1.5rem', color: 'var(--color-gray-700)' }}>
                    {report.insights.map((insight, idx) => (
                      <li key={idx} style={{ marginBottom: '0.5rem', lineHeight: '1.5' }}>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                  <button className="btn-secondary" onClick={resetForm}>
                    Nova Análise
                  </button>
                  <button className="btn-primary">
                    <UploadCloud size={20} />
                    Sincronizar com BigQuery
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Area - Removed per request */}

        </div>
      </main>
    </div>
  );
}

export default App;
