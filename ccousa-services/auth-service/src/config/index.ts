import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  serviceName: 'auth-service',

  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'ccousa_db',
    user: process.env.DB_USER || 'ccousa_user',
    password: process.env.DB_PASSWORD || 'ccousa_password_2025',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },

  // RabbitMQ
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://admin:rabbitmq_password_2025@localhost:5672/ccousa',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here_minimum_32_chars',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key_here',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Bcrypt
  bcrypt: {
    saltRounds: 12,
  },
};

export default config;
