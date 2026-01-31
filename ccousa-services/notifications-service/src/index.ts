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
app.use(morgan('combined', { stream: { write: (msg: string) => logger.http(msg.trim()) } }));
app.use(express.json());
app.use(routes);

app.use((req: Request, res: Response) => res.status(404).json({ success: false, message: 'Not found' }));
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({ success: false, message: 'Internal error' });
});

const start = async () => {
  const db = await checkConnection();
  app.listen(config.port, () => logger.info(`Notifications Service | Port: ${config.port} | DB: ${db ? 'OK' : 'NOK'}`));
};

process.on('SIGTERM', () => process.exit(0));
start();

export default app;
