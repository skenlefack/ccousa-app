import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Clock,
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  CheckCircle2,
  Pencil,
  Trash2,
  Send,
  Paperclip,
  Download,
  MoreVertical,
  MessageSquare,
  FileText,
  ListTodo,
  Activity,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Check,
  ExternalLink,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  IconButton,
  Input,
  Textarea,
  Select,
  Badge,
  StatusBadge,
  Tabs,
  TabItem,
  Modal,
  ModalBody,
  ModalFooter,
  ConfirmModal,
  Skeleton,
  SkeletonText,
  EmptyState,
} from '../../components/ui';
import { cn } from '../../utils/cn';
import { formatDate, formatDateTime, formatRelativeTime, formatFileSize, getFullName, getInitials } from '../../utils/format';
import {
  useEvent,
  useChangeEventStatus,
  useAssignEvent,
  useDeleteEvent,
  useAddEventComment,
  useDeleteEventComment,
  useUploadEventAttachment,
  useDeleteEventAttachment,
  useCreateEventTask,
  useChangeEventTaskStatus,
  useDeleteEventTask,
  useEventTimeline,
} from '../../hooks/useEvents';
import type { Event } from '../../types';
import type { EventComment, EventAttachment, EventTask, EventTimeline } from '../../services/events.service';

// ===========================================
// Types & Constants
// ===========================================

interface EventDetailPageProps {
  eventId: string;
  onBack: () => void;
  onEdit: () => void;
}

const statusOptions = [
  { value: 'REPORTED', label: 'Signalé', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
  { value: 'INVESTIGATING', label: 'En investigation', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { value: 'CONFIRMED', label: 'Confirmé', color: 'bg-orange-500', textColor: 'text-orange-600' },
  { value: 'RESOLVED', label: 'Résolu', color: 'bg-emerald-500', textColor: 'text-emerald-600' },
  { value: 'CLOSED', label: 'Clôturé', color: 'bg-dark-400', textColor: 'text-dark-600' },
];

const severityConfig = {
  LOW: { label: 'Faible', icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  MEDIUM: { label: 'Modéré', icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  HIGH: { label: 'Élevé', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  CRITICAL: { label: 'Critique', icon: AlertOctagon, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
};

const taskStatusConfig = {
  PENDING: { label: 'En attente', color: 'bg-dark-100 text-dark-600 dark:bg-dark-700 dark:text-dark-300' },
  IN_PROGRESS: { label: 'En cours', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  COMPLETED: { label: 'Terminée', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  CANCELLED: { label: 'Annulée', color: 'bg-dark-100 text-dark-400 dark:bg-dark-800 dark:text-dark-500' },
};

const taskPriorityConfig = {
  LOW: { label: 'Faible', color: 'text-dark-400' },
  MEDIUM: { label: 'Normale', color: 'text-blue-500' },
  HIGH: { label: 'Élevée', color: 'text-orange-500' },
  URGENT: { label: 'Urgente', color: 'text-red-500' },
};

// ===========================================
// Sub Components
// ===========================================

const TimelineItem: React.FC<{ item: EventTimeline; isLast: boolean }> = ({ item, isLast }) => {
  const getActionIcon = () => {
    switch (item.action) {
      case 'CREATED':
        return <Plus className="w-4 h-4 text-emerald-500" />;
      case 'STATUS_CHANGED':
        return <Activity className="w-4 h-4 text-blue-500" />;
      case 'ASSIGNED':
        return <User className="w-4 h-4 text-purple-500" />;
      case 'COMMENT_ADDED':
        return <MessageSquare className="w-4 h-4 text-yellow-500" />;
      case 'ATTACHMENT_ADDED':
        return <Paperclip className="w-4 h-4 text-cyan-500" />;
      case 'TASK_ADDED':
        return <ListTodo className="w-4 h-4 text-orange-500" />;
      case 'TASK_COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default:
        return <Activity className="w-4 h-4 text-dark-400" />;
    }
  };

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-white dark:bg-dark-700 border-2 border-dark-200 dark:border-dark-600 flex items-center justify-center">
          {getActionIcon()}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-dark-200 dark:bg-dark-600 my-1" />}
      </div>
      <div className="flex-1 pb-4">
        <p className="text-sm text-dark-900 dark:text-white">{item.description}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-dark-500">
          {item.user && (
            <span>{getFullName(item.user.firstName, item.user.lastName)}</span>
          )}
          <span>•</span>
          <span>{formatRelativeTime(item.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

const CommentItem: React.FC<{
  comment: EventComment;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}> = ({ comment, onDelete, isDeleting }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex gap-3 p-3 rounded-xl hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
          {getInitials(comment.user?.firstName, comment.user?.lastName)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-dark-900 dark:text-white text-sm">
            {getFullName(comment.user?.firstName, comment.user?.lastName)}
          </span>
          <span className="text-xs text-dark-400">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm text-dark-600 dark:text-dark-300 whitespace-pre-wrap">
          {comment.content}
        </p>
      </div>
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <IconButton
              variant="ghost"
              size="sm"
              icon={<Trash2 className="w-4 h-4 text-red-500" />}
              onClick={() => onDelete(comment.id)}
              disabled={isDeleting}
              aria-label="Supprimer"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const AttachmentItem: React.FC<{
  attachment: EventAttachment;
  onDownload: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}> = ({ attachment, onDownload, onDelete, isDeleting }) => {
  const getFileIcon = () => {
    const ext = attachment.fileName.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return <FileText className="w-5 h-5 text-red-500" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (['xls', 'xlsx'].includes(ext || '')) return <FileText className="w-5 h-5 text-emerald-500" />;
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) return <FileText className="w-5 h-5 text-purple-500" />;
    return <FileText className="w-5 h-5 text-dark-400" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group flex items-center gap-3 p-3 rounded-xl border border-dark-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-dark-100 dark:bg-dark-700 flex items-center justify-center">
        {getFileIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-dark-900 dark:text-white text-sm truncate">
          {attachment.originalName}
        </p>
        <p className="text-xs text-dark-500">
          {formatFileSize(attachment.fileSize)} • {formatRelativeTime(attachment.createdAt)}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <IconButton
          variant="ghost"
          size="sm"
          icon={<Download className="w-4 h-4" />}
          onClick={onDownload}
          aria-label="Télécharger"
        />
        <IconButton
          variant="ghost"
          size="sm"
          icon={<Trash2 className="w-4 h-4 text-red-500" />}
          onClick={onDelete}
          disabled={isDeleting}
          aria-label="Supprimer"
        />
      </div>
    </motion.div>
  );
};

const TaskItem: React.FC<{
  task: EventTask;
  onStatusChange: (status: EventTask['status']) => void;
  onDelete: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
}> = ({ task, onStatusChange, onDelete, isUpdating, isDeleting }) => {
  const [expanded, setExpanded] = useState(false);
  const statusConf = taskStatusConfig[task.status];
  const priorityConf = taskPriorityConfig[task.priority];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-dark-200 dark:border-dark-700 rounded-xl overflow-hidden"
    >
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (task.status !== 'COMPLETED' && task.status !== 'CANCELLED') {
              onStatusChange('COMPLETED');
            }
          }}
          disabled={isUpdating || task.status === 'COMPLETED' || task.status === 'CANCELLED'}
          className={cn(
            'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors',
            task.status === 'COMPLETED'
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-dark-300 dark:border-dark-600 hover:border-primary-500'
          )}
        >
          {task.status === 'COMPLETED' && <Check className="w-3 h-3 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={cn(
            'font-medium text-sm',
            task.status === 'COMPLETED' || task.status === 'CANCELLED'
              ? 'text-dark-400 line-through'
              : 'text-dark-900 dark:text-white'
          )}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn('text-xs font-medium', priorityConf.color)}>
              {priorityConf.label}
            </span>
            {task.dueDate && (
              <>
                <span className="text-dark-300">•</span>
                <span className="text-xs text-dark-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(task.dueDate)}
                </span>
              </>
            )}
          </div>
        </div>

        <Badge className={statusConf.color} size="sm">
          {statusConf.label}
        </Badge>

        <ChevronDown className={cn(
          'w-4 h-4 text-dark-400 transition-transform',
          expanded && 'rotate-180'
        )} />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0 border-t border-dark-100 dark:border-dark-700">
              {task.description && (
                <p className="text-sm text-dark-600 dark:text-dark-300 mt-3 mb-3">
                  {task.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-dark-500">
                  {task.assignedTo && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>{getFullName(task.assignedTo.firstName, task.assignedTo.lastName)}</span>
                    </div>
                  )}
                  <span>•</span>
                  <span>Créée {formatRelativeTime(task.createdAt)}</span>
                </div>

                <div className="flex items-center gap-1">
                  {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                    <Select
                      value={task.status}
                      onChange={(value) => onStatusChange(value as EventTask['status'])}
                      options={[
                        { value: 'PENDING', label: 'En attente' },
                        { value: 'IN_PROGRESS', label: 'En cours' },
                        { value: 'COMPLETED', label: 'Terminée' },
                        { value: 'CANCELLED', label: 'Annulée' },
                      ]}
                      className="w-32"
                      size="sm"
                    />
                  )}
                  <IconButton
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4 text-red-500" />}
                    onClick={onDelete}
                    disabled={isDeleting}
                    aria-label="Supprimer"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ===========================================
// Main Component
// ===========================================

export const EventDetailPage: React.FC<EventDetailPageProps> = ({ eventId, onBack, onEdit }) => {
  // State
  const [activeTab, setActiveTab] = useState('details');
  const [newComment, setNewComment] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Event['status'] | ''>('');
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIUM' as const });

  // Queries & Mutations
  const { data: event, isLoading } = useEvent(eventId);
  const { data: timeline } = useEventTimeline(eventId);
  const changeStatus = useChangeEventStatus();
  const deleteEvent = useDeleteEvent();
  const addComment = useAddEventComment();
  const deleteComment = useDeleteEventComment();
  const uploadAttachment = useUploadEventAttachment();
  const deleteAttachment = useDeleteEventAttachment();
  const createTask = useCreateEventTask();
  const changeTaskStatus = useChangeEventTaskStatus();
  const deleteTask = useDeleteEventTask();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48 rounded-xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!event) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Événement non trouvé"
        description="L'événement demandé n'existe pas ou a été supprimé."
        action={{
          label: 'Retour à la liste',
          onClick: onBack,
        }}
      />
    );
  }

  const severityConf = severityConfig[event.severity];
  const statusConf = statusOptions.find((s) => s.value === event.status);
  const SeverityIcon = severityConf.icon;

  // Handlers
  const handleStatusChange = async () => {
    if (!selectedStatus) return;
    try {
      await changeStatus.mutateAsync({ id: eventId, status: selectedStatus });
      setStatusModalOpen(false);
      setSelectedStatus('');
    } catch {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEvent.mutateAsync(eventId);
      onBack();
    } catch {
      // Error handled by hook
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await addComment.mutateAsync({ eventId, content: newComment });
      setNewComment('');
    } catch {
      // Error handled by hook
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync({ eventId, commentId });
    } catch {
      // Error handled by hook
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAttachment.mutateAsync({ eventId, file });
    } catch {
      // Error handled by hook
    }
    e.target.value = '';
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachment.mutateAsync({ eventId, attachmentId });
    } catch {
      // Error handled by hook
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    try {
      await createTask.mutateAsync({ eventId, data: newTask });
      setNewTaskModalOpen(false);
      setNewTask({ title: '', description: '', priority: 'MEDIUM' });
    } catch {
      // Error handled by hook
    }
  };

  const handleTaskStatusChange = async (taskId: string, status: EventTask['status']) => {
    try {
      await changeTaskStatus.mutateAsync({ eventId, taskId, status });
    } catch {
      // Error handled by hook
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask.mutateAsync({ eventId, taskId });
    } catch {
      // Error handled by hook
    }
  };

  const tabs: TabItem[] = [
    { id: 'details', label: 'Détails', icon: <FileText className="w-4 h-4" /> },
    { id: 'comments', label: 'Commentaires', icon: <MessageSquare className="w-4 h-4" />, badge: event.comments?.length },
    { id: 'attachments', label: 'Pièces jointes', icon: <Paperclip className="w-4 h-4" />, badge: event.attachments?.length },
    { id: 'tasks', label: 'Tâches', icon: <ListTodo className="w-4 h-4" />, badge: event.tasks?.length },
    { id: 'timeline', label: 'Activité', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <span className="text-dark-300">/</span>
        <span className="text-sm font-mono text-dark-500">{event.code}</span>
      </div>

      {/* Event Header Card */}
      <Card variant="gradient" className="overflow-hidden">
        <div className="relative p-6">
          {/* Severity strip */}
          <div
            className={cn(
              'absolute top-0 left-0 w-full h-1',
              event.severity === 'CRITICAL' && 'bg-red-500',
              event.severity === 'HIGH' && 'bg-orange-500',
              event.severity === 'MEDIUM' && 'bg-yellow-500',
              event.severity === 'LOW' && 'bg-blue-500'
            )}
          />

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className={cn('flex items-center gap-1.5', severityConf.bg, severityConf.color)}>
                  <SeverityIcon className="w-3.5 h-3.5" />
                  {severityConf.label}
                </Badge>
                <Badge
                  className="flex items-center gap-1.5"
                  style={{ backgroundColor: `${statusConf?.color.replace('bg-', '')}20` }}
                >
                  <span className={cn('w-2 h-2 rounded-full', statusConf?.color)} />
                  {statusConf?.label}
                </Badge>
                {event.category && (
                  <Badge
                    variant="outline"
                    style={{
                      backgroundColor: `${event.category.color}15`,
                      borderColor: event.category.color,
                      color: event.category.color,
                    }}
                  >
                    {event.category.name}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">
                {event.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-dark-500 dark:text-dark-400">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>Signalé le {formatDateTime(event.reportedAt)}</span>
                </div>
                {event.reportedBy && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    <span>par {getFullName(event.reportedBy.firstName, event.reportedBy.lastName)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setStatusModalOpen(true)}>
                Changer statut
              </Button>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Modifier
              </Button>
              <IconButton
                variant="ghost"
                size="sm"
                icon={<Trash2 className="w-4 h-4 text-red-500" />}
                onClick={() => setDeleteModalOpen(true)}
                aria-label="Supprimer"
              />
            </div>
          </div>

          {/* Assignee */}
          {event.assignedTo && (
            <div className="mt-4 pt-4 border-t border-dark-200 dark:border-dark-700 flex items-center gap-3">
              <span className="text-sm text-dark-500">Assigné à:</span>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                    {getInitials(event.assignedTo.firstName, event.assignedTo.lastName)}
                  </span>
                </div>
                <span className="text-sm font-medium text-dark-900 dark:text-white">
                  {getFullName(event.assignedTo.firstName, event.assignedTo.lastName)}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="bordered"
      />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'details' && (
            <Card>
              <CardBody>
                <h3 className="font-semibold text-dark-900 dark:text-white mb-3">
                  Description
                </h3>
                {event.description ? (
                  <p className="text-dark-600 dark:text-dark-300 whitespace-pre-wrap">
                    {event.description}
                  </p>
                ) : (
                  <p className="text-dark-400 italic">Aucune description fournie.</p>
                )}

                {/* Additional info grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-dark-100 dark:border-dark-700">
                  <div>
                    <h4 className="text-sm font-medium text-dark-500 dark:text-dark-400 mb-2">
                      Unité organisationnelle
                    </h4>
                    <p className="text-dark-900 dark:text-white">
                      {event.organizationalUnit?.name || 'Non spécifiée'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-dark-500 dark:text-dark-400 mb-2">
                      Coordonnées GPS
                    </h4>
                    {event.latitude && event.longitude ? (
                      <a
                        href={`https://maps.google.com/?q=${event.latitude},${event.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                      >
                        {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-dark-400">Non spécifiées</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-dark-500 dark:text-dark-400 mb-2">
                      Date de confirmation
                    </h4>
                    <p className="text-dark-900 dark:text-white">
                      {event.confirmedAt ? formatDateTime(event.confirmedAt) : 'Non confirmé'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-dark-500 dark:text-dark-400 mb-2">
                      Date de résolution
                    </h4>
                    <p className="text-dark-900 dark:text-white">
                      {event.resolvedAt ? formatDateTime(event.resolvedAt) : 'Non résolu'}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'comments' && (
            <Card>
              <CardBody className="space-y-4">
                {/* Add comment */}
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Ajouter un commentaire..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={2}
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || addComment.isPending}
                        isLoading={addComment.isPending}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Comments list */}
                <div className="border-t border-dark-100 dark:border-dark-700 pt-4">
                  {event.comments && event.comments.length > 0 ? (
                    <div className="space-y-1">
                      {event.comments.map((comment) => (
                        <CommentItem
                          key={comment.id}
                          comment={comment}
                          onDelete={handleDeleteComment}
                          isDeleting={deleteComment.isPending}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={MessageSquare}
                      title="Aucun commentaire"
                      description="Soyez le premier à commenter cet événement."
                      size="sm"
                    />
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'attachments' && (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h3 className="font-semibold text-dark-900 dark:text-white">
                  Pièces jointes
                </h3>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploadAttachment.isPending}
                  />
                  <Button
                    as="span"
                    size="sm"
                    isLoading={uploadAttachment.isPending}
                  >
                    <Paperclip className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                </label>
              </CardHeader>
              <CardBody>
                {event.attachments && event.attachments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {event.attachments.map((attachment) => (
                      <AttachmentItem
                        key={attachment.id}
                        attachment={attachment}
                        onDownload={() => window.open(attachment.url, '_blank')}
                        onDelete={() => handleDeleteAttachment(attachment.id)}
                        isDeleting={deleteAttachment.isPending}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Paperclip}
                    title="Aucune pièce jointe"
                    description="Ajoutez des documents, images ou fichiers liés à cet événement."
                    size="sm"
                  />
                )}
              </CardBody>
            </Card>
          )}

          {activeTab === 'tasks' && (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h3 className="font-semibold text-dark-900 dark:text-white">
                  Tâches
                </h3>
                <Button size="sm" onClick={() => setNewTaskModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle tâche
                </Button>
              </CardHeader>
              <CardBody>
                {event.tasks && event.tasks.length > 0 ? (
                  <div className="space-y-3">
                    {event.tasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onStatusChange={(status) => handleTaskStatusChange(task.id, status)}
                        onDelete={() => handleDeleteTask(task.id)}
                        isUpdating={changeTaskStatus.isPending}
                        isDeleting={deleteTask.isPending}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={ListTodo}
                    title="Aucune tâche"
                    description="Créez des tâches pour suivre les actions à effectuer."
                    action={{
                      label: 'Créer une tâche',
                      onClick: () => setNewTaskModalOpen(true),
                    }}
                    size="sm"
                  />
                )}
              </CardBody>
            </Card>
          )}

          {activeTab === 'timeline' && (
            <Card>
              <CardBody>
                {timeline && timeline.length > 0 ? (
                  <div className="space-y-0">
                    {timeline.map((item, index) => (
                      <TimelineItem
                        key={item.id}
                        item={item}
                        isLast={index === timeline.length - 1}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Activity}
                    title="Aucune activité"
                    description="L'historique des actions apparaîtra ici."
                    size="sm"
                  />
                )}
              </CardBody>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Status Change Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setSelectedStatus('');
        }}
        title="Changer le statut"
        size="sm"
      >
        <ModalBody>
          <Select
            label="Nouveau statut"
            value={selectedStatus}
            onChange={(value) => setSelectedStatus(value as Event['status'])}
            options={statusOptions.map((s) => ({
              value: s.value,
              label: s.label,
            }))}
            placeholder="Sélectionner un statut"
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setStatusModalOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleStatusChange}
            disabled={!selectedStatus}
            isLoading={changeStatus.isPending}
          >
            Appliquer
          </Button>
        </ModalFooter>
      </Modal>

      {/* New Task Modal */}
      <Modal
        isOpen={newTaskModalOpen}
        onClose={() => {
          setNewTaskModalOpen(false);
          setNewTask({ title: '', description: '', priority: 'MEDIUM' });
        }}
        title="Nouvelle tâche"
        size="md"
      >
        <ModalBody className="space-y-4">
          <Input
            label="Titre"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            placeholder="Titre de la tâche"
          />
          <Textarea
            label="Description"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            placeholder="Description (optionnel)"
            rows={3}
          />
          <Select
            label="Priorité"
            value={newTask.priority}
            onChange={(value) => setNewTask({ ...newTask, priority: value as EventTask['priority'] })}
            options={[
              { value: 'LOW', label: 'Faible' },
              { value: 'MEDIUM', label: 'Normale' },
              { value: 'HIGH', label: 'Élevée' },
              { value: 'URGENT', label: 'Urgente' },
            ]}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setNewTaskModalOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleCreateTask}
            disabled={!newTask.title.trim()}
            isLoading={createTask.isPending}
          >
            Créer
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer l'événement"
        message={`Êtes-vous sûr de vouloir supprimer l'événement "${event.title}" ? Cette action est irréversible et supprimera également tous les commentaires, pièces jointes et tâches associés.`}
        confirmText="Supprimer"
        variant="danger"
        isLoading={deleteEvent.isPending}
      />
    </div>
  );
};

export default EventDetailPage;
