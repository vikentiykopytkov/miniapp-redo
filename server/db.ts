import { Pool, QueryResult } from 'pg';
import fs from 'fs';
import path from 'path';

const POSTGRES_URL = process.env.POSTGRES_URL || 'postgres://roulette:roulette@localhost:5432/roulette';
export const pool = new Pool({ connectionString: POSTGRES_URL });

export async function migrate() {
  const sqlPath = path.resolve(__dirname, '../migrations/001_init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  await pool.query(sql);
}

// Универсальная функция, тип возвращаемого значения совпадает с pg.QueryResult<T>
export async function query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}
