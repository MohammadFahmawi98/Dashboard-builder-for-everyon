import { Pool } from 'pg';
import { config } from 'dotenv';

config();

if (!/^(postgres:\/\/)/.test(process.env.DATABASE_URL)) { 
    throw new Error("Invalid DATABASE_URL. It should start with 'postgres://', followed by the username, password, host, port, and database name."); 
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function insertConnector(workspaceId, name, type, config) {
    const result = await pool.query(`INSERT INTO connectors (workspace_id, name, type, config) VALUES ($1, $2, $3, $4) RETURNING id, name, type, status, created_at`, [workspaceId, name.trim(), type, JSON.stringify(config || {})]);
    return result.rows[0];
}