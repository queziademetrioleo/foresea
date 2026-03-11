import postgres from 'postgres';

// postgres.js - Pure JS, zero native dependencies.
// Bundling this instead of externalizing it to avoid the hashed-external-module error.

let sql: ReturnType<typeof postgres> | null = null;

function getSql() {
  if (!sql) {
    const config = {
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      ssl: { rejectUnauthorized: false },
      max: 2,
      idle_timeout: 5,
      connect_timeout: 5,
    };
    sql = postgres(config);
  }
  return sql;
}

export async function query(text: string, params?: any[]) {
    const client = getSql();
    try {
        // Map $1, $2, etc to postgres.js ? usage if needed, 
        // but unsafe() allows raw strings with parameters.
        const result = await client.unsafe(text, (params ?? []) as any);
        return { 
          rows: result as any[], 
          rowCount: (result as any[]).length 
        };
    } catch (err) {
        console.error('[DB] Query Error:', err);
        throw err;
    }
}
