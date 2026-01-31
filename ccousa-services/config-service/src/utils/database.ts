import { Pool } from 'pg';
import config from '../config';

export const pool = new Pool({ ...config.db, database: config.db.name, max: 20 });
export const query = async (text: string, params?: unknown[]) => pool.query(text, params);
export const checkConnection = async () => { try { await pool.query('SELECT 1'); return true; } catch { return false; } };
export default { pool, query, checkConnection };
