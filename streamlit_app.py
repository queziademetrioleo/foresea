import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from sqlalchemy import create_engine

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
    st.image("https://foresea.com/wp-content/uploads/2023/06/logo_menu.svg", width=180)
    st.markdown("### 📊 Operações de Sondas")
    st.write("Selecione os parâmetros de extração para o dashboard:")
    
    sondas_unicas = df['sonda'].dropna().unique().tolist()
    pocos_unicos = df['poco'].dropna().unique().tolist()

    selected_sonda = st.multiselect("Navio-Sonda", options=sondas_unicas, default=sondas_unicas)
    selected_poco = st.multiselect("Poço / Localização", options=pocos_unicos, default=pocos_unicos)

    min_date = df['data_registro'].min()
    max_date = df['data_registro'].max()
    selected_dates = st.date_input("Período de Refência", [min_date, max_date], min_value=min_date, max_value=max_date)

    st.markdown("---")
    st.caption("Powered by Gemini 2.5 Pro Multimodal")

# ----- APLICANDO FILTROS -----
mask = (df['sonda'].isin(selected_sonda)) & (df['poco'].isin(selected_poco))
if len(selected_dates) == 2:
    start_dt, end_dt = selected_dates
    mask = mask & (df['data_registro'] >= start_dt) & (df['data_registro'] <= end_dt)
filtered_df = df[mask]

# ----- HEADER PRINCIPAL -----
st.markdown('<div class="main-title">Intelligence & Uptime Ops</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-title">Gestão de Eficiência Baseada em Relatórios Operacionais Diários (ADA)</div>', unsafe_allow_html=True)

# Cálculos Iniciais
total_registros = len(filtered_df)
total_horas_possiveis = total_registros * 24.0
if total_horas_possiveis > 0:
    uptime_mensal_perc = ((filtered_df['clausula_101'].sum()) / total_horas_possiveis) * 100
else:
    uptime_mensal_perc = 0.0

total_diesel = filtered_df['diesel_consumido_contratada'].sum() + filtered_df['diesel_consumido_petrobras'].sum()

# ----- 1. HIGHLIGHTS (Metrics Nativas Modernas) -----
m1, m2, m3, m4 = st.columns(4)
with m1:
    st.metric("Uptime Contratual Mapeado", f"{uptime_mensal_perc:.1f}%", f"{total_registros} Documentos", delta_color="normal")
with m2:
    st.metric("Consumo Total de Diesel", f"{total_diesel:,.0f} m³", "Combinado Contratada+PB", delta_color="off")
with m3:
    agua = filtered_df['agua_consumida'].sum()
    st.metric("Consumo de Água", f"{agua:,.0f} m³")
with m4:
    downtimes = (filtered_df['clausula_102'] > 0).sum()
    st.metric("Dias com Downtime", f"{downtimes}", delta_color="inverse", delta=f"{downtimes} Eventos", help="Dias em que a Cláusula 102 registrou tempo > 0")

st.markdown("---")

# ----- TABS PARA NAVEGAÇÃO CLEAN -----
tab1, tab2, tab3, tab4, tab5 = st.tabs(["📊 Uptime & Eficiência", "📉 Insumos (Diesel/Água)", "🚨 Compliance (Penalidades)", "💼 Relatório Executivo", "🗄️ Raw Data (SQL View)"])

# ----- TAB 1: UPTIME E EFICIÊNCIA -----
with tab1:
    col_up1, col_up2 = st.columns([1, 1.5])
    
    with col_up1:
        st.subheader("Distribuição de Horas (Operação vs Downtime)")
        st.caption("Visão macro do aproveitamento da Sonda no período")
        
        # Calcular somatório de uptime e downtime
        total_op_horas = filtered_df['clausula_101'].sum() if 'clausula_101' in filtered_df.columns else 0
        total_down_horas = filtered_df['clausula_102'].sum() if 'clausula_102' in filtered_df.columns else 0
        
        # Criar dataframe pro Pie Chart
        df_pie = pd.DataFrame({
            "Categoria": ["Operação (101)", "Downtime (102)"],
            "Horas": [total_op_horas, total_down_horas]
        })
        
        if total_op_horas + total_down_horas > 0:
            fig_pie = px.pie(
                df_pie, 
                values='Horas', 
                names='Categoria',
                color='Categoria',
                color_discrete_map={"Operação (101)": "#2EC4B6", "Downtime (102)": "#1E2A5A"},
                hole=0.4
            )
            fig_pie.update_traces(
                textposition='inside', 
                textinfo='percent+label', 
                textfont=dict(size=16, color="white"),
                marker=dict(line=dict(color='#FFFFFF', width=2)),
                hovertemplate="<b>%{label}</b><br>Horas: %{value:.1f}h<extra></extra>"
            )
            fig_pie.update_layout(showlegend=False, margin=dict(t=10, b=10, l=10, r=10))
            st.plotly_chart(fig_pie, use_container_width=True, config={'displayModeBar': False})
        else:
            st.info("Sem dados de Uptime suficientes para este período.")
            
    with col_up2:
        st.subheader("Evolução Diária do Uptime")
        st.caption("Horas operacionais validadas por dia")
        if not filtered_df.empty and 'clausula_101' in filtered_df.columns:
            # Arredondar para o grafico
            df_bar_up = filtered_df.copy()
            df_bar_up['clausula_101'] = df_bar_up['clausula_101'].round(1)
            df_bar_up['clausula_102'] = df_bar_up['clausula_102'].round(1)
            
            fig_bar_uptime = px.bar(
                df_bar_up, 
                x='data_registro', 
                y=['clausula_101', 'clausula_102'],
                barmode='stack',
                title="",
                labels={"value": "Horas", "variable": "Tipo de Hora"},
                text="value",
                color_discrete_map={"clausula_101": "#2EC4B6", "clausula_102": "#EF4444"}
            )
            
            newnames = {'clausula_101': 'Horas Operando', 'clausula_102': 'Downtime Penalizado'}
            
            for t in fig_bar_uptime.data:
                label_name = newnames.get(t.name, t.name)
                t.name = label_name
                t.legendgroup = label_name
                t.hovertemplate = "<b>%{x}</b><br>"+label_name+": %{y}h<extra></extra>"
                t.texttemplate = '%{y}h'
                t.textposition = 'inside'
                t.textfont = dict(color='white')
                
                # Ocultar zeros substituindo o array de texto na fonte
                t.text = ['<b>' + str(y) + 'h</b>' if y and y > 0 else '' for y in t.y]
                t.texttemplate = '%{text}'
            
            # Força ocultar zeros para nao sujar o grafico
            for trace in fig_bar_uptime.data:
                trace.text = ['<b>' + str(y) + 'h</b>' if y and y > 0 else '' for y in trace.y]

            fig_bar_uptime.update_layout(
                xaxis_title="", yaxis_title="",
                yaxis=dict(showticklabels=False, showgrid=False, zeroline=False),
                legend_title_text="",
                margin=dict(l=0, r=0, t=30, b=0),
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="center", x=0.5)
            )
            st.plotly_chart(fig_bar_uptime, use_container_width=True, config={'displayModeBar': False})


# ----- TAB 2: CONSUMO (Insumos) -----
with tab2:
    c1, c2 = st.columns(2)
    with c1:
        st.subheader("Bunker & Inventário Operacional")
        st.caption("Acompanhamento das reservas a bordo (Água e Óleo Diesel)")
        fig_estoque = px.area(
            filtered_df, x='data_registro', y=['oleo_diesel_atual', 'agua_atual'],
            color_discrete_map={"oleo_diesel_atual": "#16214A", "agua_atual": "#2FA8D8"}
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
        st.plotly_chart(fig_estoque, use_container_width=True, config={'displayModeBar': False})

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
            color_discrete_map={"diesel_consumido_contratada": "#2EC4B6", "diesel_consumido_petrobras": "#F59E0B"}
        )
        
        fig_consumo.for_each_trace(lambda t: t.update(
            hovertemplate="<b>%{x}</b><br>" + ("Foresea" if "contratada" in t.name else "Petrobras") + ": %{y} m³<extra></extra>",
            texttemplate='<b>%{y}</b>',
            textposition='outside',
            textfont=dict(size=14, color="#1E2A5A")
        ))
        
        for trace in fig_consumo.data:
            trace.text = ['<b>' + str(int(y)) + '</b>' if y and y > 0 else '' for y in trace.y]

        fig_consumo.update_layout(
            legend_title="", xaxis_title="", yaxis_title="",
            yaxis=dict(showticklabels=False, showgrid=False, zeroline=False),
            margin=dict(l=0, r=0, t=30, b=0),
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="center", x=0.5)
        )
        st.plotly_chart(fig_consumo, use_container_width=True, config={'displayModeBar': False})

# ----- TAB 3: COMPLIANCE E TEXTOS -----
with tab3:
    col_comp1, col_comp2 = st.columns([1, 1])
    
    with col_comp1:
        st.subheader("Frequência de Reduções (Downtime)")
        st.caption("Quais ocorrências contratuais foram ativadas")
        
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
                color_discrete_sequence=['#F59E0B']
            )
            fig_h_bar.update_traces(
                texttemplate='<b>%{text}h</b>',
                textposition='outside',
                textfont=dict(size=14, color="#1E2A5A"),
                hovertemplate="<b>%{y}</b><br>Perda: %{x}h<extra></extra>"
            )
            fig_h_bar.update_layout(
                yaxis={'categoryorder':'total ascending'}, 
                margin=dict(l=0, r=30, t=10, b=0), 
                xaxis_title="", 
                yaxis_title="",
                xaxis=dict(showticklabels=False, showgrid=False, zeroline=False)
            )
            st.plotly_chart(fig_h_bar, use_container_width=True, config={'displayModeBar': False})
            
        else:
            st.success("Nenhuma cláusula de penalidade acionada.")

    with col_comp2:
        st.subheader("Logs Integrais de Observação (Fiscal)")
        st.caption("Comentários in-loco (Petrobras vs Foresea)")
        
        obs_df = filtered_df[['data_registro', 'sonda', 'poco', 'observacoes_fiscalizacao', 'observacoes_contratada']].copy()
        obs_df = obs_df[
            (obs_df['observacoes_fiscalizacao'].str.strip() != '') | 
            (obs_df['observacoes_contratada'].str.strip() != '')
        ].fillna('')
        
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

# ----- TAB 4: RELATORIO EXECUTIVO (VISUAL) -----
with tab4:
    st.subheader("Fechamento de Uptime por Navio-Sonda (Visão Executiva)")
    st.caption("Consolidação visual dos Indicadores Operacionais e Faturamento Dólar (Equivalent) baseada nos pesos contratuais.")

    if not filtered_df.empty:
        # Configuração de pesos
        tarifas_config = [
            {"label": "101 Operating Hours", "peso": 1.0, "cols": ["clausula_101"]},
            {"label": "105 Moving", "peso": 0.9, "cols": ["clausula_105"]},
            {"label": "104.1.a Stand-by Weather", "peso": 0.9, "cols": ["clausula_107"]},
            {"label": "104.1.b Stand-by Petrobras", "peso": 0.9, "cols": ["clausula_104_1a", "clausula_104_1c", "clausula_104_1d"]},
            {"label": "104.1.b Docagem Rem", "peso": 0.9, "cols": []},
            {"label": "102 Repair/211+", "peso": 0.0, "cols": ["clausula_102"]},
            {"label": "222 Reduced/Bonus", "peso": 0.0, "cols": []}
        ]

        sondas_ativas = filtered_df['sonda'].dropna().unique().tolist()
        
        # Estruturas para armazenar dados processados
        dados_sonda = []
        composicao_horas = []
        
        availability_avg_sum = 0
        uptime_eq_avg_sum = 0

        for sonda in sondas_ativas:
            df_sonda = filtered_df[filtered_df['sonda'] == sonda]
            dias_sonda = len(df_sonda['data_registro'].unique())
            total_horas_possiveis = dias_sonda * 24.0
            
            horas_operacionais = 0
            horas_equivalentes = 0
            
            for tarifa in tarifas_config:
                soma_tarifa = 0
                for col in tarifa["cols"]:
                    if col in df_sonda.columns:
                        soma_horas = df_sonda[col].fillna(0).sum()
                        soma_tarifa += soma_horas
                
                if tarifa["peso"] > 0:
                    horas_operacionais += soma_tarifa
                
                horas_eq_parcial = soma_tarifa * tarifa["peso"]
                horas_equivalentes += horas_eq_parcial
                
                # Guarda dados para o grafico empilhado de composicao financeira (somente onde houve peso)
                if horas_eq_parcial > 0:
                     composicao_horas.append({
                         "Sonda": sonda,
                         "Categoria": f"{tarifa['label']} ({int(tarifa['peso']*100)}%)",
                         "Horas Faturadas (Eq)": horas_eq_parcial
                     })

            perc_availability = (horas_operacionais / total_horas_possiveis * 100) if total_horas_possiveis > 0 else 0
            perc_uptime_eq = (horas_equivalentes / total_horas_possiveis * 100) if total_horas_possiveis > 0 else 0
            
            dados_sonda.append({
                "Sonda": sonda,
                "Operational Availability": perc_availability,
                "Uptime 101 Equivalent": perc_uptime_eq
            })
            
            availability_avg_sum += perc_availability
            uptime_eq_avg_sum += perc_uptime_eq

        count_sondas = len(sondas_ativas)
        mean_availability = availability_avg_sum / count_sondas if count_sondas > 0 else 0
        mean_uptime_eq = uptime_eq_avg_sum / count_sondas if count_sondas > 0 else 0

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
                "Operational Availability": "#2FA8D8", # Azul Mais claro (Geralmente maior)
                "Uptime 101 Equivalent": "#16214A"   # Azul Petro (Sólido, Faturamento)
            }
        )
        
        fig_comparativo.update_traces(
            texttemplate='<b>%{text:.1f}%</b>', 
            textposition='outside',
            textfont=dict(size=18, color="#1E2A5A"), # Ênfase gigantesca no texto
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
        st.plotly_chart(fig_comparativo, use_container_width=True, config={'displayModeBar': False})

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
             st.plotly_chart(fig_composicao, use_container_width=True, config={'displayModeBar': False})

        # ----- 4. TABELA OFICIAL ESTILO EXCEL -----
        st.markdown("---")
        st.markdown("##### 📑 Tabela Oficial Equivalente (Formato Excel)")
        st.caption("Visão bruta consolidatória utilizada para exportação C-Level.")
        
        # Estruturar os dados para a Tabela Excel
        linhas_dados = []
        
        # Para cada tarifa na config, calcular a soma para cada sonda e a media
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
            
            # Foresea Avg para esta linha especifica (Soma Total / qtd Sondas) ou media
            linha_atual["Foresea Avg"] = soma_total_foresea / count_sondas if count_sondas > 0 else 0
            linhas_dados.append(linha_atual)

        # Adicionar as 3 linhas de Resultados (Availability, Uptime Eq, Total Days, Range)
        linha_availability = {"Current Month (hours)": "Operational Availability"}
        linha_uptime_eq = {"Current Month (hours)": "Uptime 101 Equivalent"}
        linha_days = {"Current Month (hours)": "Total days included"}
        
        start_dt_str = min_date.strftime("%b %d")
        end_dt_str = max_date.strftime("%b %d")
        linha_range = {"Current Month (hours)": "Data range"}
        
        # Preencher linhas de resultado com os dados ja processados
        for dicionario_sonda in dados_sonda:
            sonda_nome = dicionario_sonda["Sonda"]
            linha_availability[sonda_nome] = dicionario_sonda["Operational Availability"]
            linha_uptime_eq[sonda_nome] = dicionario_sonda["Uptime 101 Equivalent"]
            linha_days[sonda_nome] = str(len(filtered_df[filtered_df['sonda'] == sonda_nome]['data_registro'].unique()))
            linha_range[sonda_nome] = f"{start_dt_str} to {end_dt_str}"
            
        linha_availability["Foresea Avg"] = mean_availability
        linha_uptime_eq["Foresea Avg"] = mean_uptime_eq
        linha_days["Foresea Avg"] = ""
        linha_range["Foresea Avg"] = ""
        
        linhas_dados.append(linha_availability)
        linhas_dados.append(linha_uptime_eq)
        linhas_dados.append(linha_days)
        linhas_dados.append(linha_range)
        
        df_executivo = pd.DataFrame(linhas_dados)

        # Estilizar o DataFrame para destaque
        def highlight_results(s):
            if s["Current Month (hours)"] == "Uptime 101 Equivalent":
                return ['background-color: #1E2A5A; color: white; font-weight: 900; font-size: 1.1em'] * len(s)
            elif s["Current Month (hours)"] == "Operational Availability":
                return ['background-color: #2FA8D8; color: white; font-weight: bold'] * len(s)
            elif s["Current Month (hours)"] == "Total days included":
                return ['color: #6B7280; font-style: italic'] * len(s)
            
            # Zebrar as linhas de tarifa de forma leve
            return [''] * len(s)

        styled_df = df_executivo.style.apply(highlight_results, axis=1)

        # Colorir valores numéricos com um mapa de calor leve (exceto a coluna de nomes)
        cols_numericas = sondas_ativas + ["Foresea Avg"]
        
        # Aplica o gradiente nas primeiras linhas (que são as horas brutas), ignorando os calculos em string
        styled_df = styled_df.background_gradient(
            subset=pd.IndexSlice[:len(tarifas_config)-1, cols_numericas], 
            cmap='GnBu', 
            vmin=0
        )

        # Formatar como porcentagem ou numero com 1 casa decimal
        format_dict = {}
        for col in cols_numericas:
            format_dict[col] = lambda x, col=col: f"{x:.1f}%" if isinstance(x, (int, float)) and df_executivo.loc[df_executivo[col] == x, "Current Month (hours)"].str.contains("Availability|Equivalent").any() else (f"{x:.1f}" if isinstance(x, (int, float)) else str(x))

        st.dataframe(
            styled_df.format(format_dict),
            use_container_width=True,
            hide_index=True
        )

    else:
         st.warning("Selecione ferramentas nos filtros ou extraia documentos via formulário para analisar.")

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
