import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import config from './config';
import routes from './routes';
import logger from './utils/logger';
import { checkConnection } from './utils/database';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: (message: string) => logger.http(message.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(routes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route non trouvée', code: 'NOT_FOUND' });
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Erreur non gérée:', err);
  res.status(500).json({ success: false, message: 'Erreur interne', code: 'INTERNAL_SERVER_ERROR' });
});

const startServer = async () => {
  const dbConnected = await checkConnection();
  app.listen(config.port, () => {
    logger.info(`========================================`);
    logger.info(`  CCOUSA Events Service`);
    logger.info(`  Environment: ${config.nodeEnv}`);
    logger.info(`  Port: ${config.port}`);
    logger.info(`  Database: ${dbConnected ? 'Connecté' : 'Non connecté'}`);
    logger.info(`========================================`);
  });
};

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

startServer();

export default app;
