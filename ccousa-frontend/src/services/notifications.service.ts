/**
 * Notifications Service
 * API services for notifications, preferences, and real-time updates
 */

import api from './api';

// ===========================================
// Types
// ===========================================

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  link?: string;
  icon?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  isArchived: boolean;
  readAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'alert'
  | 'reminder'
  | 'update'
  | 'mention'
  | 'assignment';

export type NotificationCategory =
  | 'system'
  | 'events'
  | 'procedures'
  | 'forms'
  | 'knowledge'
  | 'users'
  | 'reports'
  | 'security';

export interface NotificationPreferences {
  id: string;
  userId: string;
  channels: {
    email: boolean;
    push: boolean;
    inApp: boolean;
    sms: boolean;
  };
  categories: Record<NotificationCategory, {
    enabled: boolean;
    channels: ('email' | 'push' | 'inApp' | 'sms')[];
  }>;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
  digest: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'never';
    time: string;
  };
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byCategory: Record<NotificationCategory, number>;
  byPriority: Record<string, number>;
  recentCount: number;
}

export interface NotificationQueryParams {
  page?: number;
  pageSize?: number;
  type?: NotificationType;
  category?: NotificationCategory;
  priority?: string;
  isRead?: boolean;
  isArchived?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface CreateNotificationData {
  userId?: string;
  userIds?: string[];
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  link?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: string;
}

// ===========================================
// API Response Types
// ===========================================

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ===========================================
// Notifications Service
// ===========================================

export const notificationsService = {
  /**
   * Get all notifications with pagination and filters
   */
  async getAll(params: NotificationQueryParams = {}): Promise<PaginatedResponse<Notification>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('limit', params.pageSize.toString());
    if (params.type) queryParams.append('type', params.type);
    if (params.category) queryParams.append('category', params.category);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.isRead !== undefined) queryParams.append('isRead', params.isRead.toString());
    if (params.isArchived !== undefined) queryParams.append('isArchived', params.isArchived.toString());
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const response = await api.get(`/notifications?${queryParams.toString()}`);

    const notifications = response.data.data?.notifications || response.data.notifications || [];
    const pagination = response.data.data?.pagination || response.data.pagination || {
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      total: notifications.length,
      totalPages: 1,
    };

    return {
      success: true,
      data: notifications.map(transformNotification),
      pagination: {
        page: pagination.page,
        pageSize: pagination.limit || pagination.pageSize,
        total: pagination.total,
        totalPages: pagination.totalPages,
      },
    };
  },

  /**
   * Get notification by ID
   */
  async getById(id: string): Promise<ApiResponse<Notification>> {
    const response = await api.get(`/notifications/${id}`);
    return {
      success: true,
      data: transformNotification(response.data.data || response.data),
    };
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    const response = await api.get('/notifications/unread/count');
    return {
      success: true,
      data: response.data.data || { count: 0 },
    };
  },

  /**
   * Get notification statistics
   */
  async getStats(): Promise<ApiResponse<NotificationStats>> {
    const response = await api.get('/notifications/stats');
    return {
      success: true,
      data: response.data.data || response.data,
    };
  },

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    const response = await api.post(`/notifications/${id}/read`);
    return {
      success: true,
      data: transformNotification(response.data.data || response.data),
    };
  },

  /**
   * Mark notification as unread
   */
  async markAsUnread(id: string): Promise<ApiResponse<Notification>> {
    const response = await api.post(`/notifications/${id}/unread`);
    return {
      success: true,
      data: transformNotification(response.data.data || response.data),
    };
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(category?: NotificationCategory): Promise<ApiResponse<{ count: number }>> {
    const url = category
      ? `/notifications/read-all?category=${category}`
      : '/notifications/read-all';
    const response = await api.post(url);
    return {
      success: true,
      data: response.data.data || { count: 0 },
    };
  },

  /**
   * Archive a notification
   */
  async archive(id: string): Promise<ApiResponse<Notification>> {
    const response = await api.post(`/notifications/${id}/archive`);
    return {
      success: true,
      data: transformNotification(response.data.data || response.data),
    };
  },

  /**
   * Unarchive a notification
   */
  async unarchive(id: string): Promise<ApiResponse<Notification>> {
    const response = await api.post(`/notifications/${id}/unarchive`);
    return {
      success: true,
      data: transformNotification(response.data.data || response.data),
    };
  },

  /**
   * Delete a notification
   */
  async delete(id: string): Promise<ApiResponse<{ id: string }>> {
    const response = await api.delete(`/notifications/${id}`);
    return {
      success: true,
      data: response.data.data || { id },
    };
  },

  /**
   * Delete all read notifications
   */
  async deleteAllRead(): Promise<ApiResponse<{ count: number }>> {
    const response = await api.delete('/notifications/read');
    return {
      success: true,
      data: response.data.data || { count: 0 },
    };
  },

  /**
   * Create a notification (admin only)
   */
  async create(data: CreateNotificationData): Promise<ApiResponse<Notification>> {
    const response = await api.post('/notifications', data);
    return {
      success: true,
      data: transformNotification(response.data.data || response.data),
    };
  },

  /**
   * Send notification to multiple users (admin only)
   */
  async broadcast(data: CreateNotificationData): Promise<ApiResponse<{ count: number }>> {
    const response = await api.post('/notifications/broadcast', data);
    return {
      success: true,
      data: response.data.data || { count: 0 },
    };
  },
};

// ===========================================
// Preferences Service
// ===========================================

export const preferencesService = {
  /**
   * Get user's notification preferences
   */
  async get(): Promise<ApiResponse<NotificationPreferences>> {
    const response = await api.get('/notifications/preferences');
    return {
      success: true,
      data: transformPreferences(response.data.data || response.data),
    };
  },

  /**
   * Update notification preferences
   */
  async update(data: Partial<NotificationPreferences>): Promise<ApiResponse<NotificationPreferences>> {
    const response = await api.put('/notifications/preferences', data);
    return {
      success: true,
      data: transformPreferences(response.data.data || response.data),
    };
  },

  /**
   * Update channel preferences
   */
  async updateChannels(channels: NotificationPreferences['channels']): Promise<ApiResponse<NotificationPreferences>> {
    const response = await api.put('/notifications/preferences/channels', { channels });
    return {
      success: true,
      data: transformPreferences(response.data.data || response.data),
    };
  },

  /**
   * Update category preferences
   */
  async updateCategory(
    category: NotificationCategory,
    settings: { enabled: boolean; channels: ('email' | 'push' | 'inApp' | 'sms')[] }
  ): Promise<ApiResponse<NotificationPreferences>> {
    const response = await api.put(`/notifications/preferences/categories/${category}`, settings);
    return {
      success: true,
      data: transformPreferences(response.data.data || response.data),
    };
  },

  /**
   * Update quiet hours settings
   */
  async updateQuietHours(quietHours: NotificationPreferences['quietHours']): Promise<ApiResponse<NotificationPreferences>> {
    const response = await api.put('/notifications/preferences/quiet-hours', quietHours);
    return {
      success: true,
      data: transformPreferences(response.data.data || response.data),
    };
  },

  /**
   * Update digest settings
   */
  async updateDigest(digest: NotificationPreferences['digest']): Promise<ApiResponse<NotificationPreferences>> {
    const response = await api.put('/notifications/preferences/digest', digest);
    return {
      success: true,
      data: transformPreferences(response.data.data || response.data),
    };
  },

  /**
   * Reset preferences to default
   */
  async resetToDefault(): Promise<ApiResponse<NotificationPreferences>> {
    const response = await api.post('/notifications/preferences/reset');
    return {
      success: true,
      data: transformPreferences(response.data.data || response.data),
    };
  },

  /**
   * Test notification delivery
   */
  async testNotification(channel: 'email' | 'push' | 'sms'): Promise<ApiResponse<{ sent: boolean }>> {
    const response = await api.post('/notifications/preferences/test', { channel });
    return {
      success: true,
      data: response.data.data || { sent: true },
    };
  },
};

// ===========================================
// Push Subscription Service
// ===========================================

export const pushService = {
  /**
   * Subscribe to push notifications
   */
  async subscribe(subscription: PushSubscription): Promise<ApiResponse<{ subscribed: boolean }>> {
    const response = await api.post('/notifications/push/subscribe', {
      subscription: subscription.toJSON(),
    });
    return {
      success: true,
      data: response.data.data || { subscribed: true },
    };
  },

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<ApiResponse<{ unsubscribed: boolean }>> {
    const response = await api.post('/notifications/push/unsubscribe');
    return {
      success: true,
      data: response.data.data || { unsubscribed: true },
    };
  },

  /**
   * Get push subscription status
   */
  async getStatus(): Promise<ApiResponse<{ subscribed: boolean; endpoint?: string }>> {
    const response = await api.get('/notifications/push/status');
    return {
      success: true,
      data: response.data.data || { subscribed: false },
    };
  },
};

// ===========================================
// Transform Functions
// ===========================================

function transformNotification(data: Record<string, unknown>): Notification {
  return {
    id: data.id as string,
    userId: data.user_id as string || data.userId as string || '',
    type: data.type as NotificationType || 'info',
    category: data.category as NotificationCategory || 'system',
    title: data.title as string || '',
    message: data.message as string || '',
    data: data.data as Record<string, unknown>,
    link: data.link as string,
    icon: data.icon as string,
    priority: data.priority as Notification['priority'] || 'medium',
    isRead: data.is_read as boolean ?? data.isRead as boolean ?? false,
    isArchived: data.is_archived as boolean ?? data.isArchived as boolean ?? false,
    readAt: data.read_at as string || data.readAt as string,
    expiresAt: data.expires_at as string || data.expiresAt as string,
    createdAt: data.created_at as string || data.createdAt as string || '',
  };
}

function transformPreferences(data: Record<string, unknown>): NotificationPreferences {
  const defaultChannels = { email: true, push: true, inApp: true, sms: false };
  const defaultCategories: NotificationPreferences['categories'] = {
    system: { enabled: true, channels: ['inApp', 'email'] },
    events: { enabled: true, channels: ['inApp', 'email', 'push'] },
    procedures: { enabled: true, channels: ['inApp', 'email'] },
    forms: { enabled: true, channels: ['inApp'] },
    knowledge: { enabled: true, channels: ['inApp'] },
    users: { enabled: true, channels: ['inApp', 'email'] },
    reports: { enabled: true, channels: ['email'] },
    security: { enabled: true, channels: ['inApp', 'email', 'push'] },
  };

  return {
    id: data.id as string || '',
    userId: data.user_id as string || data.userId as string || '',
    channels: (data.channels as NotificationPreferences['channels']) || defaultChannels,
    categories: (data.categories as NotificationPreferences['categories']) || defaultCategories,
    quietHours: (data.quiet_hours as NotificationPreferences['quietHours']) ||
      (data.quietHours as NotificationPreferences['quietHours']) || {
        enabled: false,
        startTime: '22:00',
        endTime: '07:00',
        timezone: 'Africa/Douala',
      },
    digest: (data.digest as NotificationPreferences['digest']) || {
      enabled: false,
      frequency: 'daily',
      time: '09:00',
    },
    updatedAt: data.updated_at as string || data.updatedAt as string || '',
  };
}

export default {
  notifications: notificationsService,
  preferences: preferencesService,
  push: pushService,
};
