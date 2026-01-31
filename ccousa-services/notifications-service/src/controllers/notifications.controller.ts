import { Request, Response } from 'express';
import Joi from 'joi';
import notificationsService from '../services/notifications.service';
import logger from '../utils/logger';

// Validation schemas
const createSchema = Joi.object({
  userId: Joi.string().uuid(),
  userIds: Joi.array().items(Joi.string().uuid()),
  type: Joi.string().valid('info', 'success', 'warning', 'error', 'alert', 'reminder', 'update', 'mention', 'assignment').required(),
  category: Joi.string().valid('system', 'events', 'procedures', 'forms', 'knowledge', 'users', 'reports', 'security').default('system'),
  title: Joi.string().max(200).required(),
  message: Joi.string().max(1000).required(),
  data: Joi.object().optional(),
  link: Joi.string().uri({ relativeOnly: true }).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  expiresAt: Joi.string().isoDate().optional(),
}).or('userId', 'userIds');

const emailSchema = Joi.object({
  to: Joi.string().email().required(),
  subject: Joi.string().max(200).required(),
  html: Joi.string().required(),
});

const preferencesSchema = Joi.object({
  channels: Joi.object({
    email: Joi.boolean(),
    push: Joi.boolean(),
    inApp: Joi.boolean(),
    sms: Joi.boolean(),
  }),
  categories: Joi.object().pattern(
    Joi.string(),
    Joi.object({
      enabled: Joi.boolean().required(),
      channels: Joi.array().items(Joi.string().valid('email', 'push', 'inApp', 'sms')).required(),
    })
  ),
  quietHours: Joi.object({
    enabled: Joi.boolean().required(),
    startTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
    endTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
    timezone: Joi.string().required(),
  }),
  digest: Joi.object({
    enabled: Joi.boolean().required(),
    frequency: Joi.string().valid('daily', 'weekly', 'never').required(),
    time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  }),
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  type: Joi.string(),
  category: Joi.string(),
  priority: Joi.string(),
  isRead: Joi.boolean(),
  isArchived: Joi.boolean(),
  startDate: Joi.string().isoDate(),
  endDate: Joi.string().isoDate(),
});

export class NotificationsController {
  // ===========================================
  // Notifications Endpoints
  // ===========================================

  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : null;
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifie' });
        return;
      }

      const { error, value } = querySchema.validate(req.query);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message });
        return;
      }

      const result = await notificationsService.getNotifications(user.userId, {
        page: value.page,
        pageSize: value.limit,
        type: value.type,
        category: value.category,
        priority: value.priority,
        isRead: value.isRead,
        isArchived: value.isArchived,
        startDate: value.startDate,
        endDate: value.endDate,
      });

      res.json({ success: true, ...result });
    } catch (error) {
      logger.error('Error getting notifications:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getNotificationById(req: Request, res: Response): Promise<void> {
    try {
      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : null;
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifie' });
        return;
      }

      const notification = await notificationsService.getNotificationById(req.params.id, user.userId);
      if (!notification) {
        res.status(404).json({ success: false, message: 'Notification non trouvee' });
        return;
      }

      res.json({ success: true, data: notification });
    } catch (error) {
      logger.error('Error getting notification:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : null;
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifie' });
        return;
      }

      const result = await notificationsService.getUnreadCount(user.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error getting unread count:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : null;
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifie' });
        return;
      }

      const stats = await notificationsService.getStats(user.userId);
      res.json({ success: true, data: stats });
    } catch (error) {
      logger.error('Error getting stats:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async createNotification(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createSchema.validate(req.body);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message });
        return;
      }

      const notification = await notificationsService.createNotification(value);
      res.status(201).json({ success: true, data: notification });
    } catch (error) {
      logger.error('Error creating notification:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async broadcast(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createSchema.validate(req.body);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message });
        return;
      }

      if (!value.userIds) {
        res.status(400).json({ success: false, message: 'userIds is required for broadcast' });
        return;
      }

      const result = await notificationsService.broadcast(value);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error broadcasting:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : null;
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifie' });
        return;
      }

      const notification = await notificationsService.markAsRead(req.params.id, user.userId);
      res.json({ success: true, data: notification });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'NOTIFICATION_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Notification non trouvee' });
        return;
      }
      logger.error('Error marking as read:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async markAsUnread(req: Request, res: Response): Promise<void> {
    try {
      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : null;
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifie' });
        return;
      }

      const notification = await notificationsService.markAsUnread(req.params.id, user.userId);
      res.json({ success: true, data: notification });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'NOTIFICATION_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Notification non trouvee' });
        return;
      }
      logger.error('Error marking as unread:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : null;
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifie' });
        return;
      }

      const category = req.query.category as string | undefined;
      const result = await notificationsService.markAllAsRead(user.userId, category);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error marking all as read:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async archive(req: Request, res: Response): Promise<void> {
    try {
      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : null;
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifie' });
        return;
      }

      const notification = await notificationsService.archive(req.params.id, user.userId);
      res.json({ success: true, data: notification });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'NOTIFICATION_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Notification non trouvee' });
        return;
      }
      logger.error('Error archiving:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async unarchive(req: Request, res: Response): Promise<void> {
    try {
      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : null;
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifie' });
        return;
      }

      const notification = await notificationsService.unarchive(req.params.id, user.userId);
      res.json({ success: true, data: notification });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'NOTIFICATION_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Notification non trouvee' });
        return;
      }
      logger.error('Error unarchiving:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : null;
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifie' });
        return;
      }

      const result = await notificationsService.deleteNotification(req.params.id, user.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'NOTIFICATION_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Notification non trouvee' });
        return;
      }
      logger.error('Error deleting notification:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async deleteAllRead(req: Request, res: Response): Promise<void> {
    try {
      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : null;
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifie' });
        return;
      }

      const result = await notificationsService.deleteAllRead(user.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error deleting all read:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  // ===========================================
  // Preferences Endpoints
  // ===========================================

  async getPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : null;
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifie' });
        return;
      }

      const preferences = await notificationsService.getPreferences(user.userId);
      res.json({ success: true, data: preferences });
    } catch (error) {
      logger.error('Error getting preferences:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async updatePreferences(req: Request, res: Response): Promise<void> {
    try {
      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : null;
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifie' });
        return;
      }

      const { error, value } = preferencesSchema.validate(req.body);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message });
        return;
      }

      const preferences = await notificationsService.updatePreferences(user.userId, value);
      res.json({ success: true, data: preferences });
    } catch (error) {
      logger.error('Error updating preferences:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async updateChannels(req: Request, res: Response): Promise<void> {
    try {
      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : null;
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifie' });
        return;
      }

      const preferences = await notificationsService.updateChannels(user.userId, req.body.channels);
      res.json({ success: true, data: preferences });
    } catch (error) {
      logger.error('Error updating channels:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : null;
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifie' });
        return;
      }

      const category = req.params.category;
      const preferences = await notificationsService.updateCategory(user.userId, category, req.body);
      res.json({ success: true, data: preferences });
    } catch (error) {
      logger.error('Error updating category:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async updateQuietHours(req: Request, res: Response): Promise<void> {
    try {
      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : null;
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifie' });
        return;
      }

      const preferences = await notificationsService.updateQuietHours(user.userId, req.body);
      res.json({ success: true, data: preferences });
    } catch (error) {
      logger.error('Error updating quiet hours:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async updateDigest(req: Request, res: Response): Promise<void> {
    try {
      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : null;
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifie' });
        return;
      }

      const preferences = await notificationsService.updateDigest(user.userId, req.body);
      res.json({ success: true, data: preferences });
    } catch (error) {
      logger.error('Error updating digest:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async resetPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : null;
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifie' });
        return;
      }

      const preferences = await notificationsService.resetPreferences(user.userId);
      res.json({ success: true, data: preferences });
    } catch (error) {
      logger.error('Error resetting preferences:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  async testNotification(req: Request, res: Response): Promise<void> {
    try {
      const userInfo = req.headers['x-user-info'];
      const user = userInfo ? JSON.parse(userInfo as string) : null;
      if (!user) {
        res.status(401).json({ success: false, message: 'Non authentifie' });
        return;
      }

      const channel = req.body.channel as 'email' | 'push' | 'sms';
      const result = await notificationsService.testNotification(user.userId, channel);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error testing notification:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }

  // ===========================================
  // Email Endpoint
  // ===========================================

  async sendEmail(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = emailSchema.validate(req.body);
      if (error) {
        res.status(400).json({ success: false, message: error.details[0].message });
        return;
      }

      await notificationsService.sendEmail(value.to, value.subject, value.html);
      res.json({ success: true, message: 'Email envoye' });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'EMAIL_SEND_FAILED') {
        res.status(500).json({ success: false, message: 'Echec de l\'envoi de l\'email' });
        return;
      }
      logger.error('Error sending email:', error);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }
}

export default new NotificationsController();
