import dotenv from 'dotenv';
dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3008', 10),
  serviceName: 'forms-service',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'ccousa_db',
    user: process.env.DB_USER || 'ccousa_user',
    password: process.env.DB_PASSWORD || 'ccousa_password_2025',
  },
  redis: { host: process.env.REDIS_HOST || 'localhost', port: 6379, password: process.env.REDIS_PASSWORD || '' },
};
export default config;
