import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  RefreshCw,
  Download,
  MoreVertical,
  MapPin,
  Calendar,
  User,
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Eye,
  Pencil,
  Trash2,
  ChevronDown,
  X,
  Zap,
  TrendingUp,
  Activity,
  Shield,
} from 'lucide-react';
import {
  Card,
  Button,
  IconButton,
  Input,
  Select,
  MultiSelect,
  Toggle,
  Badge,
  StatusBadge,
  Table,
  Column,
  TableActions,
  Pagination,
  Skeleton,
  SkeletonCard,
  NoDataEmpty,
  NoResultsEmpty,
  Modal,
  ModalBody,
  ModalFooter,
  ConfirmModal,
  StatCard,
} from '../../components/ui';
import { cn } from '../../utils/cn';
import { formatDate, formatDateTime, formatRelativeTime, getFullName } from '../../utils/format';
import { useEvents, useEventStats, useDeleteEvent, useBulkDeleteEvents, useBulkUpdateEventStatus } from '../../hooks/useEvents';
import { useEventCategories } from '../../hooks/useSettings';
import type { Event } from '../../types';
import type { EventQueryParams } from '../../services/events.service';

// ===========================================
// Types & Constants
// ===========================================

type ViewMode = 'table' | 'grid';

interface EventFiltersState {
  search: string;
  status: Event['status'][];
  severity: Event['severity'][];
  categoryId: string[];
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom';
  dateFrom?: string;
  dateTo?: string;
}

const defaultFilters: EventFiltersState = {
  search: '',
  status: [],
  severity: [],
  categoryId: [],
  dateRange: 'all',
};

const statusOptions = [
  { value: 'REPORTED', label: 'Signalé', color: 'bg-yellow-500' },
  { value: 'INVESTIGATING', label: 'En investigation', color: 'bg-blue-500' },
  { value: 'CONFIRMED', label: 'Confirmé', color: 'bg-orange-500' },
  { value: 'RESOLVED', label: 'Résolu', color: 'bg-emerald-500' },
  { value: 'CLOSED', label: 'Clôturé', color: 'bg-dark-400' },
];

const severityOptions = [
  { value: 'LOW', label: 'Faible', icon: AlertCircle, color: 'text-blue-500' },
  { value: 'MEDIUM', label: 'Modéré', icon: AlertTriangle, color: 'text-yellow-500' },
  { value: 'HIGH', label: 'Élevé', icon: AlertTriangle, color: 'text-orange-500' },
  { value: 'CRITICAL', label: 'Critique', icon: AlertOctagon, color: 'text-red-500' },
];

const dateRangeOptions = [
  { value: 'all', label: 'Toutes les dates' },
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
  { value: 'custom', label: 'Personnalisé' },
];

// ===========================================
// Helper Components
// ===========================================

const SeverityIcon: React.FC<{ severity: Event['severity']; className?: string }> = ({ severity, className }) => {
  const config = severityOptions.find((s) => s.value === severity);
  if (!config) return null;
  const Icon = config.icon;
  return <Icon className={cn('w-4 h-4', config.color, className)} />;
};

const StatusDot: React.FC<{ status: Event['status'] }> = ({ status }) => {
  const config = statusOptions.find((s) => s.value === status);
  return (
    <span className={cn('w-2 h-2 rounded-full animate-pulse', config?.color || 'bg-dark-400')} />
  );
};

const EventCard: React.FC<{
  event: Event;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
}> = ({ event, onView, onEdit, onDelete, isSelected, onSelect }) => {
  const severityConfig = severityOptions.find((s) => s.value === event.severity);
  const statusConfig = statusOptions.find((s) => s.value === event.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className={cn(
        'group relative rounded-2xl border transition-all duration-200',
        'bg-white dark:bg-dark-800',
        isSelected
          ? 'border-primary-500 ring-2 ring-primary-500/20'
          : 'border-dark-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-700'
      )}
    >
      {/* Severity indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 w-1 h-full rounded-l-2xl',
          event.severity === 'CRITICAL' && 'bg-red-500',
          event.severity === 'HIGH' && 'bg-orange-500',
          event.severity === 'MEDIUM' && 'bg-yellow-500',
          event.severity === 'LOW' && 'bg-blue-500'
        )}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              className="w-4 h-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
            />
            <div
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium',
                'bg-dark-100 dark:bg-dark-700',
                severityConfig?.color
              )}
            >
              <div className="flex items-center gap-1.5">
                <SeverityIcon severity={event.severity} className="w-3.5 h-3.5" />
                <span>{severityConfig?.label}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <StatusDot status={event.status} />
            <span className="text-xs text-dark-500 dark:text-dark-400">
              {statusConfig?.label}
            </span>
          </div>
        </div>

        {/* Title & Code */}
        <div className="mb-3">
          <p className="text-xs font-mono text-dark-400 mb-1">{event.code}</p>
          <h3 className="font-semibold text-dark-900 dark:text-white line-clamp-2">
            {event.title}
          </h3>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-dark-500 dark:text-dark-400 line-clamp-2 mb-4">
            {event.description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap gap-3 text-xs text-dark-500 dark:text-dark-400 mb-4">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px]">{event.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatRelativeTime(event.reportedAt)}</span>
          </div>
          {event.assignedTo && (
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>{getFullName(event.assignedTo.firstName, event.assignedTo.lastName)}</span>
            </div>
          )}
        </div>

        {/* Category badge */}
        {event.category && (
          <div className="mb-4">
            <Badge
              variant="outline"
              size="sm"
              style={{
                backgroundColor: `${event.category.color}15`,
                borderColor: event.category.color,
                color: event.category.color,
              }}
            >
              {event.category.name}
            </Badge>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-dark-100 dark:border-dark-700">
          <Button variant="ghost" size="sm" onClick={onView}>
            <Eye className="w-4 h-4 mr-1.5" />
            Voir
          </Button>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <IconButton
              variant="ghost"
              size="sm"
              icon={<Pencil className="w-4 h-4" />}
              onClick={onEdit}
              aria-label="Modifier"
            />
            <IconButton
              variant="ghost"
              size="sm"
              icon={<Trash2 className="w-4 h-4 text-red-500" />}
              onClick={onDelete}
              aria-label="Supprimer"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ===========================================
// Main Component
// ===========================================

export const EventsListPage: React.FC = () => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filters, setFilters] = useState<EventFiltersState>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [bulkActionModal, setBulkActionModal] = useState<'status' | 'delete' | null>(null);
  const [bulkStatus, setBulkStatus] = useState<Event['status'] | ''>('');

  // Build query params
  const queryParams = useMemo<EventQueryParams>(() => {
    const params: EventQueryParams = {
      page,
      pageSize,
      sortBy: 'reportedAt',
      sortOrder: 'desc',
    };

    if (filters.search) params.search = filters.search;
    if (filters.status.length) params.status = filters.status;
    if (filters.severity.length) params.severity = filters.severity;
    if (filters.categoryId.length) params.categoryId = filters.categoryId;

    // Handle date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let dateFrom: Date | undefined;

      switch (filters.dateRange) {
        case 'today':
          dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'custom':
          if (filters.dateFrom) params.dateFrom = filters.dateFrom;
          if (filters.dateTo) params.dateTo = filters.dateTo;
          break;
      }

      if (dateFrom) params.dateFrom = dateFrom.toISOString();
    }

    return params;
  }, [filters, page, pageSize]);

  // Queries
  const { data: eventsData, isLoading, refetch, isFetching } = useEvents(queryParams);
  const { data: stats } = useEventStats();
  const { data: categories } = useEventCategories();
  const deleteEvent = useDeleteEvent();
  const bulkDelete = useBulkDeleteEvents();
  const bulkUpdateStatus = useBulkUpdateEventStatus();

  const events = eventsData?.items || [];
  const totalPages = eventsData?.totalPages || 1;
  const total = eventsData?.total || 0;

  // Handlers
  const handleFilterChange = (key: keyof EventFiltersState, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  const hasActiveFilters = filters.search || filters.status.length || filters.severity.length || filters.categoryId.length || filters.dateRange !== 'all';

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEvents(new Set(events.map((e) => e.id)));
    } else {
      setSelectedEvents(new Set());
    }
  };

  const handleSelectEvent = (eventId: string, checked: boolean) => {
    const newSelected = new Set(selectedEvents);
    if (checked) {
      newSelected.add(eventId);
    } else {
      newSelected.delete(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const handleView = (event: Event) => {
    // TODO: Navigate to detail page
    console.log('View event:', event.id);
  };

  const handleEdit = (event: Event) => {
    // TODO: Navigate to edit page
    console.log('Edit event:', event.id);
  };

  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    try {
      await deleteEvent.mutateAsync(eventToDelete.id);
      setDeleteModalOpen(false);
      setEventToDelete(null);
    } catch {
      // Error handled by hook
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDelete.mutateAsync(Array.from(selectedEvents));
      setSelectedEvents(new Set());
      setBulkActionModal(null);
    } catch {
      // Error handled by hook
    }
  };

  const handleBulkStatusChange = async () => {
    if (!bulkStatus) return;
    try {
      await bulkUpdateStatus.mutateAsync({
        ids: Array.from(selectedEvents),
        status: bulkStatus,
      });
      setSelectedEvents(new Set());
      setBulkActionModal(null);
      setBulkStatus('');
    } catch {
      // Error handled by hook
    }
  };

  // Category options for filter
  const categoryOptions = useMemo(() => {
    return (categories || []).map((cat) => ({
      value: cat.id,
      label: cat.name,
      icon: (
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: cat.color }}
        />
      ),
    }));
  }, [categories]);

  // Table columns
  const columns: Column<Event>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={events.length > 0 && selectedEvents.size === events.length}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="w-4 h-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
        />
      ),
      width: '40px',
      render: (_, event) => (
        <input
          type="checkbox"
          checked={selectedEvents.has(event.id)}
          onChange={(e) => handleSelectEvent(event.id, e.target.checked)}
          className="w-4 h-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
        />
      ),
    },
    {
      key: 'severity',
      header: '',
      width: '40px',
      render: (_, event) => <SeverityIcon severity={event.severity} />,
    },
    {
      key: 'title',
      header: 'Événement',
      render: (_, event) => (
        <div className="flex items-center gap-3">
          <div>
            <p className="font-medium text-dark-900 dark:text-white">
              {event.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-mono text-dark-400">{event.code}</span>
              {event.category && (
                <Badge
                  variant="outline"
                  size="xs"
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
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      width: '140px',
      render: (_, event) => {
        const config = statusOptions.find((s) => s.value === event.status);
        return (
          <div className="flex items-center gap-2">
            <StatusDot status={event.status} />
            <span className="text-sm text-dark-700 dark:text-dark-300">
              {config?.label}
            </span>
          </div>
        );
      },
    },
    {
      key: 'location',
      header: 'Localisation',
      render: (_, event) => (
        <div className="flex items-center gap-2 text-dark-600 dark:text-dark-300">
          <MapPin className="w-4 h-4 text-dark-400" />
          <span className="truncate max-w-[150px]">{event.location}</span>
        </div>
      ),
    },
    {
      key: 'reportedAt',
      header: 'Date signalement',
      width: '150px',
      render: (_, event) => (
        <div className="text-sm">
          <p className="text-dark-700 dark:text-dark-300">
            {formatDate(event.reportedAt)}
          </p>
          <p className="text-xs text-dark-400">
            {formatRelativeTime(event.reportedAt)}
          </p>
        </div>
      ),
    },
    {
      key: 'assignedTo',
      header: 'Assigné à',
      width: '150px',
      render: (_, event) =>
        event.assignedTo ? (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                {event.assignedTo.firstName?.[0]}{event.assignedTo.lastName?.[0]}
              </span>
            </div>
            <span className="text-sm text-dark-700 dark:text-dark-300 truncate">
              {getFullName(event.assignedTo.firstName, event.assignedTo.lastName)}
            </span>
          </div>
        ) : (
          <span className="text-sm text-dark-400">Non assigné</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      align: 'right',
      render: (_, event) => (
        <TableActions>
          <IconButton
            variant="ghost"
            size="sm"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => handleView(event)}
            aria-label="Voir"
          />
          <IconButton
            variant="ghost"
            size="sm"
            icon={<Pencil className="w-4 h-4" />}
            onClick={() => handleEdit(event)}
            aria-label="Modifier"
          />
          <IconButton
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-4 h-4 text-red-500" />}
            onClick={() => handleDeleteClick(event)}
            aria-label="Supprimer"
          />
        </TableActions>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total événements"
          value={stats?.total || 0}
          icon={<Activity className="w-5 h-5" />}
          trend={{ value: 12, isPositive: true }}
          color="primary"
        />
        <StatCard
          title="En investigation"
          value={stats?.byStatus?.INVESTIGATING || 0}
          icon={<Search className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Critiques"
          value={stats?.bySeverity?.CRITICAL || 0}
          icon={<AlertOctagon className="w-5 h-5" />}
          trend={{ value: 3, isPositive: false }}
          color="red"
        />
        <StatCard
          title="Résolus ce mois"
          value={stats?.byStatus?.RESOLVED || 0}
          icon={<CheckCircle2 className="w-5 h-5" />}
          trend={{ value: 8, isPositive: true }}
          color="green"
        />
      </div>

      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
            Gestion des Événements
          </h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">
            {total} événement{total !== 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn('w-4 h-4 mr-2', isFetching && 'animate-spin')} />
            Actualiser
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={() => console.log('Create new event')}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvel événement
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card variant="glass" padding="md">
        <div className="flex flex-col gap-4">
          {/* Main row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher un événement..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                clearable
                onClear={() => handleFilterChange('search', '')}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtres
                {hasActiveFilters && (
                  <Badge variant="primary" size="xs" className="ml-2">
                    {[filters.status.length, filters.severity.length, filters.categoryId.length, filters.dateRange !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
                  </Badge>
                )}
              </Button>
              <div className="flex items-center rounded-lg border border-dark-200 dark:border-dark-700 p-0.5">
                <IconButton
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  icon={<List className="w-4 h-4" />}
                  onClick={() => setViewMode('table')}
                  aria-label="Vue tableau"
                />
                <IconButton
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  icon={<LayoutGrid className="w-4 h-4" />}
                  onClick={() => setViewMode('grid')}
                  aria-label="Vue grille"
                />
              </div>
            </div>
          </div>

          {/* Expanded filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-dark-200 dark:border-dark-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MultiSelect
                      label="Statut"
                      value={filters.status}
                      onChange={(value) => handleFilterChange('status', value)}
                      options={statusOptions.map((s) => ({
                        value: s.value,
                        label: s.label,
                        icon: <span className={cn('w-2 h-2 rounded-full', s.color)} />,
                      }))}
                      placeholder="Tous les statuts"
                    />
                    <MultiSelect
                      label="Sévérité"
                      value={filters.severity}
                      onChange={(value) => handleFilterChange('severity', value)}
                      options={severityOptions.map((s) => ({
                        value: s.value,
                        label: s.label,
                        icon: <s.icon className={cn('w-4 h-4', s.color)} />,
                      }))}
                      placeholder="Toutes les sévérités"
                    />
                    <MultiSelect
                      label="Catégorie"
                      value={filters.categoryId}
                      onChange={(value) => handleFilterChange('categoryId', value)}
                      options={categoryOptions}
                      placeholder="Toutes les catégories"
                    />
                    <Select
                      label="Période"
                      value={filters.dateRange}
                      onChange={(value) => handleFilterChange('dateRange', value)}
                      options={dateRangeOptions}
                    />
                  </div>

                  {filters.dateRange === 'custom' && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <Input
                        type="date"
                        label="Du"
                        value={filters.dateFrom || ''}
                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      />
                      <Input
                        type="date"
                        label="Au"
                        value={filters.dateTo || ''}
                        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      />
                    </div>
                  )}

                  {hasActiveFilters && (
                    <div className="flex items-center justify-end mt-4">
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="w-4 h-4 mr-1.5" />
                        Effacer les filtres
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedEvents.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card variant="glass" padding="sm" className="border-primary-500 dark:border-primary-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="primary" size="sm">
                    {selectedEvents.size} sélectionné{selectedEvents.size > 1 ? 's' : ''}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEvents(new Set())}
                  >
                    Désélectionner
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkActionModal('status')}
                  >
                    <Zap className="w-4 h-4 mr-1.5" />
                    Changer statut
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setBulkActionModal('delete')}
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {isLoading ? (
        viewMode === 'table' ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )
      ) : events.length === 0 ? (
        hasActiveFilters ? (
          <NoResultsEmpty onReset={clearFilters} />
        ) : (
          <NoDataEmpty
            onAdd={() => console.log('Create event')}
            addLabel="Créer un événement"
          />
        )
      ) : viewMode === 'table' ? (
        <Table
          columns={columns}
          data={events}
          keyExtractor={(item) => item.id}
          variant="striped"
          hoverable
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isSelected={selectedEvents.has(event.id)}
                onSelect={(checked) => handleSelectEvent(event.id, checked)}
                onView={() => handleView(event)}
                onEdit={() => handleEdit(event)}
                onDelete={() => handleDeleteClick(event)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {events.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-dark-500">
            <span>Afficher</span>
            <Select
              value={String(pageSize)}
              onChange={(value) => {
                setPageSize(Number(value));
                setPage(1);
              }}
              options={[
                { value: '10', label: '10' },
                { value: '25', label: '25' },
                { value: '50', label: '50' },
                { value: '100', label: '100' },
              ]}
              className="w-20"
            />
            <span>par page</span>
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer l'événement"
        message={`Êtes-vous sûr de vouloir supprimer l'événement "${eventToDelete?.title}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
        isLoading={deleteEvent.isPending}
      />

      {/* Bulk Delete Modal */}
      <ConfirmModal
        isOpen={bulkActionModal === 'delete'}
        onClose={() => setBulkActionModal(null)}
        onConfirm={handleBulkDelete}
        title="Supprimer les événements"
        message={`Êtes-vous sûr de vouloir supprimer ${selectedEvents.size} événement${selectedEvents.size > 1 ? 's' : ''} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
        isLoading={bulkDelete.isPending}
      />

      {/* Bulk Status Change Modal */}
      <Modal
        isOpen={bulkActionModal === 'status'}
        onClose={() => {
          setBulkActionModal(null);
          setBulkStatus('');
        }}
        title="Changer le statut"
        size="sm"
      >
        <ModalBody>
          <p className="text-dark-600 dark:text-dark-300 mb-4">
            Sélectionnez le nouveau statut pour les {selectedEvents.size} événement{selectedEvents.size > 1 ? 's' : ''} sélectionné{selectedEvents.size > 1 ? 's' : ''}.
          </p>
          <Select
            label="Nouveau statut"
            value={bulkStatus}
            onChange={(value) => setBulkStatus(value as Event['status'])}
            options={statusOptions.map((s) => ({
              value: s.value,
              label: s.label,
            }))}
            placeholder="Sélectionner un statut"
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setBulkActionModal(null)}>
            Annuler
          </Button>
          <Button
            onClick={handleBulkStatusChange}
            disabled={!bulkStatus}
            isLoading={bulkUpdateStatus.isPending}
          >
            Appliquer
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default EventsListPage;
