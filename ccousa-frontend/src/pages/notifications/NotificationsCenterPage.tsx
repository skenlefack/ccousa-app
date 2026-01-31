import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Archive,
  ArchiveRestore,
  Filter,
  Search,
  Settings,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  Calendar,
  Users,
  FileText,
  BookOpen,
  ClipboardList,
  Shield,
  BarChart3,
  ChevronDown,
  MoreVertical,
  ExternalLink,
  X,
} from 'lucide-react';
import { Card, CardHeader, Button, Badge, Input, Modal, Spinner } from '../../components/ui';
import { cn } from '../../utils/cn';
import { formatRelativeTime, formatDate } from '../../utils/format';
import {
  useNotifications,
  useUnreadCount,
  useNotificationStats,
  useMarkAsRead,
  useMarkAsUnread,
  useMarkAllAsRead,
  useArchiveNotification,
  useDeleteNotification,
  useDeleteAllRead,
} from '../../hooks/useNotifications';
import type { Notification, NotificationType, NotificationCategory } from '../../services/notifications.service';

interface NotificationsCenterPageProps {
  onNavigate?: (path: string) => void;
}

// Mock data for demo
const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: 'user1',
    type: 'alert',
    category: 'events',
    title: 'Nouvel evenement critique',
    message: 'Un foyer de grippe aviaire a ete detecte dans la region du Centre. Action immediate requise.',
    link: '/events/123',
    priority: 'urgent',
    isRead: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    userId: 'user1',
    type: 'assignment',
    category: 'procedures',
    title: 'Nouvelle tache assignee',
    message: 'Vous avez ete assigne a la procedure "Inspection sanitaire Q1".',
    link: '/procedures/456',
    priority: 'high',
    isRead: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    userId: 'user1',
    type: 'update',
    category: 'forms',
    title: 'Formulaire soumis',
    message: 'Votre formulaire "Rapport hebdomadaire" a ete soumis avec succes.',
    link: '/forms/789',
    priority: 'medium',
    isRead: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    userId: 'user1',
    type: 'mention',
    category: 'knowledge',
    title: 'Mention dans un article',
    message: 'Dr. Marie Nguyen vous a mentionne dans l\'article "Guide de vaccination 2025".',
    link: '/knowledge/101',
    priority: 'medium',
    isRead: true,
    isArchived: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    userId: 'user1',
    type: 'info',
    category: 'system',
    title: 'Mise a jour systeme',
    message: 'Une nouvelle version de l\'application est disponible. Rechargez la page pour l\'utiliser.',
    priority: 'low',
    isRead: true,
    isArchived: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    userId: 'user1',
    type: 'success',
    category: 'reports',
    title: 'Rapport genere',
    message: 'Votre rapport mensuel a ete genere et est pret au telechargement.',
    link: '/analytics/reports/202',
    priority: 'low',
    isRead: true,
    isArchived: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '7',
    userId: 'user1',
    type: 'warning',
    category: 'security',
    title: 'Connexion inhabituelle',
    message: 'Une connexion depuis un nouvel appareil a ete detectee. Si ce n\'etait pas vous, changez votre mot de passe.',
    priority: 'high',
    isRead: true,
    isArchived: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const typeConfig: Record<NotificationType, { icon: React.ReactNode; color: string }> = {
  info: { icon: <Info className="w-5 h-5" />, color: 'blue' },
  success: { icon: <CheckCircle className="w-5 h-5" />, color: 'emerald' },
  warning: { icon: <AlertTriangle className="w-5 h-5" />, color: 'amber' },
  error: { icon: <AlertCircle className="w-5 h-5" />, color: 'red' },
  alert: { icon: <Bell className="w-5 h-5" />, color: 'red' },
  reminder: { icon: <Clock className="w-5 h-5" />, color: 'purple' },
  update: { icon: <CheckCircle className="w-5 h-5" />, color: 'blue' },
  mention: { icon: <Users className="w-5 h-5" />, color: 'purple' },
  assignment: { icon: <ClipboardList className="w-5 h-5" />, color: 'amber' },
};

const categoryConfig: Record<NotificationCategory, { label: string; icon: React.ReactNode }> = {
  system: { label: 'Systeme', icon: <Settings className="w-4 h-4" /> },
  events: { label: 'Evenements', icon: <Calendar className="w-4 h-4" /> },
  procedures: { label: 'Procedures', icon: <ClipboardList className="w-4 h-4" /> },
  forms: { label: 'Formulaires', icon: <FileText className="w-4 h-4" /> },
  knowledge: { label: 'Articles', icon: <BookOpen className="w-4 h-4" /> },
  users: { label: 'Utilisateurs', icon: <Users className="w-4 h-4" /> },
  reports: { label: 'Rapports', icon: <BarChart3 className="w-4 h-4" /> },
  security: { label: 'Securite', icon: <Shield className="w-4 h-4" /> },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Basse', color: 'gray' },
  medium: { label: 'Moyenne', color: 'blue' },
  high: { label: 'Haute', color: 'amber' },
  urgent: { label: 'Urgente', color: 'red' },
};

export const NotificationsCenterPage: React.FC<NotificationsCenterPageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Queries
  const { data: notificationsData, isLoading } = useNotifications({
    isRead: showUnreadOnly ? false : undefined,
    isArchived: showArchived,
    category: selectedCategory || undefined,
    priority: selectedPriority || undefined,
  });
  const { data: unreadCount } = useUnreadCount();
  const { data: stats } = useNotificationStats();

  // Mutations
  const markAsReadMutation = useMarkAsRead();
  const markAsUnreadMutation = useMarkAsUnread();
  const markAllAsReadMutation = useMarkAllAsRead();
  const archiveMutation = useArchiveNotification();
  const deleteMutation = useDeleteNotification();
  const deleteAllReadMutation = useDeleteAllRead();

  // Use mock data if API not available
  const notifications = notificationsData?.notifications || mockNotifications;
  const displayUnreadCount = unreadCount ?? mockNotifications.filter(n => !n.isRead).length;

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      if (!notification.title.toLowerCase().includes(searchLower) &&
          !notification.message.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    return true;
  });

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsReadMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAsUnread = async (id: string) => {
    try {
      await markAsUnreadMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to mark as unread:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync(selectedCategory || undefined);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to archive:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedNotification) return;
    try {
      await deleteMutation.mutateAsync(selectedNotification.id);
      setShowDeleteModal(false);
      setSelectedNotification(null);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      await deleteAllReadMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to delete all read:', error);
    }
  };

  const getTypeColor = (type: NotificationType) => {
    const config = typeConfig[type];
    switch (config.color) {
      case 'blue': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'emerald': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'amber': return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
      case 'red': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      case 'purple': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const config = priorityConfig[priority];
    switch (config.color) {
      case 'red': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'amber': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'blue': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white flex items-center gap-3">
            Centre de notifications
            {displayUnreadCount > 0 && (
              <span className="px-2.5 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {displayUnreadCount} non lues
              </span>
            )}
          </h1>
          <p className="mt-1 text-dark-500 dark:text-dark-400">
            Gerez vos notifications et alertes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending || displayUnreadCount === 0}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Tout marquer comme lu
          </Button>
          <Button
            variant="secondary"
            onClick={() => onNavigate?.('/notifications/preferences')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <Input
              placeholder="Rechercher dans les notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category filter */}
            <div className="relative">
              <Button
                variant={selectedCategory ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Filter className="w-4 h-4 mr-2" />
                {selectedCategory ? categoryConfig[selectedCategory].label : 'Categorie'}
                <ChevronDown className={cn('w-4 h-4 ml-2 transition-transform', isFilterOpen && 'rotate-180')} />
              </Button>

              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute left-0 mt-2 w-48 rounded-xl bg-white dark:bg-dark-800 shadow-lg border border-dark-200 dark:border-dark-700 py-2 z-10"
                  >
                    <button
                      onClick={() => { setSelectedCategory(null); setIsFilterOpen(false); }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2',
                        !selectedCategory
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                          : 'text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700'
                      )}
                    >
                      Toutes les categories
                    </button>
                    {(Object.keys(categoryConfig) as NotificationCategory[]).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setSelectedCategory(cat); setIsFilterOpen(false); }}
                        className={cn(
                          'w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2',
                          selectedCategory === cat
                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                            : 'text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700'
                        )}
                      >
                        {categoryConfig[cat].icon}
                        {categoryConfig[cat].label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Priority filter */}
            <select
              value={selectedPriority || ''}
              onChange={(e) => setSelectedPriority(e.target.value || null)}
              className="h-9 px-3 rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-white text-sm"
            >
              <option value="">Toutes priorites</option>
              {Object.entries(priorityConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            {/* Toggle buttons */}
            <Button
              variant={showUnreadOnly ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            >
              {showUnreadOnly ? <BellOff className="w-4 h-4 mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
              Non lues
            </Button>

            <Button
              variant={showArchived ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
            >
              <Archive className="w-4 h-4 mr-2" />
              Archives
            </Button>
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-100 dark:bg-dark-700 flex items-center justify-center">
            <Bell className="w-8 h-8 text-dark-400" />
          </div>
          <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
            Aucune notification
          </h3>
          <p className="mt-2 text-dark-500 dark:text-dark-400">
            {searchQuery || selectedCategory || selectedPriority || showUnreadOnly
              ? 'Aucune notification ne correspond a vos criteres'
              : 'Vous n\'avez pas encore de notifications'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={cn(
                  'p-4 transition-all cursor-pointer hover:shadow-md',
                  !notification.isRead && 'bg-primary-50/50 dark:bg-primary-900/10 border-l-4 border-l-primary-500'
                )}
                onClick={() => {
                  if (!notification.isRead) handleMarkAsRead(notification.id);
                  if (notification.link) onNavigate?.(notification.link);
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn('flex-shrink-0 p-2.5 rounded-xl', getTypeColor(notification.type))}>
                    {typeConfig[notification.type].icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={cn(
                          'font-semibold text-dark-900 dark:text-white',
                          !notification.isRead && 'font-bold'
                        )}>
                          {notification.title}
                        </h3>
                        <p className="mt-1 text-sm text-dark-600 dark:text-dark-400 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', getPriorityBadge(notification.priority))}>
                          {priorityConfig[notification.priority].label}
                        </span>

                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setOpenMenuId(openMenuId === notification.id ? null : notification.id)}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>

                          <AnimatePresence>
                            {openMenuId === notification.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute right-0 mt-1 w-48 rounded-xl bg-white dark:bg-dark-800 shadow-lg border border-dark-200 dark:border-dark-700 py-1 z-10"
                              >
                                {notification.isRead ? (
                                  <button
                                    onClick={() => {
                                      handleMarkAsUnread(notification.id);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 flex items-center gap-2"
                                  >
                                    <Bell className="w-4 h-4" />
                                    Marquer non lu
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      handleMarkAsRead(notification.id);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 flex items-center gap-2"
                                  >
                                    <Check className="w-4 h-4" />
                                    Marquer comme lu
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    handleArchive(notification.id);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 flex items-center gap-2"
                                >
                                  <Archive className="w-4 h-4" />
                                  Archiver
                                </button>
                                {notification.link && (
                                  <button
                                    onClick={() => {
                                      onNavigate?.(notification.link!);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 flex items-center gap-2"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    Voir le detail
                                  </button>
                                )}
                                <hr className="my-1 border-dark-200 dark:border-dark-700" />
                                <button
                                  onClick={() => {
                                    setSelectedNotification(notification);
                                    setShowDeleteModal(true);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Supprimer
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="mt-2 flex items-center gap-3 text-xs text-dark-500 dark:text-dark-400">
                      <span className="flex items-center gap-1">
                        {categoryConfig[notification.category].icon}
                        {categoryConfig[notification.category].label}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                      {!notification.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary-500" />
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Bulk Actions */}
      {filteredNotifications.filter(n => n.isRead).length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={handleDeleteAllRead}
            disabled={deleteAllReadMutation.isPending}
            className="text-dark-500 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer toutes les notifications lues
          </Button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer la notification"
      >
        <div className="space-y-4">
          <p className="text-dark-600 dark:text-dark-400">
            Etes-vous sur de vouloir supprimer cette notification ?
          </p>
          {selectedNotification && (
            <div className="p-3 rounded-lg bg-dark-50 dark:bg-dark-700">
              <p className="font-medium text-dark-900 dark:text-white">{selectedNotification.title}</p>
              <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">{selectedNotification.message}</p>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NotificationsCenterPage;
