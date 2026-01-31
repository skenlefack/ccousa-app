import { Pool } from 'pg';
import config from '../config';
import logger from './logger';

export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => logger.error('Erreur PostgreSQL:', err));

export const query = async (text: string, params?: unknown[]) => pool.query(text, params);
export const checkConnection = async (): Promise<boolean> => {
  try { await pool.query('SELECT 1'); return true; } catch { return false; }
};

export default { pool, query, checkConnection };
