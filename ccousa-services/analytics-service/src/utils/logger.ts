import winston from 'winston';
import config from '../config';

export const logger = winston.createLogger({
  level: config.nodeEnv === 'development' ? 'debug' : 'warn',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf((info) => `${info.timestamp} [ANALYTICS-SERVICE] ${info.level}: ${info.message}`),
  ),
  transports: [new winston.transports.Console()],
});
export default logger;
