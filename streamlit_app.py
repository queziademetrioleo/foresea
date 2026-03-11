import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from sqlalchemy import create_engine
import io
try:
    from fpdf import FPDF
    from fpdf.enums import XPos, YPos
except ImportError:
    st.error("Biblioteca 'fpdf2' não encontrada. Por favor, execute: pip install fpdf2")
    st.stop()

st.set_page_config(
    page_title="Foresea Insights",
    page_icon="🌊",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Estilos adicionais leves (o grosso foi pro config.toml)
st.markdown("""
    <style>
    /* Suavizar a sombra dos containers do widget Metric nativo e dar bordas */
    [data-testid="stMetricValue"] {
        font-size: 3.5rem !important;
        font-weight: 800 !important;
        letter-spacing: -1px;
    }
    [data-testid="stMetricLabel"] {
        font-size: 1.1rem !important;
        opacity: 0.8;
    }
    hr {
        margin-top: 2rem;
        margin-bottom: 2rem;
        border: 0;
        height: 1px;
        background: #E2E8F0;
    }
    .main-title {
        font-size: 48px;
        font-weight: 900;
        margin-bottom: 0px;
        letter-spacing: -1px;
    }
    .sub-title {
        font-size: 18px;
        opacity: 0.7;
        margin-top: -10px;
        margin-bottom: 30px;
    }
    /* Degradê na Barra Lateral - Azul Ultra Dominante */
    [data-testid="stSidebar"] {
        background-image: linear-gradient(180deg, 
            #1A1D56 0%, 
            #1A1D56 85%, 
            #1DD693 96%, 
            #10C1FF 100%) !important;
    }
    /* Garantir legibilidade dos textos na sidebar (Branco sobre Azul) */
    [data-testid="stSidebar"] .stMarkdown, [data-testid="stSidebar"] p, [data-testid="stSidebar"] h3, [data-testid="stSidebar"] label {
        color: #FFFFFF !important;
    }
    </style>
""", unsafe_allow_html=True)

@st.cache_resource
def init_connection():
    db_url = "postgresql://postgres:93543559@35.192.175.9:5432/postgres"
    engine = create_engine(db_url, connect_args={'sslmode': 'disable', 'connect_timeout': 10})
    return engine

@st.cache_data(ttl=60)
def get_data():
    engine = init_connection()
    query = "SELECT * FROM public.uptimeoperacional ORDER BY data_registro ASC"
    df = pd.read_sql(query, engine)
    df['data_registro'] = pd.to_datetime(df['data_registro']).dt.date
    return df

try:
    df = get_data()
except Exception as e:
    st.error(f"Erro ao conectar ao Banco de Dados Foresea Cloud: {e}")
    st.stop()

if df.empty:
    st.warning("Aguardando inserção de dados via Gemini (Upload)...")
    st.stop()


# ----- SIDEBAR / FILTROS -----
with st.sidebar:
    st.image("public/foresea-logo.png", width=180)
    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown("### 📊 Operações de Sondas")
    st.write("Selecione os parâmetros de extração para o dashboard:")
    
    sondas_unicas = df['sonda'].dropna().unique().tolist()
    pocos_unicos = df['poco'].dropna().unique().tolist()

    selected_sonda = st.multiselect("Navio-Sonda", options=sondas_unicas, default=sondas_unicas)
    selected_poco = st.multiselect("Poço / Localização", options=pocos_unicos, default=pocos_unicos)

    min_date = df['data_registro'].min()
    max_date = df['data_registro'].max()
    selected_dates = st.date_input("Período de Refência (Mensal)", [min_date, max_date], min_value=min_date, max_value=max_date)

    st.markdown("---")
    st.caption("Powered by Gemini 2.5 Pro Multimodal")

# ----- APLICANDO FILTROS -----
mask = (df['sonda'].isin(selected_sonda)) & (df['poco'].isin(selected_poco))
if len(selected_dates) == 2:
    start_dt, end_dt = selected_dates
    mask = mask & (df['data_registro'] >= start_dt) & (df['data_registro'] <= end_dt)
filtered_df = df[mask]

# ----- DEFINIÇÃO DE COLUNAS DE CLÁUSULAS (Global) -----
cols_nao_clausula = [
    'identificador', 'data_registro', 'sonda', 'poco', 'nome_arquivo', 'numero', 'tipo',
    'oleo_diesel_atual', 'diesel_consumido_contratada', 'diesel_consumido_petrobras',
    'agua_atual', 'agua_consumida', 'observacoes_fiscalizacao', 'observacoes_contratada'
]
all_clausula_cols = [
    c for c in filtered_df.columns
    if c not in cols_nao_clausula and pd.api.types.is_numeric_dtype(filtered_df[c])
]
excluir_numerador = {'clausula_102', 'clausula_2_1_1'}
cols_numerador = [c for c in all_clausula_cols if c not in excluir_numerador]

# (Métricos de topo foram removidos)

# ----- PROCESSAMENTO PARA RELATÓRIOS (PDF/Dashboard) -----
# 1. Compliance
clausulas_nomes = {
    'clausula_102': '102 - Manutenção / Reparo',
    'clausula_104_1a': '104.1A - Falha de Equipamento PB',
    'clausula_104_1b': '104.1B - Substituição de Pessoal',
    'clausula_104_1c': '104.1C - Manutenção Planejada PB',
    'clausula_104_1d': '104.1D - Outras Interrupções PB',
    'clausula_104_2': '104.2 - Força Maior',
    'clausula_105': '105 - Segurança / Acidente',
    'clausula_107': '107 - Condições Meteorológicas'
}
contagem = []
for col, nome_legivel in clausulas_nomes.items():
    if col in filtered_df.columns:
        qtd_dias = int((filtered_df[col] > 0).sum())
        horas_perdidas = float(filtered_df[col].sum())
        if qtd_dias > 0 or horas_perdidas > 0:
            contagem.append({'Cláusula': nome_legivel, 'Dias Afetados': qtd_dias, 'Horas Perdidas': round(horas_perdidas, 1)})

obs_df = filtered_df[['data_registro', 'sonda', 'poco', 'observacoes_fiscalizacao', 'observacoes_contratada']].copy()
obs_df = obs_df[
    (obs_df['observacoes_fiscalizacao'].str.strip() != '') | 
    (obs_df['observacoes_contratada'].str.strip() != '')
].fillna('')

# 2. Executivo (Uptime)
mean_availability = 0.0
mean_uptime_eq = 0.0
df_executivo = pd.DataFrame()
dados_sonda = []
composicao_horas = []
tarifas_config = [
    {"label": "101 Operating Hours", "peso": 1.0, "cols": ["clausula_101"]},
    {"label": "105 Moving", "peso": 0.9, "cols": ["clausula_105"]},
    {"label": "104.1.a Stand-by Weather", "peso": 0.9, "cols": ["clausula_107"]},
    {"label": "104.1.b Stand-by Petrobras", "peso": 0.9, "cols": ["clausula_104_1a", "clausula_104_1b", "clausula_104_1c", "clausula_104_1d", "clausula_104_2", "clausula_104_2b", "clausula_104_2c"]},
    {"label": "104.1.b Docagem Remunerada", "peso": 0.9, "cols": []},
    {"label": "102 Repair, 211, 214 or 215 Rate", "peso": 0.0, "cols": ["clausula_102", "clausula_2_1_1"]},
    {"label": "222 Reduced Rate / Bonus", "peso": 0.0, "cols": ["outras_clausulas"]}
]

if not filtered_df.empty:
    sondas_ativas = filtered_df['sonda'].dropna().unique().tolist()
    availability_avg_sum = 0
    uptime_eq_avg_sum = 0
    for sonda in sondas_ativas:
        df_sonda = filtered_df[filtered_df['sonda'] == sonda]
        
        # Denominador: Soma de TODAS as cláusulas reportadas
        total_horas_clausulas = df_sonda[all_clausula_cols].sum().sum()
        if total_horas_clausulas == 0:
            total_horas_clausulas = 1.0  # Evitar divisão por zero
            
        horas_operacionais = 0
        horas_equivalentes = 0
        for tarifa in tarifas_config:
            soma_tarifa = 0
            for col in tarifa["cols"]:
                if col in df_sonda.columns:
                    soma_horas = df_sonda[col].fillna(0).sum()
                    soma_tarifa += soma_horas
            
            # Numerador Availability: Soma das cláusulas com peso > 0
            if tarifa["peso"] > 0:
                horas_operacionais += soma_tarifa
                
            # Numerador Uptime Eq: Soma das cláusulas multiplicadas pelo peso
            horas_eq_parcial = soma_tarifa * tarifa["peso"]
            horas_equivalentes += horas_eq_parcial
            
            if horas_eq_parcial > 0:
                 composicao_horas.append({
                     "Sonda": sonda,
                     "Categoria": f"{tarifa['label']} ({int(tarifa['peso']*100)}%)",
                     "Horas Faturadas (Eq)": horas_eq_parcial
                 })
        # Cálculos originais (comentados para manter a lógica caso deseje retornar)
        # perc_availability = (horas_operacionais / total_horas_clausulas * 100)
        # perc_uptime_eq = (horas_equivalentes / total_horas_clausulas * 100)
        
        # Valores MOCADOS conforme solicitação do usuário
        perc_availability = 94.7
        perc_uptime_eq = 92.5
        
        dados_sonda.append({"Sonda": sonda, "Operational Availability": perc_availability, "Uptime 101 Equivalent": perc_uptime_eq})
        availability_avg_sum += perc_availability
        uptime_eq_avg_sum += perc_uptime_eq
    count_sondas = len(sondas_ativas)
    mean_availability = 94.7 # availability_avg_sum / count_sondas if count_sondas > 0 else 0
    mean_uptime_eq = 92.5   # uptime_eq_avg_sum / count_sondas if count_sondas > 0 else 0
    linhas_dados = []
    for tarifa in tarifas_config:
        linha_atual = {"Current Month (hours)": f"{tarifa['label']} ({int(tarifa['peso']*100)}%)"}
        soma_total_foresea = 0
        for sonda in sondas_ativas:
            df_sonda = filtered_df[filtered_df['sonda'] == sonda]
            soma_horas = 0
            for col in tarifa["cols"]:
                if col in df_sonda.columns:
                    soma_horas += df_sonda[col].fillna(0).sum()
            linha_atual[sonda] = soma_horas
            soma_total_foresea += soma_horas
        linha_atual["Foresea Avg"] = soma_total_foresea / count_sondas if count_sondas > 0 else 0
        linhas_dados.append(linha_atual)
    linha_availability = {"Current Month (hours)": "Operational Availability"}
    linha_uptime_eq = {"Current Month (hours)": "Uptime 101 Equivalent"}
    linha_days = {"Current Month (hours)": "Total days included"}
    linha_range = {"Current Month (hours)": "Data range"}
    start_dt_str = min_date.strftime("%b %d")
    end_dt_str = max_date.strftime("%b %d")
    for ds in dados_sonda:
        sn = ds["Sonda"]
        linha_availability[sn] = ds["Operational Availability"]
        linha_uptime_eq[sn] = ds["Uptime 101 Equivalent"]
        linha_days[sn] = str(len(filtered_df[filtered_df['sonda'] == sn]['data_registro'].unique()))
        linha_range[sn] = f"{start_dt_str} to {end_dt_str}"
    linha_availability["Foresea Avg"] = mean_availability
    linha_uptime_eq["Foresea Avg"] = mean_uptime_eq
    linhas_dados.extend([linha_availability, linha_uptime_eq, linha_days, linha_range])
    df_executivo = pd.DataFrame(linhas_dados)

# 3. Visão Diária (Consolidado para PDF)
df_diario_consolidado = pd.DataFrame()
if not filtered_df.empty:
    lista_diario = []
    nomes_sonda = {'SS-81': 'Norbe VI', 'NS-32': 'Norbe VIII', 'NS-33': 'Norbe IX', 'NS-41': 'ODN I', 'NS-42': 'ODN II'}
    for sonda in sorted(filtered_df['sonda'].dropna().unique().tolist()):
        df_s = filtered_df[filtered_df['sonda'] == sonda].copy()
        cols_p = [c for c in all_clausula_cols if c in df_s.columns]
        df_day = df_s.groupby('data_registro')[cols_p].sum().reset_index()
        df_day['Total'] = df_day[cols_p].sum(axis=1)
        cols_n = [c for c in cols_numerador if c in df_day.columns]
        df_day['Util'] = df_day[cols_n].sum(axis=1) if cols_n else 0
        df_day['Eficiência (%)'] = df_day.apply(lambda r: round((r['Util']/r['Total'])*100, 1) if r['Total']>0 else 0.0, axis=1)
        for _, r in df_day.iterrows():
            lista_diario.append({'Sonda': nomes_sonda.get(sonda, sonda), 'Data': r['data_registro'], 'Eficiência (%)': r['Eficiência (%)']})
    df_diario_consolidado = pd.DataFrame(lista_diario)

# ----- TABS PARA NAVEGAÇÃO CLEAN -----
tab4, tab6, tab3, tab2, tab5 = st.tabs(["💼 Relatório Executivo", "📅 Visão Diária de Sondas", "🚨 Compliance (Penalidades)", "📉 Insumos (Diesel/Água)", "🗄️ Raw Data (SQL View)"])

# ----- HELPER PARA PDF -----
def generate_pdf_report(title, content_list, orientation='P'):
    pdf = FPDF(orientation=orientation)
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page(orientation=orientation)
    
    # Fontes Unicode para suportar acentos
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='C')
    pdf.set_font("Helvetica", size=10)
    pdf.cell(0, 10, f"Gerado em: {pd.Timestamp.now().strftime('%d/%m/%Y %H:%M')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='C')
    pdf.ln(5)

    for item in content_list:
        if item['type'] == 'text':
            pdf.set_font("Helvetica", "B", 12)
            pdf.cell(0, 10, item['content'], new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.ln(2)
        elif item['type'] == 'metric':
            pdf.set_font("Helvetica", size=11)
            pdf.cell(0, 8, f"{item['label']}: {item['value']}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.ln(2)
        elif item['type'] == 'table':
            pdf.ln(5)
            df_to_print = item['df'].copy()
            # Converter tudo para string para o PDF
            df_to_print = df_to_print.astype(str)
            
            # Ajustar tamanho da fonte conforme número de colunas
            num_cols = len(df_to_print.columns)
            font_size = 8 if num_cols < 6 else (6 if num_cols < 12 else 4)
            pdf.set_font("Helvetica", size=font_size)
            
            # Criar tabela com larguras automáticas
            with pdf.table(borders_layout="SINGLE_TOP_LINE", cell_fill_color=(240, 240, 240), cell_fill_mode="ROWS", line_height=font_size*1.2) as table:
                header = table.row()
                for col in df_to_print.columns:
                    header.cell(col)
                for _, row in df_to_print.iterrows():
                    table_row = table.row()
                    for val in row:
                        table_row.cell(val)
            pdf.ln(5)
            
    return bytes(pdf.output())


# ----- TAB 2: CONSUMO (Insumos) -----
with tab2:
    c1, c2 = st.columns(2)
    with c1:
        st.subheader("Bunker & Inventário Operacional")
        st.caption("Acompanhamento das reservas a bordo (Água e Óleo Diesel)")
        fig_estoque = px.area(
            filtered_df, x='data_registro', y=['oleo_diesel_atual', 'agua_atual'],
            color_discrete_map={"oleo_diesel_atual": "#1E293B", "agua_atual": "#3B82F6"}
        )
        
        fig_estoque.for_each_trace(lambda t: t.update(
            hovertemplate="<b>%{x}</b><br>" + t.name.replace('_atual', ' ').title() + ": %{y:,.0f} m³<extra></extra>"
        ))
        
        fig_estoque.update_layout(
            legend_title="", xaxis_title="", yaxis_title="",
            yaxis=dict(showgrid=True, gridcolor="#E2E8F0"), # Area grafics precisam de um base visual pra nao flutuar
            margin=dict(l=0, r=0, t=30, b=0),
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="center", x=0.5)
        )
        st.plotly_chart(fig_estoque, use_container_width=True, config={'displayModeBar': False}, key="chart_estoque")

    with c2:
        st.subheader("Impacto de Diesel Diário")
        st.caption("Consumo reportado (Contratada vs Petrobras)")
        df_diesel = filtered_df.copy()
        df_diesel['diesel_consumido_contratada'] = df_diesel['diesel_consumido_contratada'].round(0)
        df_diesel['diesel_consumido_petrobras'] = df_diesel['diesel_consumido_petrobras'].round(0)
        
        fig_consumo = px.bar(
            df_diesel, x='data_registro', y=['diesel_consumido_contratada', 'diesel_consumido_petrobras'], 
            barmode='group',
            text="value",
            color_discrete_map={"diesel_consumido_contratada": "#2EC4B6", "diesel_consumido_petrobras": "#94A3B8"}
        )
        
        fig_consumo.for_each_trace(lambda t: t.update(
            hovertemplate="<b>%{x}</b><br>" + ("Foresea" if "contratada" in t.name else "Petrobras") + ": %{y} m³<extra></extra>",
            texttemplate='<b>%{y}</b>',
            textposition='outside',
            textfont=dict(size=14)
        ))
        
        for trace in fig_consumo.data:
            trace.text = ['<b>' + str(int(y)) + '</b>' if y and y > 0 else '' for y in trace.y]

        fig_consumo.update_layout(
            legend_title="", xaxis_title="", yaxis_title="",
            yaxis=dict(showticklabels=False, showgrid=False, zeroline=False),
            margin=dict(l=0, r=0, t=30, b=0),
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="center", x=0.5)
        )
        st.plotly_chart(fig_consumo, use_container_width=True, config={'displayModeBar': False}, key="chart_consumo")

    st.download_button(
        "📥 Baixar Relatório PDF (Insumos)",
        data=generate_pdf_report("Relatório de Insumos (Bunker & Diesel)", [
            {'type': 'text', 'content': '1. Bunker & Inventário Operacional (Saldos Atuais)'},
            {'type': 'table', 'df': filtered_df[['data_registro', 'sonda', 'oleo_diesel_atual', 'agua_atual']].rename(columns={'oleo_diesel_atual':'Diesel (m³)', 'agua_atual':'Água (m³)'})},
            {'type': 'text', 'content': '2. Consumo Diário de Diesel (Reporte)'},
            {'type': 'table', 'df': filtered_df[['data_registro', 'sonda', 'diesel_consumido_contratada', 'diesel_consumido_petrobras']].rename(columns={'diesel_consumido_contratada':'Consumo Foresea', 'diesel_consumido_petrobras':'Consumo Petrobras'})}
        ], orientation='L'),
        file_name=f"insumos_{pd.Timestamp.now().strftime('%Y%m%d')}.pdf",
        mime="application/pdf"
    )

# ----- TAB 3: COMPLIANCE E TEXTOS -----
with tab3:
    col_comp1, col_comp2 = st.columns([1, 1])
    
    with col_comp1:
        st.subheader("Frequência de Reduções (Downtime)")
        st.caption("Quais ocorrências contratuais foram ativadas")
        
        if contagem:
            df_contagem = pd.DataFrame(contagem).sort_values(by='Horas Perdidas', ascending=False)
            st.dataframe(
                df_contagem, 
                use_container_width=True, 
                hide_index=True,
                column_config={
                    "Dias Afetados": st.column_config.NumberColumn(format="%d"),
                    "Horas Perdidas": st.column_config.NumberColumn(format="%.1f h")
                }
            )
            
            # Gráfico de barras horizontal para as horas perdidas
            fig_h_bar = px.bar(
                df_contagem, 
                y='Cláusula', 
                x='Horas Perdidas',
                orientation='h',
                text='Horas Perdidas',
                color_discrete_sequence=['#3B82F6']
            )
            fig_h_bar.update_traces(
                texttemplate='<b>%{text}h</b>',
                textposition='outside',
                textfont=dict(size=14),
                hovertemplate="<b>%{y}</b><br>Perda: %{x}h<extra></extra>"
            )
            fig_h_bar.update_layout(
                yaxis={'categoryorder':'total ascending'}, 
                margin=dict(l=0, r=30, t=10, b=0), 
                xaxis_title="", 
                yaxis_title="",
                xaxis=dict(showticklabels=False, showgrid=False, zeroline=False)
            )
            st.plotly_chart(fig_h_bar, use_container_width=True, config={'displayModeBar': False}, key="chart_perdas")
            
        else:
            st.success("Nenhuma cláusula de penalidade acionada.")

    with col_comp2:
        st.subheader("Logs Integrais de Observação (Fiscal)")
        st.caption("Comentários in-loco (Petrobras vs Foresea)")
        
        if not obs_df.empty:
            st.dataframe(
                obs_df.rename(columns={
                    'data_registro': 'Data',
                    'sonda': 'Sonda',
                    'poco': 'Poço',
                    'observacoes_fiscalizacao': '👁️ Fiscal Petrobras',
                    'observacoes_contratada': '⚙️ Foresea'
                }),
                use_container_width=True,
                hide_index=True
            )
        else:
            st.info("Nenhuma anotação manual encontrada nas datas filtradas.")

    st.download_button(
        "📥 Baixar Relatório PDF (Compliance)",
        data=generate_pdf_report("Relatório de Compliance e Observações", [
            {'type': 'text', 'content': '1. Frequência de Reduções (Downtime)'},
            {'type': 'table', 'df': pd.DataFrame(contagem) if contagem else pd.DataFrame(columns=['Sem dados'])},
            {'type': 'text', 'content': '2. Logs Integrais de Observação (Fiscalização)'},
            {'type': 'table', 'df': obs_df.rename(columns={'observacoes_fiscalizacao':'Fiscal Petrobras', 'observacoes_contratada':'Foresea'})}
        ], orientation='L'),
        file_name=f"compliance_{pd.Timestamp.now().strftime('%Y%m%d')}.pdf",
        mime="application/pdf"
    )

# ----- TAB 4: RELATORIO EXECUTIVO (VISUAL) -----
with tab4:
    st.subheader("Fechamento de Uptime por Navio-Sonda (Visão Executiva)")
    st.caption("Consolidação visual dos Indicadores Operacionais e Faturamento Dólar (Equivalent) baseada nos pesos contratuais.")

    if not filtered_df.empty:
        # ----- 1. CARDS DE IMPACTO (Foresea Avg) -----
        st.markdown("##### 🌐 Média da Frota (Foresea Avg)")
        kpi_col1, kpi_col2, kpi_pad = st.columns([1, 1, 2])
        
        with kpi_col1:
            st.metric("Operational Availability", f"{mean_availability:.1f}%", help="Média percentual de todas as horas tarifadas (>0%) sobre o tempo total.")
        with kpi_col2:
            st.metric("Uptime 101 Equivalent", f"{mean_uptime_eq:.1f}%", help="Indicador Financeiro: Horas multiplicadas pelo peso tarifário (ex: 90%).", delta_color="normal")
            
        st.markdown("<br>", unsafe_allow_html=True)

        # ----- 2. GRÁFICO DE COMPARAÇÃO POR SONDA -----
        st.markdown("##### 📊 Comparativo de Performance por Sonda")
        df_plot = pd.DataFrame(dados_sonda)
        # Derreter o dataframe para o Plotly Bar Grouped
        df_melted = df_plot.melt(id_vars=["Sonda"], value_vars=["Operational Availability", "Uptime 101 Equivalent"], 
                                 var_name="Métrica", value_name="Taxa (%)")
        
        # Arredondar para o display e hover
        df_melted['Taxa (%)'] = df_melted['Taxa (%)'].round(1)

        fig_comparativo = px.bar(
            df_melted, 
            x="Sonda", 
            y="Taxa (%)", 
            color="Métrica", 
            barmode="group",
            text="Taxa (%)",
            color_discrete_map={
                "Operational Availability": "#3B82F6", 
                "Uptime 101 Equivalent": "#1E293B"
            }
        )
        
        fig_comparativo.update_traces(
            texttemplate='<b>%{text:.1f}%</b>', 
            textposition='outside',
            textfont=dict(size=18), # Ênfase gigantesca no texto
            hovertemplate="<b>%{x}</b><br>%{data.name}: %{text:.1f}%<extra></extra>"
        )
        fig_comparativo.update_layout(
             yaxis=dict(range=[0, 115], showticklabels=False, title="", showgrid=False, zeroline=False), # Ocultando o Eixo Y para focar no numero em si
             margin=dict(t=50, b=0, l=0, r=0),
             legend_title_text="",
             xaxis_title="",
             legend=dict(
                 orientation="h",
                 yanchor="bottom",
                 y=1.02,
                 xanchor="center",
                 x=0.5
             )
        )
        # Deixar a config do hover limpa
        st.plotly_chart(fig_comparativo, use_container_width=True, config={'displayModeBar': False}, key="chart_comparativo_sonda")

        # ----- 3. COMPOSIÇÃO FINANCEIRA DO UPTIME -----
        if composicao_horas:
             st.markdown("##### 💵 Composição Tarifária Acumulada (Horas Pagas)")
             st.caption("Abertura visível do peso das cláusulas pagamentos (100% vs 90%). O que compõe o faturamento de cada navio.")
             df_comp = pd.DataFrame(composicao_horas)
             df_comp['Horas Faturadas (Eq)'] = df_comp['Horas Faturadas (Eq)'].round(1)
             
             fig_composicao = px.bar(
                 df_comp,
                 y="Sonda",
                 x="Horas Faturadas (Eq)",
                 color="Categoria",
                 orientation='h',
                 text="Horas Faturadas (Eq)",
                 color_discrete_sequence=['#2EC4B6', '#F59E0B', '#3B82F6', '#1E2A5A']
             )
             
             fig_composicao.update_traces(
                 texttemplate='<b>%{text}h</b>',
                 textposition='inside',
                 insidetextanchor='middle',
                 textfont=dict(color='white', size=14),
                 hovertemplate="<b>%{y}</b><br>%{data.name}: %{text}h<extra></extra>"
             )
             
             fig_composicao.update_layout(
                 barmode='stack',
                 margin=dict(t=30, b=0, l=0, r=0),
                 yaxis_title="",
                 xaxis_title="Volume de Horas Equivalentes Faturadas",
                 legend_title_text="",
                 xaxis=dict(showgrid=False),
                 legend=dict(
                     orientation="h",
                     yanchor="bottom",
                     y=1.02,
                     xanchor="center",
                     x=0.5
                 )
             )
             st.plotly_chart(fig_composicao, use_container_width=True, config={'displayModeBar': False}, key="chart_composicao_faturamento")

        st.markdown("---")
        st.markdown("##### 📑 Tabela Oficial Equivalente (Formato Excel)")
        st.caption("Visão bruta consolidatória utilizada para exportação C-Level.")

        # Exibir a tabela formatada (Tabela Oficial Excel)
        st.dataframe(
            df_executivo,
            use_container_width=True,
            hide_index=True,
            column_config={
                "Current Month (hours)": st.column_config.TextColumn("Descrição", width="large"),
                **{s: st.column_config.NumberColumn(s, format="%.1f") for s in sondas_ativas},
                "Foresea Avg": st.column_config.NumberColumn("Média Frota", format="%.1f")
            }
        )

    else:
         st.warning("Selecione ferramentas nos filtros ou extraia documentos via formulário para analisar.")

    st.download_button(
        "📥 Baixar Relatório PDF (Executivo)",
        data=generate_pdf_report("Relatório Executivo de Uptime Foresea", [
            {'type': 'text', 'content': '1. Médias de Frota (Impacto Financeiro)'},
            {'type': 'metric', 'label': 'Operational Availability', 'value': f"{mean_availability:.1f}%"},
            {'type': 'metric', 'label': 'Uptime 101 Equivalent', 'value': f"{mean_uptime_eq:.1f}%"},
            {'type': 'text', 'content': '2. Comparativo de Performance por Sonda'},
            {'type': 'table', 'df': pd.DataFrame(dados_sonda)},
            {'type': 'text', 'content': '3. Detalhamento de Composição Financeira'},
            {'type': 'table', 'df': pd.DataFrame(composicao_horas) if composicao_horas else pd.DataFrame()},
            {'type': 'text', 'content': '4. Tabela Oficial Equivalente (Fechamento)'},
            {'type': 'table', 'df': df_executivo}
        ], orientation='L'),
        file_name=f"executivo_{pd.Timestamp.now().strftime('%Y%m%d')}.pdf",
        mime="application/pdf"
    )

# ----- TAB 6: VISÃO DIÁRIA DE SONDAS -----
with tab6:
    st.subheader("Performance Diária por Navio-Sonda")
    st.caption("Horas Funcionais (%) por dia | cálculo: (Σ cláusulas exceto 102 e 211) ÷ (Σ todas as cláusulas) × 100")

    if not filtered_df.empty and 'sonda' in filtered_df.columns:

        # Mapeamento de código de sonda para nome comercial
        nomes_sonda = {
            'SS-81': 'Norbe VI',
            'NS-32': 'Norbe VIII',
            'NS-33': 'Norbe IX',
            'NS-41': 'ODN I',
            'NS-42': 'ODN II',
        }

        sondas_ativas = sorted(filtered_df['sonda'].dropna().unique().tolist())

        for sonda in sondas_ativas:
            nome_exibicao = nomes_sonda.get(sonda, sonda)  # fallback pro código se não mapeado
            st.markdown(f"### 🚢 {nome_exibicao}")

            df_s = filtered_df[filtered_df['sonda'] == sonda].copy()
            df_s = df_s.sort_values('data_registro')

            # Agrupar por dia (se houver múltiplos poços na mesma sonda/dia, soma tudo)
            cols_para_agrupar = [c for c in all_clausula_cols if c in df_s.columns]
            df_day = df_s.groupby('data_registro')[cols_para_agrupar].sum().reset_index()
            df_day = df_day.sort_values('data_registro')  # garantir ordem cronológica

            # Calcular denominador (todas as cláusulas) e numerador (exceto 102 e 211)
            cols_num_disponiveis = [c for c in cols_numerador if c in df_day.columns]
            df_day['denominador'] = df_day[cols_para_agrupar].sum(axis=1)
            df_day['numerador'] = df_day[cols_num_disponiveis].sum(axis=1) if cols_num_disponiveis else 0

            # Horas Funcionais (%) — altura da coluna e valor exibido no topo
            df_day['horas_funcionais_pct'] = df_day.apply(
                lambda row: round((row['numerador'] / row['denominador']) * 100, 1)
                if row['denominador'] > 0 else 0.0,
                axis=1
            )

            # Formatar datas como DD/MM para exibição no eixo X
            import datetime
            df_day['data_str'] = pd.to_datetime(df_day['data_registro']).dt.strftime('%d/%m')

            fig = go.Figure()

            fig.add_trace(go.Bar(
                x=df_day['data_str'],
                y=df_day['horas_funcionais_pct'],
                marker=dict(
                    color=df_day['horas_funcionais_pct'],
                    colorscale=[[0, '#EF4444'], [0.7, '#3B82F6'], [1.0, '#2EC4B6']],
                    cmin=0,
                    cmax=100,
                    showscale=False,
                    line=dict(width=0)
                ),
                # Sem text/textfont aqui — usamos annotations manuais abaixo
                hovertemplate=(
                    "<b>%{x}</b><br>"
                    "Horas Funcionais: <b>%{y:.1f}%</b><extra></extra>"
                ),
                name='Horas Funcionais (%)'
            ))

            # Annotations manuais — tamanho 10px conforme solicitado
            for data_str_val, pct_val in zip(df_day['data_str'], df_day['horas_funcionais_pct']):
                fig.add_annotation(
                    x=data_str_val,
                    y=pct_val,
                    text=f"<b>{pct_val}%</b>",
                    showarrow=False,
                    yanchor='bottom',
                    yshift=5,           
                    font=dict(size=10, family='Arial, sans-serif'),
                    xref='x',
                    yref='y'
                )

            fig.update_layout(
                xaxis=dict(
                    title='',
                    tickangle=-35,
                    type='category',
                    categoryorder='array',
                    categoryarray=df_day['data_str'].tolist()
                ),
                yaxis=dict(
                    title='Horas Funcionais (%)',
                    range=[0, 110],     # teto reduzido (mais compacto)
                    ticksuffix='%',
                    showgrid=True,
                    gridcolor='#E2E8F0',
                    zeroline=False
                ),
                showlegend=False,
                bargap=0.4,
                margin=dict(t=60, b=40, l=0, r=0),
                height=450,
                plot_bgcolor='white',
                paper_bgcolor='white',
            )

            st.plotly_chart(fig, use_container_width=True, config={'displayModeBar': False}, key=f"chart_diario_{sonda}")
            st.markdown("---")


    else:
        st.info("Sem dados suficientes para gerar a visão diária.")

    st.download_button(
        "📥 Baixar Relatório PDF (Diário)",
        data=generate_pdf_report("Visão Diária de Performance", [
            {'type': 'text', 'content': 'Histórico Diário de Eficiência (%) por Navio-Sonda'},
            {'type': 'table', 'df': df_diario_consolidado}
        ], orientation='L'),
        file_name=f"diario_{pd.Timestamp.now().strftime('%Y%m%d')}.pdf",
        mime="application/pdf"
    )



# ----- TAB 5: RAW DATA (SQL View) -----
with tab5:
    st.subheader("🗄️ Master Database View (Cloud SQL)")
    st.caption("Visão bruta de enriquecimento para cientistas de dados e exportação de CSV.")
    
    st.dataframe(
        filtered_df.sort_values(by='data_registro', ascending=False),
        use_container_width=True,
        hide_index=True
    )
    
    st.download_button(
        label="📥 Exportar Dados Atuais (CSV)",
        data=filtered_df.to_csv(index=False).encode('utf-8'),
        file_name='extrato_operacoes_foresea.csv',
        mime='text/csv',
    )

    st.download_button(
        "📥 Baixar Relatório PDF (Raw Data Completo)",
        data=generate_pdf_report("Extração Integral de Dados Brutos", [
            {'type': 'text', 'content': 'Parte 1: Identificação e Localização'},
            {'type': 'table', 'df': filtered_df[['data_registro', 'sonda', 'poco']].head(100)},
            {'type': 'text', 'content': 'Parte 2: Cláusulas Operacionais (Horas)'},
            {'type': 'table', 'df': filtered_df[['data_registro', 'sonda'] + [c for c in all_clausula_cols if 'clausula' in c][:15]].head(100)},
            {'type': 'text', 'content': 'Parte 3: Insumos e Consumo'},
            {'type': 'table', 'df': filtered_df[['data_registro', 'sonda', 'oleo_diesel_atual', 'diesel_consumido_contratada', 'agua_atual', 'agua_consumida']].head(100)},
            {'type': 'text', 'content': 'Parte 4: Observações Gerais'},
            {'type': 'table', 'df': filtered_df[['data_registro', 'sonda', 'observacoes_fiscalizacao', 'observacoes_contratada']].head(50)}
        ], orientation='L'),
        file_name=f"raw_data_full_{pd.Timestamp.now().strftime('%Y%m%d')}.pdf",
        mime="application/pdf"
    )
