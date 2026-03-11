import postgres from 'postgres';

// postgres.js: pure ESM, no native deps, Turbopack-compatible
// Replaces `pg` which has native bindings incompatible with Next.js 16 Turbopack

let sql: ReturnType<typeof postgres> | null = null;

function createClient() {
  if (process.env.DATABASE_URL) {
    return postgres(process.env.DATABASE_URL, {
      ssl: 'require',
      max: 5,
      idle_timeout: 30,
      connect_timeout: 10,
    });
  }

  return postgres({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idle_timeout: 30,
    connect_timeout: 10,
  });
}

export function getSql(): ReturnType<typeof postgres> {
  if (!sql) {
    sql = createClient();
  }
  return sql;
}

// Compatibility: generic query interface used by mappers.ts
export async function query(text: string, params?: unknown[]) {
  const client = getSql();
  // postgres.js uses tagged template literals, but supports raw query via unsafe()
  const result = await client.unsafe(text, (params ?? []) as postgres.ParameterOrFragment<any>[]);
  // Mimic pg's result shape
  return { rows: result as any[], rowCount: (result as any[]).length };
}
