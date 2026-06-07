import { Pool } from 'pg';
import { config } from 'dotenv';

config();

if (!/^(postgres:\/\/)/.test(process.env.DATABASE_URL)) { 
    throw new Error("Invalid DATABASE_URL. It should start with 'postgres://', followed by the username, password, host, port, and database name."); 
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });