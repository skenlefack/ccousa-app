import { Router, Request, Response } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import config from '../config';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware';
import logger from '../utils/logger';

const router = Router();

// Options de proxy communes
const createProxyOptions = (target: string, serviceName: string): Options => ({
  target,
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  pathRewrite: {
    [`^/api/${serviceName}`]: '',
  },
  onError: (err, req, res) => {
    logger.error(`Erreur proxy vers ${serviceName}:`, err);
    (res as Response).status(503).json({
      success: false,
      message: `Service ${serviceName} indisponible`,
      code: 'SERVICE_UNAVAILABLE',
    });
  },
  onProxyReq: (proxyReq, req) => {
    // Transférer les informations utilisateur si authentifié
    const authReq = req as Request & { user?: object; body?: unknown };
    if (authReq.user) {
      proxyReq.setHeader('X-User-Info', JSON.stringify(authReq.user));
    }
    proxyReq.setHeader('X-Request-ID', req.headers['x-request-id'] || '');

    // Re-stream le body si déjà parsé par express.json()
    if (authReq.body && Object.keys(authReq.body as object).length > 0) {
      const bodyData = JSON.stringify(authReq.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
});

// ============================================
// ROUTES PUBLIQUES (sans authentification)
// ============================================

// Auth Service - Routes protégées (change-password, me, logout)
router.use(
  '/api/auth/change-password',
  authMiddleware,
  createProxyMiddleware(createProxyOptions(config.services.auth, 'auth'))
);

router.use(
  '/api/auth/me',
  authMiddleware,
  createProxyMiddleware(createProxyOptions(config.services.auth, 'auth'))
);

router.use(
  '/api/auth/logout',
  authMiddleware,
  createProxyMiddleware(createProxyOptions(config.services.auth, 'auth'))
);

// Auth Service - Routes publiques (login, refresh-token)
router.use(
  '/api/auth',
  authRateLimiter,
  createProxyMiddleware(createProxyOptions(config.services.auth, 'auth'))
);

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API Gateway opérationnel',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================
// ROUTES PROTÉGÉES (avec authentification)
// ============================================

// Users Service
router.use(
  '/api/users',
  authMiddleware,
  createProxyMiddleware(createProxyOptions(config.services.users, 'users'))
);

// Events Service
router.use(
  '/api/events',
  authMiddleware,
  createProxyMiddleware(createProxyOptions(config.services.events, 'events'))
);

// Procedures Service
router.use(
  '/api/procedures',
  authMiddleware,
  createProxyMiddleware(createProxyOptions(config.services.procedures, 'procedures'))
);

// Knowledge Service
router.use(
  '/api/knowledge',
  authMiddleware,
  createProxyMiddleware(createProxyOptions(config.services.knowledge, 'knowledge'))
);

// Notifications Service
router.use(
  '/api/notifications',
  authMiddleware,
  createProxyMiddleware(createProxyOptions(config.services.notifications, 'notifications'))
);

// Config Service
router.use(
  '/api/config',
  authMiddleware,
  createProxyMiddleware(createProxyOptions(config.services.config, 'config'))
);

// Forms Service
router.use(
  '/api/forms',
  authMiddleware,
  createProxyMiddleware(createProxyOptions(config.services.forms, 'forms'))
);

// Analytics Service
router.use(
  '/api/analytics',
  authMiddleware,
  createProxyMiddleware(createProxyOptions(config.services.analytics, 'analytics'))
);

// ============================================
// ROUTE 404
// ============================================
router.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    code: 'NOT_FOUND',
    path: req.originalUrl,
  });
});

export default router;
