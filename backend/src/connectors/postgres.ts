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

const pool = new Pool({
  host: '',
  port: 5432,
  database: '',
  user: '',
  password: '',
  ssl: undefined,
  connectionTimeoutMillis: 10000,
  statement_timeout: 10000,
  max: 1,
});

export async function initializePostgresPool(config: PostgresConfig) {
  pool.options = {
    host: config.host,
    port: config.port || 5432,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 10000,
    statement_timeout: 10000,
  };
}

export async function runPostgresQuery(
  queryText: string,
  params: unknown[] = [],
  timeoutMs = 10_000,
  maxRows = 10_000,
): Promise<QueryResult> {
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
    throw new Error(`Error executing query: ${error.message}`);
  }
}