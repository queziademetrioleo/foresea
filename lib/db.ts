import { Pool, PoolConfig } from 'pg';

// Prevent pg from trying to load pg-native (not available in Cloud Functions)
// This avoids the ERR_MODULE_NOT_FOUND for pg-native
process.env.NODE_PG_FORCE_NATIVE = '0';

let pool: Pool | null = null;

function buildConfig(): PoolConfig {
  // Support both individual vars and DATABASE_URL
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  }

  return {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: { rejectUnauthorized: false },
    max: 5,                       // Lower for serverless environments
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(buildConfig());

    // Log connection errors without crashing
    pool.on('error', (err) => {
      console.error('[DB] Unexpected pool error:', err.message);
      pool = null; // Force reconnect on next call
    });
  }
  return pool;
}

export async function query(text: string, params?: unknown[]) {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (err) {
    console.error('[DB] Query error:', err);
    throw err;
  } finally {
    client.release();
  }
}
