import { Pool } from 'pg';
import config from '../config';

export const pool = new Pool({
  host: config.db.host, port: config.db.port, database: config.db.name,
  user: config.db.user, password: config.db.password, max: 20,
});

export const query = async (text: string, params?: unknown[]) => pool.query(text, params);
export const checkConnection = async (): Promise<boolean> => {
  try { await pool.query('SELECT 1'); return true; } catch { return false; }
};

export default { pool, query, checkConnection };
