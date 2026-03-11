import { Pool } from 'pg';

// Força o uso de JS puro para evitar erros de módulos nativos no ambiente de nuvem
process.env.NODE_PG_FORCE_NATIVE = '0';

let pool: Pool | null = null;

export function getPool(): Pool {
    if (!pool) {
        pool = new Pool({
            host: process.env.DATABASE_HOST,
            port: parseInt(process.env.DATABASE_PORT || '5432'),
            database: process.env.DATABASE_NAME,
            user: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASSWORD,
            ssl: { rejectUnauthorized: false },
            max: 3, // Poucas conexões para não estourar o limite do Cloud SQL em serveless
            idleTimeoutMillis: 10000,
            connectionTimeoutMillis: 5000,
        });

        pool.on('error', (err) => {
            console.error('Erro inesperado no Pool do Banco:', err);
            pool = null; // Reseta o pool para reconectar na próxima tentativa
        });
    }
    return pool;
}

export async function query(text: string, params?: any[]) {
    const client = await getPool().connect();
    try {
        const res = await client.query(text, params);
        return res;
    } finally {
        client.release();
    }
}
