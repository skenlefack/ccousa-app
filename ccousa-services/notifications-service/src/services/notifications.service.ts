import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../utils/database';
import config from '../config';
import logger from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: { user: config.smtp.user, pass: config.smtp.password },
});

export interface NotificationQueryParams {
  page?: number;
  pageSize?: number;
  type?: string;
  category?: string;
  priority?: string;
  isRead?: boolean;
  isArchived?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface CreateNotificationData {
  userId?: string;
  userIds?: string[];
  type: string;
  category: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  link?: string;
  priority?: string;
  expiresAt?: string;
}

export interface PreferencesData {
  channels?: {
    email: boolean;
    push: boolean;
    inApp: boolean;
    sms: boolean;
  };
  categories?: Record<string, {
    enabled: boolean;
    channels: string[];
  }>;
  quietHours?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
  digest?: {
    enabled: boolean;
    frequency: string;
    time: string;
  };
}

export class NotificationsService {
  // ===========================================
  // Notifications CRUD
  // ===========================================

  async getNotifications(userId: string, params: NotificationQueryParams = {}) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE user_id = $1';
    const queryParams: unknown[] = [userId];
    let paramIndex = 2;

    if (params.type) {
      whereClause += ` AND type = $${paramIndex++}`;
      queryParams.push(params.type);
    }
    if (params.category) {
      whereClause += ` AND category = $${paramIndex++}`;
      queryParams.push(params.category);
    }
    if (params.priority) {
      whereClause += ` AND priority = $${paramIndex++}`;
      queryParams.push(params.priority);
    }
    if (params.isRead !== undefined) {
      whereClause += ` AND is_read = $${paramIndex++}`;
      queryParams.push(params.isRead);
    }
    if (params.isArchived !== undefined) {
      whereClause += ` AND is_archived = $${paramIndex++}`;
      queryParams.push(params.isArchived);
    } else {
      whereClause += ' AND is_archived = false';
    }
    if (params.startDate) {
      whereClause += ` AND created_at >= $${paramIndex++}`;
      queryParams.push(params.startDate);
    }
    if (params.endDate) {
      whereClause += ` AND created_at <= $${paramIndex++}`;
      queryParams.push(params.endDate);
    }

    const [notificationsResult, countResult] = await Promise.all([
      query(
        `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        [...queryParams, pageSize, offset]
      ),
      query(`SELECT COUNT(*) FROM notifications ${whereClause}`, queryParams),
    ]);

    const total = parseInt(countResult.rows[0]?.count) || 0;

    return {
      notifications: notificationsResult.rows.map(this.transformNotification),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getNotificationById(id: string, userId: string) {
    const result = await query(
      'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) return null;
    return this.transformNotification(result.rows[0]);
  }

  async getUnreadCount(userId: string) {
    const result = await query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false AND is_archived = false',
      [userId]
    );
    return { count: parseInt(result.rows[0]?.count) || 0 };
  }

  async getStats(userId: string) {
    const [totalResult, unreadResult, byCategoryResult, byPriorityResult, recentResult] = await Promise.all([
      query('SELECT COUNT(*) FROM notifications WHERE user_id = $1', [userId]),
      query('SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false', [userId]),
      query('SELECT category, COUNT(*) as count FROM notifications WHERE user_id = $1 GROUP BY category', [userId]),
      query('SELECT priority, COUNT(*) as count FROM notifications WHERE user_id = $1 GROUP BY priority', [userId]),
      query('SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND created_at > NOW() - INTERVAL \'24 hours\'', [userId]),
    ]);

    const byCategory: Record<string, number> = {};
    byCategoryResult.rows.forEach((row: { category: string; count: string }) => {
      byCategory[row.category] = parseInt(row.count);
    });

    const byPriority: Record<string, number> = {};
    byPriorityResult.rows.forEach((row: { priority: string; count: string }) => {
      byPriority[row.priority] = parseInt(row.count);
    });

    return {
      total: parseInt(totalResult.rows[0]?.count) || 0,
      unread: parseInt(unreadResult.rows[0]?.count) || 0,
      byCategory,
      byPriority,
      recentCount: parseInt(recentResult.rows[0]?.count) || 0,
    };
  }

  async createNotification(data: CreateNotificationData) {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO notifications (id, user_id, type, category, title, message, data, link, priority, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING *`,
      [
        id,
        data.userId,
        data.type,
        data.category || 'system',
        data.title,
        data.message,
        JSON.stringify(data.data || {}),
        data.link,
        data.priority || 'medium',
        data.expiresAt,
      ]
    );

    logger.info(`Notification created for user ${data.userId}: ${data.title}`);
    return this.transformNotification(result.rows[0]);
  }

  async broadcast(data: CreateNotificationData) {
    if (!data.userIds || data.userIds.length === 0) {
      throw new Error('No user IDs provided for broadcast');
    }

    const notifications = await Promise.all(
      data.userIds.map(userId =>
        this.createNotification({ ...data, userId })
      )
    );

    logger.info(`Broadcast sent to ${notifications.length} users: ${data.title}`);
    return { count: notifications.length };
  }

  async markAsRead(id: string, userId: string) {
    const result = await query(
      'UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('NOTIFICATION_NOT_FOUND');
    }

    return this.transformNotification(result.rows[0]);
  }

  async markAsUnread(id: string, userId: string) {
    const result = await query(
      'UPDATE notifications SET is_read = false, read_at = NULL WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('NOTIFICATION_NOT_FOUND');
    }

    return this.transformNotification(result.rows[0]);
  }

  async markAllAsRead(userId: string, category?: string) {
    let queryText = 'UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false';
    const queryParams: unknown[] = [userId];

    if (category) {
      queryText += ' AND category = $2';
      queryParams.push(category);
    }

    const result = await query(queryText, queryParams);
    return { count: result.rowCount || 0 };
  }

  async archive(id: string, userId: string) {
    const result = await query(
      'UPDATE notifications SET is_archived = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('NOTIFICATION_NOT_FOUND');
    }

    return this.transformNotification(result.rows[0]);
  }

  async unarchive(id: string, userId: string) {
    const result = await query(
      'UPDATE notifications SET is_archived = false WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('NOTIFICATION_NOT_FOUND');
    }

    return this.transformNotification(result.rows[0]);
  }

  async deleteNotification(id: string, userId: string) {
    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('NOTIFICATION_NOT_FOUND');
    }

    return { id };
  }

  async deleteAllRead(userId: string) {
    const result = await query(
      'DELETE FROM notifications WHERE user_id = $1 AND is_read = true',
      [userId]
    );

    return { count: result.rowCount || 0 };
  }

  // ===========================================
  // Preferences
  // ===========================================

  async getPreferences(userId: string) {
    const result = await query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Return default preferences
      return this.getDefaultPreferences(userId);
    }

    return this.transformPreferences(result.rows[0]);
  }

  async updatePreferences(userId: string, data: PreferencesData) {
    // Check if preferences exist
    const existing = await query(
      'SELECT id FROM notification_preferences WHERE user_id = $1',
      [userId]
    );

    let result;
    if (existing.rows.length === 0) {
      // Create new preferences
      result = await query(
        `INSERT INTO notification_preferences (id, user_id, channels, categories, quiet_hours, digest, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [
          uuidv4(),
          userId,
          JSON.stringify(data.channels || this.getDefaultChannels()),
          JSON.stringify(data.categories || this.getDefaultCategories()),
          JSON.stringify(data.quietHours || this.getDefaultQuietHours()),
          JSON.stringify(data.digest || this.getDefaultDigest()),
        ]
      );
    } else {
      // Update existing preferences
      const updates: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      if (data.channels) {
        updates.push(`channels = $${paramIndex++}`);
        values.push(JSON.stringify(data.channels));
      }
      if (data.categories) {
        updates.push(`categories = $${paramIndex++}`);
        values.push(JSON.stringify(data.categories));
      }
      if (data.quietHours) {
        updates.push(`quiet_hours = $${paramIndex++}`);
        values.push(JSON.stringify(data.quietHours));
      }
      if (data.digest) {
        updates.push(`digest = $${paramIndex++}`);
        values.push(JSON.stringify(data.digest));
      }

      updates.push('updated_at = NOW()');
      values.push(userId);

      result = await query(
        `UPDATE notification_preferences SET ${updates.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
        values
      );
    }

    return this.transformPreferences(result.rows[0]);
  }

  async updateChannels(userId: string, channels: PreferencesData['channels']) {
    return this.updatePreferences(userId, { channels });
  }

  async updateCategory(userId: string, category: string, settings: { enabled: boolean; channels: string[] }) {
    const current = await this.getPreferences(userId);
    const categories = { ...current.categories, [category]: settings };
    return this.updatePreferences(userId, { categories });
  }

  async updateQuietHours(userId: string, quietHours: PreferencesData['quietHours']) {
    return this.updatePreferences(userId, { quietHours });
  }

  async updateDigest(userId: string, digest: PreferencesData['digest']) {
    return this.updatePreferences(userId, { digest });
  }

  async resetPreferences(userId: string) {
    await query('DELETE FROM notification_preferences WHERE user_id = $1', [userId]);
    return this.getDefaultPreferences(userId);
  }

  // ===========================================
  // Email
  // ===========================================

  async sendEmail(to: string, subject: string, html: string) {
    try {
      await transporter.sendMail({
        from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
        to,
        subject,
        html,
      });
      logger.info(`Email sent to ${to}: ${subject}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error sending email to ${to}:`, error);
      throw new Error('EMAIL_SEND_FAILED');
    }
  }

  async testNotification(userId: string, channel: 'email' | 'push' | 'sms') {
    // In a real implementation, this would send a test notification via the specified channel
    logger.info(`Test notification sent via ${channel} for user ${userId}`);
    return { sent: true };
  }

  // ===========================================
  // Helper Methods
  // ===========================================

  private transformNotification(data: Record<string, unknown>) {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      category: data.category || 'system',
      title: data.title,
      message: data.message,
      data: typeof data.data === 'string' ? JSON.parse(data.data) : data.data,
      link: data.link,
      icon: data.icon,
      priority: data.priority || 'medium',
      isRead: data.is_read ?? false,
      isArchived: data.is_archived ?? false,
      readAt: data.read_at,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
    };
  }

  private transformPreferences(data: Record<string, unknown>) {
    return {
      id: data.id,
      userId: data.user_id,
      channels: typeof data.channels === 'string' ? JSON.parse(data.channels) : data.channels,
      categories: typeof data.categories === 'string' ? JSON.parse(data.categories) : data.categories,
      quietHours: typeof data.quiet_hours === 'string' ? JSON.parse(data.quiet_hours) : data.quiet_hours,
      digest: typeof data.digest === 'string' ? JSON.parse(data.digest) : data.digest,
      updatedAt: data.updated_at,
    };
  }

  private getDefaultPreferences(userId: string) {
    return {
      id: '',
      userId,
      channels: this.getDefaultChannels(),
      categories: this.getDefaultCategories(),
      quietHours: this.getDefaultQuietHours(),
      digest: this.getDefaultDigest(),
      updatedAt: new Date().toISOString(),
    };
  }

  private getDefaultChannels() {
    return { email: true, push: true, inApp: true, sms: false };
  }

  private getDefaultCategories() {
    return {
      system: { enabled: true, channels: ['inApp', 'email'] },
      events: { enabled: true, channels: ['inApp', 'email', 'push'] },
      procedures: { enabled: true, channels: ['inApp', 'email'] },
      forms: { enabled: true, channels: ['inApp'] },
      knowledge: { enabled: true, channels: ['inApp'] },
      users: { enabled: true, channels: ['inApp', 'email'] },
      reports: { enabled: true, channels: ['email'] },
      security: { enabled: true, channels: ['inApp', 'email', 'push'] },
    };
  }

  private getDefaultQuietHours() {
    return {
      enabled: false,
      startTime: '22:00',
      endTime: '07:00',
      timezone: 'Africa/Douala',
    };
  }

  private getDefaultDigest() {
    return {
      enabled: false,
      frequency: 'daily',
      time: '09:00',
    };
  }
}

export default new NotificationsService();
