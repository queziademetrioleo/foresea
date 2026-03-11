// lib/db.ts
import { Pool } from 'pg';

// Previne erros de módulos nativos
process.env.NODE_PG_FORCE_NATIVE = '0';

// Configuração centralizada
const dbConfig = {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: { rejectUnauthorized: false },
    max: 2, // Mínimo de conexões para evitar overload em serverless
    idleTimeoutMillis: 5000,
};

let pool: Pool | null = null;

export function getPool(): Pool {
    if (!pool) {
        pool = new Pool(dbConfig);
        pool.on('error', (err) => {
            console.error('[DB] Pool Error:', err);
            pool = null;
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
