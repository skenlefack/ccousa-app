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

pool.on('connect', () => {
  logger.debug('Nouvelle connexion à la base de données');
});

pool.on('error', (err) => {
  logger.error('Erreur inattendue sur le client PostgreSQL:', err);
});

export const query = async (text: string, params?: unknown[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Requête exécutée en ${duration}ms: ${text.substring(0, 100)}...`);
    return result;
  } catch (error) {
    logger.error('Erreur lors de l\'exécution de la requête:', error);
    throw error;
  }
};

export const checkConnection = async (): Promise<boolean> => {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
};

export default { pool, query, checkConnection };
