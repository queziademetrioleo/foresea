# Documento de Handover Detalhado: Foresea PDF Intelligence 🌊

Este documento fornece um guia técnico completo sobre a arquitetura, o estado atual e os requisitos pendentes do projeto de extração e monitoramento de relatórios operacionais.

---

## 🏗️ 1. Arquitetura do Sistema

O projeto foi migrado de um protótipo inicial em Python para uma aplicação web moderna utilizando **Next.js (App Router)**, visando maior escalabilidade e facilidade de integração.

### **Fluxo de Dados:**
1.  **Frontend (React/Next.js):** O usuário faz o upload de um PDF (ADA, ADP ou BM).
2.  **API Route (`/api/upload`):** Recebe o arquivo em memória (Buffer) e o envia para o Google Gemini.
3.  **Gemini 2.5 Pro (Multimodal):** A IA analisa o conteúdo visual do PDF (útil para documentos escaneados/OCR) e retorna um JSON estruturado seguindo um prompt rigoroso.
4.  **Camada de Mapeamento (`lib/mappers.ts`):** O JSON da IA é validado e transformado no formato da tabela do Cloud SQL.
5.  **Persistência (Cloud SQL):** Os dados são inseridos ou atualizados (`UPSERT`) no PostgreSQL.
6.  **Visualização:** O Dashboard consome os dados do banco para gerar gráficos via `Chart.js`.

---

## 🛠️ 2. Componentes Técnicos Implementados

### **2.1 Extração Inteligente (`lib/gemini.ts`)**
- **Modelo:** `gemini-2.5-pro` (suporta PDFs densos e multimodais).
- **Prompt (`EXTRACTION_PROMPT`):** Configurado para extrair:
    - Metadados: Número, Data, Sonda, Poço.
    - Cláusulas Contratuais: 101 (Uptime), 102 (Downtime), 104.xA/B/C/D, 105, 107, 2.1.1.
    - Insumos: Diesel (Contratada/Petrobras, níveis de estoque) e Água (Produzida/Consumida).
    - Notas: Observações da Fiscalização e da Contratada.
- **Tratamento de Erros:** Validação de soma de horas (máx 24h) e tratamento de JSON inválido.

### **2.2 Camada de Banco de Dados (`lib/db.ts` & `lib/mappers.ts`)**
- **Pool de Conexão:** Gerenciado via `pg` (node-postgres) com SSL configurado.
- **Tabela Relacional:** `public.uptimeoperacional`.
- **Lógica de Identificador:** Criamos uma chave primária composta (ou slug) baseada em `{poco}-{numero}` para evitar duplicidade de relatórios.

### **2.3 Interface de Usuário (`app/upload` & `app/dashboard`)**
- **Upload Progressivo:** Interface com "steppers" que dão feedback visual em tempo real sobre cada etapa do processo.
- **Preview de Extração:** O usuário pode expandir e revisar os dados que a IA extraiu antes de confirmar a gravação definitiva.
- **Dashboard Executivo:** Focado em Uptime Operacional e Consumo de Diesel, utilizando `lucide-react` para ícones e `chart.js` para gráficos.

---

## 🧹 3. Limpeza e Refatoração Realizada

Para entregar um código limpo ao time técnico, as seguintes ações foram tomadas:
- **Exclusão de Legado:** Removido `streamlit_app.py`, `ingest_csv.py`, `venv/` e scripts de teste (`test-db.js`).
- **Remoção de Mock Data:** Todos os PDFs e CSVs de teste foram deletados para garantir que o banco de produção seja a única fonte de verdade.
- **Padronização:** O estilo foi centralizado no `globals.css` utilizando variáveis CSS (Design Tokens) baseadas na marca Foresea.

---

## 📋 4. Pendências e Próximos Passos (Crítico)

O projeto está funcional, mas requer as seguintes integrações para entrar em operação real:

### **A. Frontend Personalizado & Fluxo de Operação**
- **Ponto de Integração:** O frontend de upload precisa ser "plugado" na operação que já roda internamente. 
- **Ação Necessária:** Verificar o endpoint ou fila (Message Queue) para onde o PDF processado deve ser notificado após a gravação no Cloud SQL.
- **Validação:** Garantir que o sistema interno reconheça os metadados gerados (ID do Poço/Sonda).

### **B. Definição de Métricas (Streamlit / BI)**
- **Reunião de Requisitos:** É necessário sentar com o time de engenharia de petróleo para validar os cálculos de:
    - **Uptime 101 Equivalent:** Qual o peso exato de cada cláusula no faturamento de cada navio-sonda.
    - **Operational Availability:** Fórmulas de disponibilidade baseadas nas horas tarifadas.
- **Visualização:** Decidir se as métricas finais serão exibidas no **Streamlit** (conectando-o diretamente ao Cloud SQL que já está pronto) ou se o Dashboard Next.js absorverá essas visualizações complexas.

### **C. Segurança e Produção**
- **Autenticação:** O sistema atualmente é aberto. É necessário implementar (ex: NextAuth/Clerk) antes de expor os dados operacionais.
- **Logs:** Implementar um sistema de log de auditoria para saber quem subiu qual relatório.

---

## ⚙️ 5. Como rodar o projeto

1.  **Instalar dependências:** `npm install`
2.  **Configurar Env:** Copiar `.env.example` para `.env.local`.
3.  **Banco de Dados:** Certifique-se de que o IP da sua máquina está autorizado no firewall do Cloud SQL ou use o Cloud SQL Proxy.
4.  **Desenvolvimento:** `npm run dev`
