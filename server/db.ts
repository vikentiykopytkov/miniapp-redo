import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';


const POSTGRES_URL = process.env.POSTGRES_URL || 'postgres://roulette:roulette@localhost:5432/roulette';
export const pool = new Pool({ connectionString: POSTGRES_URL });


export async function migrate() {
const sqlPath = path.resolve(__dirname, '../migrations/001_init.sql');
const sql = fs.readFileSync(sqlPath, 'utf-8');
await pool.query(sql);
}


export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }>{
return pool.query(text, params);
}