import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Mail,
  Smartphone,
  Monitor,
  MessageSquare,
  Moon,
  Clock,
  Calendar,
  Users,
  FileText,
  BookOpen,
  ClipboardList,
  Shield,
  BarChart3,
  Settings,
  ArrowLeft,
  Save,
  RotateCcw,
  Send,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, Button, Badge, Spinner } from '../../components/ui';
import { cn } from '../../utils/cn';
import {
  useNotificationPreferences,
  useUpdatePreferences,
  useUpdateChannelPreferences,
  useUpdateCategoryPreferences,
  useUpdateQuietHours,
  useUpdateDigest,
  useResetPreferences,
  useTestNotification,
} from '../../hooks/useNotifications';
import type { NotificationPreferences, NotificationCategory } from '../../services/notifications.service';

interface NotificationsPreferencesPageProps {
  onBack?: () => void;
  onNavigate?: (path: string) => void;
}

// Mock preferences for demo
const mockPreferences: NotificationPreferences = {
  id: '1',
  userId: 'user1',
  channels: {
    email: true,
    push: true,
    inApp: true,
    sms: false,
  },
  categories: {
    system: { enabled: true, channels: ['inApp', 'email'] },
    events: { enabled: true, channels: ['inApp', 'email', 'push'] },
    procedures: { enabled: true, channels: ['inApp', 'email'] },
    forms: { enabled: true, channels: ['inApp'] },
    knowledge: { enabled: true, channels: ['inApp'] },
    users: { enabled: true, channels: ['inApp', 'email'] },
    reports: { enabled: true, channels: ['email'] },
    security: { enabled: true, channels: ['inApp', 'email', 'push'] },
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '07:00',
    timezone: 'Africa/Douala',
  },
  digest: {
    enabled: false,
    frequency: 'daily',
    time: '09:00',
  },
  updatedAt: new Date().toISOString(),
};

const channelConfig = {
  email: { label: 'Email', icon: <Mail className="w-5 h-5" />, description: 'Recevez les notifications par email' },
  push: { label: 'Push', icon: <Smartphone className="w-5 h-5" />, description: 'Notifications sur votre appareil' },
  inApp: { label: 'Application', icon: <Monitor className="w-5 h-5" />, description: 'Notifications dans l\'application' },
  sms: { label: 'SMS', icon: <MessageSquare className="w-5 h-5" />, description: 'Notifications par SMS' },
};

const categoryConfig: Record<NotificationCategory, { label: string; icon: React.ReactNode; description: string }> = {
  system: { label: 'Systeme', icon: <Settings className="w-5 h-5" />, description: 'Mises a jour et maintenance' },
  events: { label: 'Evenements', icon: <Calendar className="w-5 h-5" />, description: 'Alertes et incidents sanitaires' },
  procedures: { label: 'Procedures', icon: <ClipboardList className="w-5 h-5" />, description: 'Taches et assignations' },
  forms: { label: 'Formulaires', icon: <FileText className="w-5 h-5" />, description: 'Soumissions et validations' },
  knowledge: { label: 'Articles', icon: <BookOpen className="w-5 h-5" />, description: 'Nouveaux articles et mentions' },
  users: { label: 'Utilisateurs', icon: <Users className="w-5 h-5" />, description: 'Equipe et collaborations' },
  reports: { label: 'Rapports', icon: <BarChart3 className="w-5 h-5" />, description: 'Rapports generes' },
  security: { label: 'Securite', icon: <Shield className="w-5 h-5" />, description: 'Alertes de securite' },
};

export const NotificationsPreferencesPage: React.FC<NotificationsPreferencesPageProps> = ({
  onBack,
  onNavigate,
}) => {
  const [hasChanges, setHasChanges] = useState(false);
  const [testingChannel, setTestingChannel] = useState<string | null>(null);

  // Queries
  const { data: preferences, isLoading } = useNotificationPreferences();

  // Mutations
  const updateChannelsMutation = useUpdateChannelPreferences();
  const updateCategoryMutation = useUpdateCategoryPreferences();
  const updateQuietHoursMutation = useUpdateQuietHours();
  const updateDigestMutation = useUpdateDigest();
  const resetMutation = useResetPreferences();
  const testMutation = useTestNotification();

  // Use mock data if API not available
  const currentPreferences = preferences || mockPreferences;

  const handleChannelToggle = async (channel: keyof NotificationPreferences['channels']) => {
    const newChannels = {
      ...currentPreferences.channels,
      [channel]: !currentPreferences.channels[channel],
    };
    try {
      await updateChannelsMutation.mutateAsync(newChannels);
      setHasChanges(true);
    } catch (error) {
      console.error('Failed to update channel:', error);
    }
  };

  const handleCategoryToggle = async (category: NotificationCategory) => {
    const currentSettings = currentPreferences.categories[category];
    try {
      await updateCategoryMutation.mutateAsync({
        category,
        settings: {
          enabled: !currentSettings.enabled,
          channels: currentSettings.channels,
        },
      });
      setHasChanges(true);
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleCategoryChannelToggle = async (category: NotificationCategory, channel: 'email' | 'push' | 'inApp' | 'sms') => {
    const currentSettings = currentPreferences.categories[category];
    const newChannels = currentSettings.channels.includes(channel)
      ? currentSettings.channels.filter(c => c !== channel)
      : [...currentSettings.channels, channel];

    try {
      await updateCategoryMutation.mutateAsync({
        category,
        settings: {
          enabled: currentSettings.enabled,
          channels: newChannels,
        },
      });
      setHasChanges(true);
    } catch (error) {
      console.error('Failed to update category channel:', error);
    }
  };

  const handleQuietHoursToggle = async () => {
    try {
      await updateQuietHoursMutation.mutateAsync({
        ...currentPreferences.quietHours,
        enabled: !currentPreferences.quietHours.enabled,
      });
      setHasChanges(true);
    } catch (error) {
      console.error('Failed to update quiet hours:', error);
    }
  };

  const handleDigestToggle = async () => {
    try {
      await updateDigestMutation.mutateAsync({
        ...currentPreferences.digest,
        enabled: !currentPreferences.digest.enabled,
      });
      setHasChanges(true);
    } catch (error) {
      console.error('Failed to update digest:', error);
    }
  };

  const handleReset = async () => {
    try {
      await resetMutation.mutateAsync();
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to reset preferences:', error);
    }
  };

  const handleTestNotification = async (channel: 'email' | 'push' | 'sms') => {
    setTestingChannel(channel);
    try {
      await testMutation.mutateAsync(channel);
    } catch (error) {
      console.error('Failed to send test notification:', error);
    } finally {
      setTestingChannel(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack || (() => onNavigate?.('/notifications'))}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
              Preferences de notifications
            </h1>
            <p className="mt-1 text-dark-500 dark:text-dark-400">
              Configurez comment vous souhaitez etre notifie
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={resetMutation.isPending}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reinitialiser
          </Button>
        </div>
      </div>

      {/* Global Channels */}
      <Card className="p-6">
        <CardHeader
          title="Canaux de notification"
          subtitle="Activez ou desactivez les canaux de reception"
        />
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(channelConfig) as Array<keyof typeof channelConfig>).map((channel) => {
            const config = channelConfig[channel];
            const isEnabled = currentPreferences.channels[channel];

            return (
              <motion.div
                key={channel}
                whileHover={{ scale: 1.01 }}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all cursor-pointer',
                  isEnabled
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10'
                    : 'border-dark-200 dark:border-dark-700 hover:border-dark-300 dark:hover:border-dark-600'
                )}
                onClick={() => handleChannelToggle(channel)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2.5 rounded-xl',
                      isEnabled
                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                        : 'bg-dark-100 text-dark-500 dark:bg-dark-700 dark:text-dark-400'
                    )}>
                      {config.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark-900 dark:text-white">{config.label}</h3>
                      <p className="text-sm text-dark-500 dark:text-dark-400">{config.description}</p>
                    </div>
                  </div>
                  <div className={cn(
                    'w-12 h-7 rounded-full transition-colors flex items-center p-1',
                    isEnabled ? 'bg-primary-500' : 'bg-dark-200 dark:bg-dark-600'
                  )}>
                    <motion.div
                      className="w-5 h-5 rounded-full bg-white shadow"
                      animate={{ x: isEnabled ? 20 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </div>
                </div>

                {isEnabled && channel !== 'inApp' && (
                  <div className="mt-3 pt-3 border-t border-dark-200 dark:border-dark-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestNotification(channel as 'email' | 'push' | 'sms');
                      }}
                      disabled={testingChannel === channel}
                    >
                      {testingChannel === channel ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Tester
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Category Preferences */}
      <Card className="p-6">
        <CardHeader
          title="Preferences par categorie"
          subtitle="Personnalisez les notifications pour chaque type de contenu"
        />
        <div className="mt-6 space-y-4">
          {(Object.keys(categoryConfig) as NotificationCategory[]).map((category) => {
            const config = categoryConfig[category];
            const settings = currentPreferences.categories[category];

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'p-4 rounded-xl border transition-all',
                  settings.enabled
                    ? 'border-dark-200 dark:border-dark-700'
                    : 'border-dark-100 dark:border-dark-800 opacity-60'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      settings.enabled
                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                        : 'bg-dark-100 text-dark-400 dark:bg-dark-700'
                    )}>
                      {config.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark-900 dark:text-white">{config.label}</h3>
                      <p className="text-sm text-dark-500 dark:text-dark-400">{config.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Channel toggles */}
                    {settings.enabled && (
                      <div className="flex items-center gap-2">
                        {(Object.keys(channelConfig) as Array<keyof typeof channelConfig>).map((channel) => {
                          const isActive = settings.channels.includes(channel);
                          const isChannelEnabled = currentPreferences.channels[channel];

                          if (!isChannelEnabled) return null;

                          return (
                            <button
                              key={channel}
                              onClick={() => handleCategoryChannelToggle(category, channel)}
                              className={cn(
                                'p-2 rounded-lg transition-colors',
                                isActive
                                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                                  : 'bg-dark-100 text-dark-400 dark:bg-dark-700 hover:bg-dark-200 dark:hover:bg-dark-600'
                              )}
                              title={channelConfig[channel].label}
                            >
                              {React.cloneElement(channelConfig[channel].icon as React.ReactElement, { className: 'w-4 h-4' })}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Enable toggle */}
                    <button
                      onClick={() => handleCategoryToggle(category)}
                      className={cn(
                        'w-12 h-7 rounded-full transition-colors flex items-center p-1',
                        settings.enabled ? 'bg-primary-500' : 'bg-dark-200 dark:bg-dark-600'
                      )}
                    >
                      <motion.div
                        className="w-5 h-5 rounded-full bg-white shadow"
                        animate={{ x: settings.enabled ? 20 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Quiet Hours */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2.5 rounded-xl',
              currentPreferences.quietHours.enabled
                ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                : 'bg-dark-100 text-dark-500 dark:bg-dark-700'
            )}>
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-dark-900 dark:text-white">Mode silencieux</h3>
              <p className="text-sm text-dark-500 dark:text-dark-400">
                Desactivez les notifications pendant certaines heures
              </p>
            </div>
          </div>

          <button
            onClick={handleQuietHoursToggle}
            className={cn(
              'w-12 h-7 rounded-full transition-colors flex items-center p-1',
              currentPreferences.quietHours.enabled ? 'bg-primary-500' : 'bg-dark-200 dark:bg-dark-600'
            )}
          >
            <motion.div
              className="w-5 h-5 rounded-full bg-white shadow"
              animate={{ x: currentPreferences.quietHours.enabled ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

        {currentPreferences.quietHours.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-dark-200 dark:border-dark-700"
          >
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  De
                </label>
                <input
                  type="time"
                  value={currentPreferences.quietHours.startTime}
                  onChange={(e) => updateQuietHoursMutation.mutate({
                    ...currentPreferences.quietHours,
                    startTime: e.target.value,
                  })}
                  className="px-3 py-2 rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  A
                </label>
                <input
                  type="time"
                  value={currentPreferences.quietHours.endTime}
                  onChange={(e) => updateQuietHoursMutation.mutate({
                    ...currentPreferences.quietHours,
                    endTime: e.target.value,
                  })}
                  className="px-3 py-2 rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-white"
                />
              </div>
            </div>
            <p className="mt-2 text-sm text-dark-500 dark:text-dark-400 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              Les notifications urgentes seront toujours envoyees
            </p>
          </motion.div>
        )}
      </Card>

      {/* Digest */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2.5 rounded-xl',
              currentPreferences.digest.enabled
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-dark-100 text-dark-500 dark:bg-dark-700'
            )}>
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-dark-900 dark:text-white">Resume par email</h3>
              <p className="text-sm text-dark-500 dark:text-dark-400">
                Recevez un resume de vos notifications
              </p>
            </div>
          </div>

          <button
            onClick={handleDigestToggle}
            className={cn(
              'w-12 h-7 rounded-full transition-colors flex items-center p-1',
              currentPreferences.digest.enabled ? 'bg-primary-500' : 'bg-dark-200 dark:bg-dark-600'
            )}
          >
            <motion.div
              className="w-5 h-5 rounded-full bg-white shadow"
              animate={{ x: currentPreferences.digest.enabled ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

        {currentPreferences.digest.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-dark-200 dark:border-dark-700"
          >
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Frequence
                </label>
                <select
                  value={currentPreferences.digest.frequency}
                  onChange={(e) => updateDigestMutation.mutate({
                    ...currentPreferences.digest,
                    frequency: e.target.value as 'daily' | 'weekly' | 'never',
                  })}
                  className="px-3 py-2 rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-white"
                >
                  <option value="daily">Quotidien</option>
                  <option value="weekly">Hebdomadaire</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Heure d'envoi
                </label>
                <input
                  type="time"
                  value={currentPreferences.digest.time}
                  onChange={(e) => updateDigestMutation.mutate({
                    ...currentPreferences.digest,
                    time: e.target.value,
                  })}
                  className="px-3 py-2 rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-white"
                />
              </div>
            </div>
          </motion.div>
        )}
      </Card>
    </div>
  );
};

export default NotificationsPreferencesPage;
