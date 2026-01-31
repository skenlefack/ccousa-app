/**
 * Notifications Hooks
 * React Query hooks for notifications, preferences, and real-time updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  notificationsService,
  preferencesService,
  pushService,
  type NotificationQueryParams,
  type CreateNotificationData,
  type NotificationCategory,
  type NotificationPreferences,
} from '../services/notifications.service';

// ===========================================
// Query Keys
// ===========================================

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (params: NotificationQueryParams) => [...notificationKeys.lists(), params] as const,
  details: () => [...notificationKeys.all, 'detail'] as const,
  detail: (id: string) => [...notificationKeys.details(), id] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
  stats: () => [...notificationKeys.all, 'stats'] as const,
};

export const preferencesKeys = {
  all: ['notification-preferences'] as const,
  current: () => [...preferencesKeys.all, 'current'] as const,
};

export const pushKeys = {
  all: ['push-subscription'] as const,
  status: () => [...pushKeys.all, 'status'] as const,
};

// ===========================================
// Notifications Hooks
// ===========================================

/**
 * Get all notifications with pagination and filters
 */
export function useNotifications(params: NotificationQueryParams = {}) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationsService.getAll(params),
    select: (response) => ({
      notifications: response.data,
      pagination: response.pagination,
    }),
  });
}

/**
 * Get notification by ID
 */
export function useNotification(id: string) {
  return useQuery({
    queryKey: notificationKeys.detail(id),
    queryFn: () => notificationsService.getById(id),
    select: (response) => response.data,
    enabled: !!id,
  });
}

/**
 * Get unread notifications count
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationsService.getUnreadCount(),
    select: (response) => response.data.count,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Get notification statistics
 */
export function useNotificationStats() {
  return useQuery({
    queryKey: notificationKeys.stats(),
    queryFn: () => notificationsService.getStats(),
    select: (response) => response.data,
  });
}

/**
 * Mark notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.stats() });
    },
  });
}

/**
 * Mark notification as unread
 */
export function useMarkAsUnread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsUnread(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.stats() });
    },
  });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category?: NotificationCategory) => notificationsService.markAllAsRead(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Archive a notification
 */
export function useArchiveNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsService.archive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
}

/**
 * Unarchive a notification
 */
export function useUnarchiveNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsService.unarchive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
}

/**
 * Delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.stats() });
    },
  });
}

/**
 * Delete all read notifications
 */
export function useDeleteAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsService.deleteAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Create a notification (admin only)
 */
export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNotificationData) => notificationsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

/**
 * Broadcast notification to multiple users (admin only)
 */
export function useBroadcastNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNotificationData) => notificationsService.broadcast(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// ===========================================
// Preferences Hooks
// ===========================================

/**
 * Get notification preferences
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: preferencesKeys.current(),
    queryFn: () => preferencesService.get(),
    select: (response) => response.data,
  });
}

/**
 * Update notification preferences
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<NotificationPreferences>) => preferencesService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: preferencesKeys.current() });
    },
  });
}

/**
 * Update channel preferences
 */
export function useUpdateChannelPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channels: NotificationPreferences['channels']) =>
      preferencesService.updateChannels(channels),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: preferencesKeys.current() });
    },
  });
}

/**
 * Update category preferences
 */
export function useUpdateCategoryPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      category,
      settings,
    }: {
      category: NotificationCategory;
      settings: { enabled: boolean; channels: ('email' | 'push' | 'inApp' | 'sms')[] };
    }) => preferencesService.updateCategory(category, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: preferencesKeys.current() });
    },
  });
}

/**
 * Update quiet hours settings
 */
export function useUpdateQuietHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quietHours: NotificationPreferences['quietHours']) =>
      preferencesService.updateQuietHours(quietHours),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: preferencesKeys.current() });
    },
  });
}

/**
 * Update digest settings
 */
export function useUpdateDigest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (digest: NotificationPreferences['digest']) =>
      preferencesService.updateDigest(digest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: preferencesKeys.current() });
    },
  });
}

/**
 * Reset preferences to default
 */
export function useResetPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => preferencesService.resetToDefault(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: preferencesKeys.current() });
    },
  });
}

/**
 * Test notification delivery
 */
export function useTestNotification() {
  return useMutation({
    mutationFn: (channel: 'email' | 'push' | 'sms') =>
      preferencesService.testNotification(channel),
  });
}

// ===========================================
// Push Subscription Hooks
// ===========================================

/**
 * Get push subscription status
 */
export function usePushStatus() {
  return useQuery({
    queryKey: pushKeys.status(),
    queryFn: () => pushService.getStatus(),
    select: (response) => response.data,
  });
}

/**
 * Subscribe to push notifications
 */
export function useSubscribePush() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subscription: PushSubscription) => pushService.subscribe(subscription),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pushKeys.status() });
    },
  });
}

/**
 * Unsubscribe from push notifications
 */
export function useUnsubscribePush() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => pushService.unsubscribe(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pushKeys.status() });
    },
  });
}
