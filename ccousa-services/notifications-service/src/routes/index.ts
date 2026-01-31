import { Router, Request, Response } from 'express';
import notificationsController from '../controllers/notifications.controller';
import { checkConnection } from '../utils/database';

const router = Router();

// Health check
router.get('/health', async (req: Request, res: Response) => {
  const db = await checkConnection();
  res.json({
    success: true,
    service: 'notifications-service',
    status: 'healthy',
    checks: { database: db ? 'connected' : 'disconnected' },
  });
});

// ===========================================
// Notifications Routes
// ===========================================

// Get notifications list
router.get('/', (req, res) => notificationsController.getNotifications(req, res));

// Get unread count
router.get('/unread/count', (req, res) => notificationsController.getUnreadCount(req, res));

// Get stats
router.get('/stats', (req, res) => notificationsController.getStats(req, res));

// Mark all as read
router.post('/read-all', (req, res) => notificationsController.markAllAsRead(req, res));

// Delete all read notifications
router.delete('/read', (req, res) => notificationsController.deleteAllRead(req, res));

// Create notification
router.post('/', (req, res) => notificationsController.createNotification(req, res));

// Broadcast notification
router.post('/broadcast', (req, res) => notificationsController.broadcast(req, res));

// Get notification by ID
router.get('/:id', (req, res) => notificationsController.getNotificationById(req, res));

// Mark as read
router.post('/:id/read', (req, res) => notificationsController.markAsRead(req, res));

// Mark as unread
router.post('/:id/unread', (req, res) => notificationsController.markAsUnread(req, res));

// Archive notification
router.post('/:id/archive', (req, res) => notificationsController.archive(req, res));

// Unarchive notification
router.post('/:id/unarchive', (req, res) => notificationsController.unarchive(req, res));

// Delete notification
router.delete('/:id', (req, res) => notificationsController.deleteNotification(req, res));

// ===========================================
// Preferences Routes
// ===========================================

// Get preferences
router.get('/preferences', (req, res) => notificationsController.getPreferences(req, res));

// Update preferences
router.put('/preferences', (req, res) => notificationsController.updatePreferences(req, res));

// Update channel preferences
router.put('/preferences/channels', (req, res) => notificationsController.updateChannels(req, res));

// Update category preferences
router.put('/preferences/categories/:category', (req, res) => notificationsController.updateCategory(req, res));

// Update quiet hours
router.put('/preferences/quiet-hours', (req, res) => notificationsController.updateQuietHours(req, res));

// Update digest settings
router.put('/preferences/digest', (req, res) => notificationsController.updateDigest(req, res));

// Reset preferences
router.post('/preferences/reset', (req, res) => notificationsController.resetPreferences(req, res));

// Test notification
router.post('/preferences/test', (req, res) => notificationsController.testNotification(req, res));

// ===========================================
// Email Route
// ===========================================

router.post('/email', (req, res) => notificationsController.sendEmail(req, res));

export default router;
