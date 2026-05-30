import { Pool } from 'pg';
import { config } from 'dotenv';

config();

if (!/^(postgres:\/\/)/.test(process.env.DATABASE_URL)) { 
    throw new Error("Invalid DATABASE_URL"); 
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });