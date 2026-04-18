import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
});

pool.on('error', (err) => console.error('[db] unexpected client error', err));

// ─── Query helpers ───────────────────────────────────────────

export async function query(sql: string, params?: any[]): Promise<QueryResult> {
  return pool.query(sql, params);
}

export async function getOne<T = Record<string, any>>(sql: string, params?: any[]): Promise<T | null> {
  const result = await pool.query(sql, params);
  return (result.rows[0] ?? null) as T | null;
}

export async function getMany<T = Record<string, any>>(sql: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(sql, params);
  return result.rows as T[];
}

export async function insert<T = Record<string, any>>(table: string, data: Record<string, any>): Promise<T> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const cols = keys.join(', ');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const result = await pool.query(
    `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING *`,
    values
  );
  return result.rows[0] as T;
}

export async function update<T = Record<string, any>>(table: string, id: string, data: Record<string, any>): Promise<T | null> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const result = await pool.query(
    `UPDATE ${table} SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
    [...values, id]
  );
  return (result.rows[0] ?? null) as T | null;
}

export async function deleteById(table: string, id: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

// ─── Transaction helpers ─────────────────────────────────────

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
