import { Pool } from 'pg';

export interface PostgresConfig {
  host: string;
  port?: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

export interface QueryResult {
  rows: Record<string, unknown>[];
  rowCount: number;
  columns: string[];
  executionMs: number;
}

function isSafeSelect(sql: string): boolean {
  const trimmed = sql.trim().replace(/;+\s*$/, '');
  if (!/^\s*(select|with)\b/i.test(trimmed)) return false;
  const forbidden = /\b(insert|update|delete|drop|alter|truncate|grant|revoke|create|copy)\b/i;
  if (forbidden.test(trimmed)) return false;
  if (/;/.test(trimmed)) return false;
  return true;
}

export async function runPostgresQuery(
  config: PostgresConfig,
  queryText: string,
  timeoutMs = 10_000,
  maxRows = 10_000,
): Promise<QueryResult> {
  if (!isSafeSelect(queryText)) {
    throw new Error('Only single-statement SELECT/WITH queries are allowed');
  }
  const pool = new Pool({
    host: config.host,
    port: config.port || 5432,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: timeoutMs,
    statement_timeout: timeoutMs,
    max: 1,
  });

  const started = Date.now();
  try {
    const limitedSql = `SELECT * FROM (${queryText.replace(/;+\s*$/, '')}) _q LIMIT ${maxRows}`;
    const result = await pool.query(limitedSql);
    return {
      rows: result.rows,
      rowCount: result.rowCount || result.rows.length,
      columns: result.fields.map((f) => f.name),
      executionMs: Date.now() - started,
    };
  } finally {
    await pool.end().catch(() => {});
  }
}
