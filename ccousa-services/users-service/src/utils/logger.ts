import winston from 'winston';
import config from '../config';

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [USERS-SERVICE] ${info.level}: ${info.message}`,
  ),
);

export const logger = winston.createLogger({
  level: config.nodeEnv === 'development' ? 'debug' : 'warn',
  format,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/all.log' }),
  ],
});

export default logger;
