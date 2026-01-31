import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Environnement
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8000', 10),

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here_minimum_32_chars',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },

  // Services URLs
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    users: process.env.USERS_SERVICE_URL || 'http://localhost:3002',
    events: process.env.EVENTS_SERVICE_URL || 'http://localhost:3003',
    procedures: process.env.PROCEDURES_SERVICE_URL || 'http://localhost:3004',
    knowledge: process.env.KNOWLEDGE_SERVICE_URL || 'http://localhost:3005',
    notifications: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3006',
    config: process.env.CONFIG_SERVICE_URL || 'http://localhost:3007',
    forms: process.env.FORMS_SERVICE_URL || 'http://localhost:3008',
    analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3009',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  },
};

export default config;
