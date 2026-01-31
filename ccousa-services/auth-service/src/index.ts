import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import config from './config';
import routes from './routes';
import logger from './utils/logger';
import { checkConnection } from './utils/database';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('combined', {
  stream: { write: (message: string) => logger.http(message.trim()) },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(routes);

// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    code: 'NOT_FOUND',
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Erreur non gérée:', err);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    code: 'INTERNAL_SERVER_ERROR',
  });
});

// Démarrage
const startServer = async () => {
  try {
    // Vérifier la connexion à la base de données
    const dbConnected = await checkConnection();
    if (!dbConnected) {
      logger.warn('Impossible de se connecter à la base de données, démarrage quand même...');
    }

    app.listen(config.port, () => {
      logger.info(`========================================`);
      logger.info(`  CCOUSA Auth Service`);
      logger.info(`  Environment: ${config.nodeEnv}`);
      logger.info(`  Port: ${config.port}`);
      logger.info(`  Database: ${dbConnected ? 'Connecté' : 'Non connecté'}`);
      logger.info(`========================================`);
    });
  } catch (error) {
    logger.error('Erreur au démarrage:', error);
    process.exit(1);
  }
};

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
