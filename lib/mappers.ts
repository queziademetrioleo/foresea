export interface ExtractedData {
    tipo_documento?: string;
    numero?: number;
    data?: string;
    sonda?: string;
    poco?: string;
    clausulas?: {
        '101'?: number;
        '102'?: number;
        motivo_102?: string;
        '104.1A'?: number;
        '104.1B'?: number;
        '104.1C'?: number;
        '104.1D'?: number;
        '104.2'?: number;
        '104.2B'?: number;
        '104.2C'?: number;
        '105'?: number;
        '107'?: number;
        outras?: number;
        '2.1.1'?: number;
    };
    diesel_consumido?: {
        contratada?: number;
        petrobras?: number;
    };
    oleo_diesel?: {
        inicial?: number;
        recebido?: number;
        atual?: number;
    };
    agua?: {
        inicial?: number;
        atual?: number;
        produzida?: number;
        consumida?: number;
        recebida?: number;
        para_fluidos?: number;
    };
    vagas_excedentes_utilizadas_petrobras?: number;
    observacoes?: {
        fiscalizacao?: string;
        contratada?: string;
    };
    outras_clausulas_encontradas?: string;
}

export interface DBRow {
    identificador: string;
    sonda: string | null;
    nome_arquivo: string;
    numero: number | null;
    tipo: string | null;
    poco: string | null;
    data_registro: string | null;
    clausula_101: number | null;
    clausula_104_1a: number | null;
    clausula_104_1b: number | null;
    clausula_104_1c: number | null;
    clausula_104_1d: number | null;
    clausula_104_2: number | null;
    clausula_104_2b: number | null;
    clausula_104_2c: number | null;
    clausula_105: number | null;
    clausula_107: number | null;
    clausula_102: number | null;
    clausula_2_1_1: number | null;
    outras_clausulas: number | null;
    diesel_consumido_contratada: number | null;
    diesel_consumido_petrobras: number | null;
    oleo_diesel_inicial: number | null;
    oleo_diesel_recebido: number | null;
    oleo_diesel_atual: number | null;
    agua_inicial: number | null;
    agua_atual: number | null;
    agua_produzida: number | null;
    agua_consumida: number | null;
    agua_recebida: number | null;
    agua_para_fluidos: number | null;
    vagas_excedentes_petrobras: number | null;
    observacao: string | null;
    observacoes_fiscalizacao: string | null;
    observacoes_contratada: string | null;
    outras_clausulas_encontradas: string | null;
    link_arquivo: string | null;
    check_status: number | null;
}

export function mapExtractedToDBRow(
    data: ExtractedData,
    fileName: string,
    linkArquivo?: string
): DBRow {
    const poco = data.poco ?? null;
    const numero = data.numero ?? null;

    // Build identificador: {poco}-{numero}
    const identificador = poco && numero
        ? `${poco}-${numero}`
        : `${fileName.replace(/\.[^.]+$/, '')}-${Date.now()}`;

    return {
        identificador,
        sonda: data.sonda ?? null,
        nome_arquivo: fileName,
        numero: numero,
        tipo: data.tipo_documento ?? null,
        poco: poco,
        data_registro: data.data ?? null,
        clausula_101: data.clausulas?.['101'] ?? null,
        clausula_102: data.clausulas?.['102'] ?? null,
        clausula_104_1a: data.clausulas?.['104.1A'] ?? null,
        clausula_104_1b: data.clausulas?.['104.1B'] ?? null,
        clausula_104_1c: data.clausulas?.['104.1C'] ?? null,
        clausula_104_1d: data.clausulas?.['104.1D'] ?? null,
        clausula_104_2: data.clausulas?.['104.2'] ?? null,
        clausula_104_2b: data.clausulas?.['104.2B'] ?? null,
        clausula_104_2c: data.clausulas?.['104.2C'] ?? null,
        clausula_105: data.clausulas?.['105'] ?? null,
        clausula_107: data.clausulas?.['107'] ?? null,
        clausula_2_1_1: data.clausulas?.['2.1.1'] ?? null,
        outras_clausulas: data.clausulas?.outras ?? null,
        diesel_consumido_contratada: data.diesel_consumido?.contratada ?? null,
        diesel_consumido_petrobras: data.diesel_consumido?.petrobras ?? null,
        oleo_diesel_inicial: data.oleo_diesel?.inicial ?? null,
        oleo_diesel_recebido: data.oleo_diesel?.recebido ?? null,
        oleo_diesel_atual: data.oleo_diesel?.atual ?? null,
        agua_inicial: data.agua?.inicial ?? null,
        agua_atual: data.agua?.atual ?? null,
        agua_produzida: data.agua?.produzida ?? null,
        agua_consumida: data.agua?.consumida ?? null,
        agua_recebida: data.agua?.recebida ?? null,
        agua_para_fluidos: data.agua?.para_fluidos ?? null,
        vagas_excedentes_petrobras: data.vagas_excedentes_utilizadas_petrobras ?? null,
        observacao: null,
        observacoes_fiscalizacao: data.observacoes?.fiscalizacao ?? null,
        observacoes_contratada: data.observacoes?.contratada ?? null,
        outras_clausulas_encontradas: data.outras_clausulas_encontradas ?? (data.clausulas as any)?.outras_clausulas_encontradas ?? null,
        link_arquivo: linkArquivo ?? null,
        check_status: 1,
    };
}

export async function insertDBRow(row: DBRow) {
    const { query } = await import('./db');
    const sql = `
    INSERT INTO public.uptimeoperacional (
      identificador, sonda, nome_arquivo, numero, tipo, poco, data_registro,
      clausula_101, clausula_104_1a, clausula_104_1b, clausula_104_1c, clausula_104_1d,
      clausula_104_2, clausula_104_2b, clausula_104_2c, clausula_105, clausula_107,
      clausula_102, clausula_2_1_1, outras_clausulas,
      diesel_consumido_contratada, diesel_consumido_petrobras,
      oleo_diesel_inicial, oleo_diesel_recebido, oleo_diesel_atual,
      agua_inicial, agua_atual, agua_produzida, agua_consumida, agua_recebida, agua_para_fluidos,
      vagas_excedentes_petrobras, observacao, observacoes_fiscalizacao,
      observacoes_contratada, outras_clausulas_encontradas, link_arquivo, check_status
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,
      $8,$9,$10,$11,$12,
      $13,$14,$15,$16,$17,
      $18,$19,$20,
      $21,$22,
      $23,$24,$25,
      $26,$27,$28,$29,$30,$31,
      $32,$33,$34,
      $35,$36,$37,$38
    )
    ON CONFLICT (identificador) DO UPDATE SET
      sonda = EXCLUDED.sonda,
      data_registro = EXCLUDED.data_registro,
      clausula_101 = EXCLUDED.clausula_101,
      check_status = EXCLUDED.check_status,
      data_inclusao = CURRENT_TIMESTAMP
    RETURNING identificador;
  `;

    const values = [
        row.identificador, row.sonda, row.nome_arquivo, row.numero, row.tipo, row.poco, row.data_registro,
        row.clausula_101, row.clausula_104_1a, row.clausula_104_1b, row.clausula_104_1c, row.clausula_104_1d,
        row.clausula_104_2, row.clausula_104_2b, row.clausula_104_2c, row.clausula_105, row.clausula_107,
        row.clausula_102, row.clausula_2_1_1, row.outras_clausulas,
        row.diesel_consumido_contratada, row.diesel_consumido_petrobras,
        row.oleo_diesel_inicial, row.oleo_diesel_recebido, row.oleo_diesel_atual,
        row.agua_inicial, row.agua_atual, row.agua_produzida, row.agua_consumida, row.agua_recebida, row.agua_para_fluidos,
        row.vagas_excedentes_petrobras, row.observacao, row.observacoes_fiscalizacao,
        row.observacoes_contratada, row.outras_clausulas_encontradas, row.link_arquivo, row.check_status,
    ];

    return query(sql, values);
}
