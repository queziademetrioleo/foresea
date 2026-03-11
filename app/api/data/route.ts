import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const sonda = searchParams.get('sonda');
        const poco = searchParams.get('poco');
        const tipo = searchParams.get('tipo');
        const limit = parseInt(searchParams.get('limit') || '100');
        const offset = parseInt(searchParams.get('offset') || '0');

        const conditions: string[] = [];
        const values: unknown[] = [];
        let idx = 1;

        if (startDate) { conditions.push(`data_registro >= $${idx++}`); values.push(startDate); }
        if (endDate) { conditions.push(`data_registro <= $${idx++}`); values.push(endDate); }
        if (sonda) { conditions.push(`sonda ILIKE $${idx++}`); values.push(`%${sonda}%`); }
        if (poco) { conditions.push(`poco ILIKE $${idx++}`); values.push(`%${poco}%`); }
        if (tipo) { conditions.push(`tipo = $${idx++}`); values.push(tipo); }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const dataResult = await query(
            `SELECT * FROM public.uptimeoperacional ${where} ORDER BY data_registro DESC LIMIT $${idx++} OFFSET $${idx}`,
            [...values, limit, offset]
        );

        const summaryResult = await query(
            `SELECT 
                COALESCE(SUM(clausula_101), 0) as total_uptime_h,
                COALESCE(SUM(clausula_102), 0) as total_downtime_h,
                COALESCE(SUM(diesel_consumido_contratada + diesel_consumido_petrobras), 0) as total_diesel_m3,
                COALESCE(SUM(agua_consumida), 0) as total_agua_m3,
                COUNT(*) as total_registros
             FROM public.uptimeoperacional ${where}`,
            values
        );

        const countResult = await query(
            `SELECT COUNT(*) FROM public.uptimeoperacional ${where}`,
            values
        );

        return NextResponse.json({
            data: dataResult.rows,
            summary: summaryResult.rows[0],
            total: parseInt(countResult.rows[0].count),
            limit,
            offset,
        });
    } catch (err) {
        console.error('Data fetch error:', err);
        return NextResponse.json(
            { error: `Erro ao buscar dados: ${err instanceof Error ? err.message : 'erro desconhecido'}` },
            { status: 500 }
        );
    }
}
