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
  if (/--|\/\*/.test(trimmed)) return false; // disallow comments in SQL
  return true;
}

const pool = new Pool({
  // You can pass in the PostgresConfig directly if needed
  host: '',  // Initial placeholder, you may set this during app initialization
  port: 5432,
  database: '',
  user: '',
  password: '',
  ssl: undefined,
  connectionTimeoutMillis: 10000,
  statement_timeout: 10000,
  max: 1,
});

export async function runPostgresQuery(
  config: PostgresConfig,
  queryText: string,
  params: unknown[] = [],
  timeoutMs = 10_000,
  maxRows = 10_000,
): Promise<QueryResult> {
  if (!isSafeSelect(queryText)) {
    throw new Error('Only single-statement SELECT/WITH queries are allowed');
  }

  pool.options.host = config.host;
  pool.options.port = config.port || 5432;
  pool.options.database = config.database;
  pool.options.user = config.user;
  pool.options.password = config.password;
  pool.options.ssl = config.ssl ? { rejectUnauthorized: false } : undefined;

  const started = Date.now();
  try {
    const limitedSql = `SELECT * FROM (${queryText.replace(/;+\s*$/, '')}) _q LIMIT ${maxRows}`;
    const result = await pool.query(limitedSql, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount || result.rows.length,
      columns: result.fields.map((f) => f.name),
      executionMs: Date.now() - started,
    };
  } catch (error) {
    throw error;
  }
}