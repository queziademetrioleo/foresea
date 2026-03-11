# 🧮 Detalhamento dos Cálculos - Foresea Dashboard

Este documento detalha as fórmulas e a lógica de processamento de dados utilizadas no dashboard Streamlit (`streamlit_app.py`).

---

## 1. Métricas Principais (KPI Cards)

Os indicadores que aparecem no topo do dashboard são calculados logo após a aplicação dos filtros de Sonda, Poço e Data.

### 1.1. Uptime Contratual Mapeado (%)
Reflete a eficiência de operação pura (Cláusula 101) em relação ao tempo total disponível.
- **Fórmula:** `(Soma da Cláusula 101 / (Total de Registros * 24)) * 100`
- **Variáveis:**
  - `Total de Registros`: Quantidade de dias (relatórios ADA) processados.
  - `24`: Horas totais por dia.

### 1.2. Consumo Total de Diesel (m³)
Soma do óleo diesel consumido por ambas as operadoras.
- **Fórmula:** `Soma(diesel_consumido_contratada) + Soma(diesel_consumido_petrobras)`

### 1.3. Consumo de Água (m³)
Soma total da água consumida no período.
- **Fórmula:** `Soma(agua_consumida)`

### 1.4. Dias com Downtime
Contagem simples de quantos dias tiveram ocorrência de falha ou reparo penalizado.
- **Lógica:** Contar registros onde `clausula_102 > 0`.

---

## 2. Aba: 📊 Uptime & Eficiência

### 2.1. Gráfico de Pizza (Distribuição de Horas)
Mostra a proporção entre tempo operando e tempo parado por falha.
- **Operação (101):** `Soma(clausula_101)`
- **Downtime (102):** `Soma(clausula_102)`

### 2.2. Evolução Diária (Barras Empilhadas)
Mostra o uso das 24 horas de cada dia.
- **Eixo Y:** `clausula_101` (Verde) e `clausula_102` (Vermelho).
- **Arredondamento:** Os valores são arredondados para 1 casa decimal para exibição no gráfico.

---

## 3. Aba: 📉 Insumos (Diesel/Água)

### 3.1. Bunker & Inventário Operacional (Área)
Acompanhamento do estoque a bordo por dia.
- **Dados:** `oleo_diesel_atual` e `agua_atual`.

### 3.2. Impacto de Diesel Diário (Barras)
Comparação do consumo diário.
- **Dados:** `diesel_consumido_contratada` vs `diesel_consumido_petrobras`.

---

## 4. Aba: 🚨 Compliance (Penalidades)

### 4.1. Frequência de Reduções
Calcula o impacto de cada cláusula de redução contratual.
- **Dias Afetados:** `Count(clausula_x > 0)`
- **Horas Perdidas:** `Soma(clausula_x)`

---

## 5. Aba: 💼 Relatório Executivo (O Coração do Dashboard)

Esta aba utiliza pesos contratuais para converter horas reais em "Horas Equivalentes" (indicador financeiro).

### 5.1. Pesos Contratuais (Tarifas Config)
| Rótulo | Cláusulas Database | Peso (Multiplier) |
| :--- | :--- | :--- |
| **101 Operating Hours** | `clausula_101` | **1.0** (100%) |
| **105 Moving** | `clausula_105` | **0.9** (90%) |
| **104.1.a Stand-by Weather** | `clausula_107` | **0.9** (90%) |
| **104.1.b Stand-by Petrobras** | `clausula_104_1a, 1c, 1d` | **0.9** (90%) |
| **102 Repair/211+** | `clausula_102` | **0.0** (0%) |

### 5.2. Operational Availability (%)
Média percentual de todas as horas em que a sonda estava disponível para faturamento (qualquer peso > 0).
- **Cálculo:** `(Horas Operacionais / (Dias * 24)) * 100`

### 5.3. Uptime 101 Equivalent (%)
Este é o indicador de receita total.
- **Cálculo:** `(Horas Equivalentes / (Dias * 24)) * 100`
- **Onde:** `Horas Equivalentes = Soma(Horas_Cláusula * Peso_Cláusula)`

### 5.4. Foresea Avg (Média da Frota)
Média aritmética simples dos resultados individuais de cada sonda filtrada.
- **Exemplo:** `(Sonda_A_UptimeEq + Sonda_B_UptimeEq) / 2`

---

## 6. Origem dos Dados
Todos os valores numéricos são extraídos via **IA (Gemini 2.5 Pro)** a partir de arquivos PDF (ADA) e salvos no banco de dados **PostgreSQL** (Google Cloud SQL).
- **Tabela:** `public.uptimeoperacional`
