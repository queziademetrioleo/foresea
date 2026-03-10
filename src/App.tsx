import { useState } from 'react';
import {
  UploadCloud,
  FileText,
  BarChart3,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
  Anchor,
  ChevronRight
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

      {/* ========== HEADER ========== */}
      <header className="header">
        <div className="logo-container">
          <img src="/foresea-logo.svg" alt="Foresea" className="header-logo" />
        </div>
        <nav className="header-nav">
          <span className="nav-label active">Uptime Operacional</span>
        </nav>
        <div className="header-actions">
          <div className="avatar">QD</div>
        </div>
      </header>

      {/* ========== HERO ========== */}
      <section className="hero">
        {/* Decorative cyan accent bar at top like Foresea site */}
        <div className="hero-accent-bar"></div>

        <div className="hero-image-wrapper">
          <img src="/hero-platform.png" alt="Plataforma Offshore" className="hero-image" />
          <div className="hero-overlay"></div>
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <Anchor size={16} />
            <span>Powered by Gemini Pro</span>
          </div>
          <h1 className="hero-title">
            Uptime<br />
            <span className="hero-title-accent">Operacional</span>
          </h1>
          <p className="hero-subtitle">
            Análise inteligente de documentos e métricas de embarcações.<br />
            Consolide relatórios operacionais com IA.
          </p>
          <a href="#workspace" className="hero-cta">
            Iniciar Análise
            <ChevronRight size={20} />
          </a>
        </div>

        {/* Foresea-style SVG wave transition */}
        <div className="hero-wave">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,64L48,58.7C96,53,192,43,288,48C384,53,480,75,576,80C672,85,768,75,864,64C960,53,1056,43,1152,42.7C1248,43,1344,53,1392,58.7L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="#F4F7FB" />
          </svg>
        </div>
      </section>

      {/* ========== MAIN CONTENT ========== */}
      <main className="main-content" id="workspace">
        <div className="workspace-card glass-panel">

          {!report ? (
            <>
              <div className="workspace-header">
                <div>
                  <h2 className="card-title">
                    <UploadCloud size={24} className="icon-cyan" />
                    Processamento de Documento
                  </h2>
                  <p className="card-description">
                    Faça o upload dos relatórios operacionais em PDF ou texto para extrair as métricas de uptime com o Gemini Pro e consolidar os dados.
                  </p>
                </div>
              </div>

              <div
                className={`upload-area ${dragActive ? 'dragging' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input
                  type="file"
                  id="file-upload"
                  style={{ display: 'none' }}
                  onChange={handleChange}
                  accept=".pdf,.doc,.docx,.txt"
                />

                {file ? (
                  <div className="upload-file-display">
                    <div className="upload-file-icon">
                      <FileText size={40} />
                    </div>
                    <p className="upload-text">{file.name}</p>
                    <p className="upload-hint">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <>
                    <div className="upload-icon">
                      <UploadCloud size={36} />
                    </div>
                    <p className="upload-text">Arraste e solte o documento aqui</p>
                    <p className="upload-hint">ou clique para procurar em seus arquivos (PDF, DOCX, TXT)</p>
                  </>
                )}
              </div>

              <div className="workspace-actions">
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
                      Processando com IA...
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
            /* ===== REPORT VIEW ===== */
            <div className="report-container">
              <div className="report-header">
                <div className="report-header-top">
                  <h2 className="card-title" style={{ marginBottom: 0 }}>
                    <CheckCircle2 size={24} className="icon-green" />
                    Análise Concluída
                  </h2>
                  <span className="badge-success">Sucesso</span>
                </div>
                <div className="report-meta">
                  <span>Documento: <strong>{report.documentId}</strong> ({file?.name})</span>
                  <span>Processado em: {report.processedAt}</span>
                </div>
              </div>

              {/* Big Uptime KPI */}
              <div className="kpi-hero">
                <p className="kpi-label">Uptime Geral Identificado</p>
                <h3 className="kpi-value">{report.overallUptime}</h3>
                <p className="kpi-vessel">Ativo: {report.vessel}</p>
              </div>

              {/* Metrics Grid */}
              <h4 className="section-title">Métricas Extraídas</h4>
              <div className="metric-grid">
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

              {/* Insights */}
              <div className="report-section">
                <h4>Insights do Gemini Pro</h4>
                <ul className="insights-list">
                  {report.insights.map((insight, idx) => (
                    <li key={idx}>{insight}</li>
                  ))}
                </ul>
              </div>

              <div className="workspace-actions">
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
      </main>

      {/* ========== FOOTER ========== */}
      <footer className="footer">
        <img src="/foresea-logo.svg" alt="Foresea" className="footer-logo" />
        <p>© 2026 Foresea · Perfuração Offshore · Uptime Operacional POC</p>
      </footer>
    </div>
  );
}

export default App;
