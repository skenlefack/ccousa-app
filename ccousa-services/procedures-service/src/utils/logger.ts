import winston from 'winston';
import config from '../config';

export const logger = winston.createLogger({
  level: config.nodeEnv === 'development' ? 'debug' : 'warn',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf((info) => `${info.timestamp} [PROCEDURES-SERVICE] ${info.level}: ${info.message}`),
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
