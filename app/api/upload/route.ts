import { NextRequest, NextResponse } from 'next/server';
import { extractDataFromPDF } from '@/lib/gemini';
import { mapExtractedToDBRow, insertDBRow, ExtractedData } from '@/lib/mappers';

// Force Node.js runtime (pdf-parse requires it)
export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
        }

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            return NextResponse.json({ error: 'Apenas arquivos PDF são aceitos.' }, { status: 400 });
        }

        // 1. Read file buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. We skip pdf-parse text extraction because many offshore PDFs are scanned images.
        // Instead, we pass the raw PDF buffer directly to Gemini 2.5 Pro multimodal capabilities.

        // 3. Extract structured data with Gemini Multimodal API
        let extractedData: ExtractedData;
        try {
            extractedData = await extractDataFromPDF(buffer) as ExtractedData;
        } catch (err) {
            return NextResponse.json(
                { error: `Falha na extração com Gemini: ${err instanceof Error ? err.message : 'erro desconhecido'}` },
                { status: 500 }
            );
        }

        // 4. Map to DB row
        const dbRow = mapExtractedToDBRow(extractedData, file.name);

        // 5. Insert into Cloud SQL
        try {
            await insertDBRow(dbRow);
        } catch (err) {
            return NextResponse.json(
                { error: `Falha ao inserir no banco: ${err instanceof Error ? err.message : 'erro desconhecido'}` },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            identificador: dbRow.identificador,
            arquivo: file.name,
            dados: extractedData,
            db_row: {
                identificador: dbRow.identificador,
                sonda: dbRow.sonda,
                poco: dbRow.poco,
                tipo: dbRow.tipo,
                numero: dbRow.numero,
                data_registro: dbRow.data_registro,
            },
        });
    } catch (err) {
        console.error('Upload error:', err);
        return NextResponse.json(
            { error: `Erro inesperado: ${err instanceof Error ? err.message : 'erro desconhecido'}` },
            { status: 500 }
        );
    }
}
