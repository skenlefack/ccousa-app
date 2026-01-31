import dotenv from 'dotenv';
dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3003', 10),
  serviceName: 'events-service',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'ccousa_db',
    user: process.env.DB_USER || 'ccousa_user',
    password: process.env.DB_PASSWORD || 'ccousa_password_2025',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://admin:rabbitmq_password_2025@localhost:5672/ccousa',
  },

  uploads: {
    path: process.env.UPLOADS_PATH || './uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10),
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  },
};

export default config;
