import Redis from 'ioredis';
import config from '../config';
import logger from './logger';

export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('Connecté à Redis');
});

redis.on('error', (err) => {
  logger.error('Erreur Redis:', err);
});

export const setToken = async (key: string, value: string, expiresIn: number): Promise<void> => {
  await redis.setex(key, expiresIn, value);
};

export const getToken = async (key: string): Promise<string | null> => {
  return redis.get(key);
};

export const deleteToken = async (key: string): Promise<void> => {
  await redis.del(key);
};

export const blacklistToken = async (token: string, expiresIn: number): Promise<void> => {
  await redis.setex(`blacklist:${token}`, expiresIn, 'true');
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const result = await redis.get(`blacklist:${token}`);
  return result === 'true';
};

export default redis;
