import winston from 'winston';
import config from '../config';

export const logger = winston.createLogger({
  level: config.nodeEnv === 'development' ? 'debug' : 'warn',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf((info) => `${info.timestamp} [EVENTS-SERVICE] ${info.level}: ${info.message}`),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/all.log' }),
  ],
});

export default logger;
