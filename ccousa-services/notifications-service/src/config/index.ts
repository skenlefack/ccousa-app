import dotenv from 'dotenv';
dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3006', 10),
  serviceName: 'notifications-service',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'ccousa_db',
    user: process.env.DB_USER || 'ccousa_user',
    password: process.env.DB_PASSWORD || 'ccousa_password_2025',
  },
  redis: { host: process.env.REDIS_HOST || 'localhost', port: 6379, password: process.env.REDIS_PASSWORD || '' },
  rabbitmq: { url: process.env.RABBITMQ_URL || 'amqp://admin:rabbitmq_password_2025@localhost:5672/ccousa' },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    fromName: process.env.SMTP_FROM_NAME || 'CCOUSA-APP',
    fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@ccousa-app.cm',
  },
};
export default config;
