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
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : undefined,
});

export async function runPostgresQuery(
  config: PostgresConfig,
  queryText: string,
  params: unknown[] = [],
  timeoutMs = 10_000,
  maxRows = 10_000,
): Promise<QueryResult> {
  pool.options = {
    host: config.host,
    port: config.port || 5432,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl ? { rejectUnauthorized: true } : undefined,
    connectionTimeoutMillis: timeoutMs,
    statement_timeout: timeoutMs,
    max: 1,
  };

  const started = Date.now();
  try {
    const limitedSql = `SELECT * FROM (${queryText.replace(/;+\s*$/, '')}) _q LIMIT $1`;
    const result = await pool.query(limitedSql, [...params, maxRows]);
    return {
      rows: result.rows,
      rowCount: result.rowCount || result.rows.length,
      columns: result.fields.map((f) => f.name),
      executionMs: Date.now() - started,
    };
  } finally {
    // No longer call pool.end() here to avoid closing the pool
  }
}

export async function insertQuery(
  workspaceId: string,
  connectorId: string | null,
  queryText: string,
  type: string | null,
  cacheTtl: number | null,
): Promise<{ id: number; connector_id: string | null; query_text: string; type: string | null; cache_ttl: number; created_at: Date }> {
  const result = await pool.query(`INSERT INTO queries (workspace_id, connector_id, query_text, type, cache_ttl) VALUES ($1, $2, $3, $4, $5) RETURNING id, connector_id, query_text, type, cache_ttl, created_at`, [workspaceId, connectorId || null, queryText.trim(), type || 'sql', cacheTtl ?? 300]);
  return result.rows[0];
}