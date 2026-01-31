import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';

import config from './config';
import routes from './routes';
import { globalRateLimiter } from './middlewares/rateLimiter.middleware';
import logger from './utils/logger';

const app = express();

// ============================================
// MIDDLEWARES GLOBAUX
// ============================================

// Sécurité
app.use(helmet());

// CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// Request ID
app.use((req: Request, res: Response, next: NextFunction) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.headers['x-request-id']);
  next();
});

// Logging HTTP
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.http(message.trim()),
  },
}));

// Rate limiting global
app.use(globalRateLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// ROUTES
// ============================================
app.use(routes);

// ============================================
// GESTION DES ERREURS
// ============================================
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Erreur non gérée:', err);

  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    code: 'INTERNAL_SERVER_ERROR',
    ...(config.nodeEnv === 'development' && { error: err.message }),
  });
});

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================
const startServer = async () => {
  try {
    app.listen(config.port, () => {
      logger.info(`========================================`);
      logger.info(`  CCOUSA API Gateway`);
      logger.info(`  Environment: ${config.nodeEnv}`);
      logger.info(`  Port: ${config.port}`);
      logger.info(`========================================`);
      logger.info(`Services configurés:`);
      logger.info(`  - Auth:          ${config.services.auth}`);
      logger.info(`  - Users:         ${config.services.users}`);
      logger.info(`  - Events:        ${config.services.events}`);
      logger.info(`  - Procedures:    ${config.services.procedures}`);
      logger.info(`  - Knowledge:     ${config.services.knowledge}`);
      logger.info(`  - Notifications: ${config.services.notifications}`);
      logger.info(`  - Config:        ${config.services.config}`);
      logger.info(`  - Forms:         ${config.services.forms}`);
      logger.info(`  - Analytics:     ${config.services.analytics}`);
      logger.info(`========================================`);
    });
  } catch (error) {
    logger.error('Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
};

// Gestion des signaux de terminaison
process.on('SIGTERM', () => {
  logger.info('Signal SIGTERM reçu, arrêt gracieux...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Signal SIGINT reçu, arrêt gracieux...');
  process.exit(0);
});

startServer();

export default app;
