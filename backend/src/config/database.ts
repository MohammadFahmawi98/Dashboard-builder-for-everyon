import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable must be set');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
});

pool.on('error', () => console.error('[db] unexpected client error'));

// ─── Query helpers ───────────────────────────────────────────

const validTables = ['table1', 'table2', 'table3']; // List of valid table names
const cache = new Map<string, any>(); // Basic in-memory cache

function isValidTable(table: string): boolean {
  return validTables.includes(table);
}

export async function query<T = QueryResult>(sql: string, params?: T[]): Promise<QueryResult> {
  return pool.query(sql, params);
}

export async function getOne<T = Record<string, any>>(sql: string, params?: any[]): Promise<T | null> {
  const cacheKey = JSON.stringify({ sql, params });
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) as T | null;
  }

  const result = await pool.query(sql, params);
  const row = (result.rows[0] ?? null) as T | null;
  
  if (row) {
    cache.set(cacheKey, row); // Cache the result
  }

  return row;
}

export async function getMany<T = Record<string, any>>(sql: string, params?: any[]): Promise<T[]> {
  const cacheKey = JSON.stringify({ sql, params });
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) as T[];
  }

  const result = await pool.query(sql, params);
  const rows = result.rows as T[];
  
  if (rows.length > 0) {
    cache.set(cacheKey, rows); // Cache the result
  }

  return rows;
}

export async function insert<T = Record<string, any>>(table: string, data: Record<string, any>): Promise<T> {
  if (!isValidTable(table)) {
    throw new Error('Invalid table name');
  }
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
  if (!isValidTable(table)) {
    throw new Error('Invalid table name');
  }
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
  if (!isValidTable(table)) {
    throw new Error('Invalid table name');
  }
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
    console.error(`Transaction failed: ${err.message}`); // Logging the error with additional context
    throw new Error(`Transaction failed: ${err.message}`); // Rethrowing with context
  } finally {
    client.release();
  }
}