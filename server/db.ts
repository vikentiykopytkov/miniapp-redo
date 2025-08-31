import { Pool, QueryResult, QueryResultRow } from 'pg';
import fs from 'fs';
import path from 'path';

const POSTGRES_URL =
  process.env.POSTGRES_URL || 'postgres://roulette:roulette@localhost:5432/roulette';

export const pool = new Pool({ connectionString: POSTGRES_URL });

export async function migrate() {
  // В dist __dirname указывает на server/dist, поэтому ../migrations верно
  const sqlPath = path.resolve(__dirname, '../migrations/001_init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  await pool.query(sql);
}

// Возвращаем типы pg и ограничиваем T как QueryResultRow, как требует типизация pg
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}
