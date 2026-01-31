import { Router, Request, Response } from 'express';
import authController from '../controllers/auth.controller';
import { checkConnection } from '../utils/database';

const router = Router();

// Health check
router.get('/health', async (req: Request, res: Response) => {
  const dbConnected = await checkConnection();

  res.json({
    success: true,
    service: 'auth-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: dbConnected ? 'connected' : 'disconnected',
    },
  });
});

// Routes d'authentification
router.post('/login', (req, res) => authController.login(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));
router.post('/refresh-token', (req, res) => authController.refreshToken(req, res));
router.post('/change-password', (req, res) => authController.changePassword(req, res));
router.get('/me', (req, res) => authController.me(req, res));

export default router;
