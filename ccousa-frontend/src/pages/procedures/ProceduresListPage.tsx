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
  GitBranch,
  Play,
  Pause,
  Copy,
  Eye,
  Pencil,
  Trash2,
  ChevronRight,
  Settings2,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Users,
  Building2,
  Workflow,
  ArrowRight,
  BarChart3,
  TrendingUp,
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
  Table,
  Column,
  TableActions,
  Pagination,
  Skeleton,
  SkeletonCard,
  NoDataEmpty,
  NoResultsEmpty,
  ConfirmModal,
  Modal,
  ModalBody,
  ModalFooter,
  StatCard,
} from '../../components/ui';
import { cn } from '../../utils/cn';
import { formatDate, formatRelativeTime } from '../../utils/format';
import {
  useProcedures,
  useProcedureStats,
  useDeleteProcedure,
  useDuplicateProcedure,
  useProcedureGroups,
} from '../../hooks/useProcedures';
import { useEventCategories } from '../../hooks/useSettings';
import type { Procedure } from '../../types';
import type { ProcedureQueryParams } from '../../services/procedures.service';

// ===========================================
// Types & Constants
// ===========================================

type ViewMode = 'table' | 'grid';

interface ProcedureFiltersState {
  search: string;
  type: Procedure['type'][];
  categoryId: string[];
  groupId: string;
  triggerType: Procedure['triggerType'] | '';
  showInactive: boolean;
}

const defaultFilters: ProcedureFiltersState = {
  search: '',
  type: [],
  categoryId: [],
  groupId: '',
  triggerType: '',
  showInactive: false,
};

const procedureTypeOptions = [
  { value: 'INVESTIGATION', label: 'Investigation', icon: Search, color: 'text-blue-500' },
  { value: 'VACCINATION', label: 'Vaccination', icon: Zap, color: 'text-emerald-500' },
  { value: 'INSPECTION', label: 'Inspection', icon: Eye, color: 'text-purple-500' },
  { value: 'SAMPLING', label: 'Prélèvement', icon: FileText, color: 'text-orange-500' },
  { value: 'TREATMENT', label: 'Traitement', icon: CheckCircle2, color: 'text-cyan-500' },
  { value: 'OTHER', label: 'Autre', icon: Settings2, color: 'text-dark-500' },
];

const triggerTypeOptions = [
  { value: 'MANUAL', label: 'Manuel', description: 'Démarrage manuel par un utilisateur' },
  { value: 'AUTOMATIC', label: 'Automatique', description: 'Déclenché automatiquement par un événement' },
  { value: 'SCHEDULED', label: 'Planifié', description: 'Exécution programmée' },
];

// ===========================================
// Helper Components
// ===========================================

const ProcedureTypeIcon: React.FC<{ type: Procedure['type']; className?: string }> = ({ type, className }) => {
  const config = procedureTypeOptions.find((t) => t.value === type);
  if (!config) return null;
  const Icon = config.icon;
  return <Icon className={cn('w-4 h-4', config.color, className)} />;
};

const TriggerTypeBadge: React.FC<{ triggerType: Procedure['triggerType'] }> = ({ triggerType }) => {
  const config = triggerTypeOptions.find((t) => t.value === triggerType);
  const icons = {
    MANUAL: <Play className="w-3 h-3" />,
    AUTOMATIC: <Zap className="w-3 h-3" />,
    SCHEDULED: <Clock className="w-3 h-3" />,
  };

  return (
    <Badge variant="outline" size="xs" className="flex items-center gap-1">
      {icons[triggerType]}
      {config?.label || triggerType}
    </Badge>
  );
};

const StepsPreview: React.FC<{ steps?: Array<{ id: string; name: string; stepNumber: number }> }> = ({ steps = [] }) => {
  const maxVisible = 3;
  const visibleSteps = steps.slice(0, maxVisible);
  const remaining = steps.length - maxVisible;

  return (
    <div className="flex items-center gap-1">
      {visibleSteps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-dark-100 dark:bg-dark-700 text-xs">
            <span className="font-medium text-primary-600 dark:text-primary-400">{step.stepNumber}</span>
          </div>
          {index < visibleSteps.length - 1 && (
            <ArrowRight className="w-3 h-3 text-dark-400" />
          )}
        </React.Fragment>
      ))}
      {remaining > 0 && (
        <>
          <ArrowRight className="w-3 h-3 text-dark-400" />
          <div className="px-2 py-0.5 rounded-full bg-dark-100 dark:bg-dark-700 text-xs text-dark-500">
            +{remaining}
          </div>
        </>
      )}
      {steps.length === 0 && (
        <span className="text-xs text-dark-400 italic">Aucune étape</span>
      )}
    </div>
  );
};

const ProcedureCard: React.FC<{
  procedure: Procedure;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}> = ({ procedure, onView, onEdit, onDuplicate, onDelete }) => {
  const typeConfig = procedureTypeOptions.find((t) => t.value === procedure.type);
  const TypeIcon = typeConfig?.icon || Settings2;

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
        procedure.isActive
          ? 'border-dark-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-700'
          : 'border-dark-200 dark:border-dark-700 opacity-60'
      )}
    >
      {/* Type indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 w-1 h-full rounded-l-2xl',
          typeConfig?.color.replace('text-', 'bg-') || 'bg-dark-400'
        )}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                'bg-dark-100 dark:bg-dark-700'
              )}
            >
              <TypeIcon className={cn('w-5 h-5', typeConfig?.color)} />
            </div>
            <div>
              <Badge variant="outline" size="xs">
                {typeConfig?.label}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <TriggerTypeBadge triggerType={procedure.triggerType} />
            {!procedure.isActive && (
              <Badge variant="default" size="xs">
                Inactif
              </Badge>
            )}
          </div>
        </div>

        {/* Title & Code */}
        <div className="mb-3">
          <p className="text-xs font-mono text-dark-400 mb-1">{procedure.code}</p>
          <h3 className="font-semibold text-dark-900 dark:text-white line-clamp-1">
            {procedure.name}
          </h3>
        </div>

        {/* Description */}
        {procedure.description && (
          <p className="text-sm text-dark-500 dark:text-dark-400 line-clamp-2 mb-4">
            {procedure.description}
          </p>
        )}

        {/* Steps preview */}
        <div className="mb-4">
          <p className="text-xs text-dark-500 mb-2">Étapes du workflow</p>
          <StepsPreview steps={procedure.steps} />
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-3 text-xs text-dark-500 dark:text-dark-400 mb-4">
          {procedure.steps && (
            <div className="flex items-center gap-1.5">
              <Workflow className="w-3.5 h-3.5" />
              <span>{procedure.steps.length} étape{procedure.steps.length > 1 ? 's' : ''}</span>
            </div>
          )}
          {procedure.category && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: procedure.category.color }}
              />
              <span>{procedure.category.name}</span>
            </div>
          )}
        </div>

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
              icon={<Copy className="w-4 h-4" />}
              onClick={onDuplicate}
              aria-label="Dupliquer"
            />
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

interface ProceduresListPageProps {
  onNavigate?: (path: string) => void;
}

export const ProceduresListPage: React.FC<ProceduresListPageProps> = ({ onNavigate }) => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<ProcedureFiltersState>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [procedureToDelete, setProcedureToDelete] = useState<Procedure | null>(null);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [procedureToDuplicate, setProcedureToDuplicate] = useState<Procedure | null>(null);
  const [duplicateName, setDuplicateName] = useState('');

  // Build query params
  const queryParams = useMemo<ProcedureQueryParams>(() => {
    const params: ProcedureQueryParams = {
      page,
      pageSize,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    if (filters.search) params.search = filters.search;
    if (filters.type.length) params.type = filters.type;
    if (filters.categoryId.length) params.categoryId = filters.categoryId;
    if (filters.groupId) params.groupId = filters.groupId;
    if (filters.triggerType) params.triggerType = filters.triggerType as Procedure['triggerType'];
    if (!filters.showInactive) params.isActive = true;

    return params;
  }, [filters, page, pageSize]);

  // Queries
  const { data: proceduresData, isLoading, refetch, isFetching } = useProcedures(queryParams);
  const { data: stats } = useProcedureStats();
  const { data: categories } = useEventCategories();
  const { data: groups } = useProcedureGroups();
  const deleteProcedure = useDeleteProcedure();
  const duplicateProcedure = useDuplicateProcedure();

  const procedures = proceduresData?.items || [];
  const totalPages = proceduresData?.totalPages || 1;
  const total = proceduresData?.total || 0;

  // Handlers
  const handleFilterChange = (key: keyof ProcedureFiltersState, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  const hasActiveFilters =
    filters.search ||
    filters.type.length ||
    filters.categoryId.length ||
    filters.groupId ||
    filters.triggerType ||
    filters.showInactive;

  const handleView = (procedure: Procedure) => {
    onNavigate?.(`/procedures/${procedure.id}`);
  };

  const handleEdit = (procedure: Procedure) => {
    onNavigate?.(`/procedures/${procedure.id}/edit`);
  };

  const handleDeleteClick = (procedure: Procedure) => {
    setProcedureToDelete(procedure);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!procedureToDelete) return;
    try {
      await deleteProcedure.mutateAsync(procedureToDelete.id);
      setDeleteModalOpen(false);
      setProcedureToDelete(null);
    } catch {
      // Error handled by hook
    }
  };

  const handleDuplicateClick = (procedure: Procedure) => {
    setProcedureToDuplicate(procedure);
    setDuplicateName(`${procedure.name} (copie)`);
    setDuplicateModalOpen(true);
  };

  const handleDuplicate = async () => {
    if (!procedureToDuplicate || !duplicateName.trim()) return;
    try {
      await duplicateProcedure.mutateAsync({
        id: procedureToDuplicate.id,
        newName: duplicateName.trim(),
      });
      setDuplicateModalOpen(false);
      setProcedureToDuplicate(null);
      setDuplicateName('');
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

  // Group options for filter
  const groupOptions = useMemo(() => {
    return [
      { value: '', label: 'Tous les groupes' },
      ...(groups || []).map((g) => ({
        value: g.id,
        label: g.name,
      })),
    ];
  }, [groups]);

  // Table columns
  const columns: Column<Procedure>[] = [
    {
      key: 'type',
      header: '',
      width: '40px',
      render: (_, procedure) => <ProcedureTypeIcon type={procedure.type} />,
    },
    {
      key: 'name',
      header: 'Procédure',
      render: (_, procedure) => (
        <div className="flex items-center gap-3">
          <div>
            <p className="font-medium text-dark-900 dark:text-white">
              {procedure.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-mono text-dark-400">{procedure.code}</span>
              {procedure.category && (
                <Badge
                  variant="outline"
                  size="xs"
                  style={{
                    backgroundColor: `${procedure.category.color}15`,
                    borderColor: procedure.category.color,
                    color: procedure.category.color,
                  }}
                >
                  {procedure.category.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      width: '130px',
      render: (_, procedure) => {
        const config = procedureTypeOptions.find((t) => t.value === procedure.type);
        return (
          <div className="flex items-center gap-2">
            <ProcedureTypeIcon type={procedure.type} />
            <span className="text-sm text-dark-700 dark:text-dark-300">
              {config?.label}
            </span>
          </div>
        );
      },
    },
    {
      key: 'triggerType',
      header: 'Déclenchement',
      width: '120px',
      render: (_, procedure) => <TriggerTypeBadge triggerType={procedure.triggerType} />,
    },
    {
      key: 'steps',
      header: 'Étapes',
      width: '200px',
      render: (_, procedure) => <StepsPreview steps={procedure.steps} />,
    },
    {
      key: 'isActive',
      header: 'Statut',
      width: '100px',
      render: (value) => (
        <Badge
          variant={value ? 'success' : 'default'}
          size="sm"
          dot
        >
          {value ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Créé le',
      width: '120px',
      render: (_, procedure) => (
        <span className="text-sm text-dark-500">
          {formatDate(procedure.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      align: 'right',
      render: (_, procedure) => (
        <TableActions>
          <IconButton
            variant="ghost"
            size="sm"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => handleView(procedure)}
            aria-label="Voir"
          />
          <IconButton
            variant="ghost"
            size="sm"
            icon={<Copy className="w-4 h-4" />}
            onClick={() => handleDuplicateClick(procedure)}
            aria-label="Dupliquer"
          />
          <IconButton
            variant="ghost"
            size="sm"
            icon={<Pencil className="w-4 h-4" />}
            onClick={() => handleEdit(procedure)}
            aria-label="Modifier"
          />
          <IconButton
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-4 h-4 text-red-500" />}
            onClick={() => handleDeleteClick(procedure)}
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
          title="Total procédures"
          value={stats?.total || 0}
          icon={<Workflow className="w-5 h-5" />}
          color="primary"
        />
        <StatCard
          title="Procédures actives"
          value={stats?.byStatus?.active || 0}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Exécutions en cours"
          value={stats?.executionStats?.inProgress || 0}
          icon={<Play className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Taux de complétion"
          value={`${Math.round((stats?.executionStats?.completed || 0) / (stats?.executionStats?.total || 1) * 100)}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={{ value: 5, isPositive: true }}
          color="purple"
        />
      </div>

      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
            Gestion des Procédures
          </h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">
            {total} procédure{total !== 1 ? 's' : ''} au total
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
          <Button onClick={() => onNavigate?.('/procedures/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle procédure
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
                placeholder="Rechercher une procédure..."
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
                    {[
                      filters.type.length,
                      filters.categoryId.length,
                      filters.groupId ? 1 : 0,
                      filters.triggerType ? 1 : 0,
                      filters.showInactive ? 1 : 0,
                    ].reduce((a, b) => a + b, 0)}
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
                      label="Type"
                      value={filters.type}
                      onChange={(value) => handleFilterChange('type', value)}
                      options={procedureTypeOptions.map((t) => ({
                        value: t.value,
                        label: t.label,
                        icon: <t.icon className={cn('w-4 h-4', t.color)} />,
                      }))}
                      placeholder="Tous les types"
                    />
                    <MultiSelect
                      label="Catégorie"
                      value={filters.categoryId}
                      onChange={(value) => handleFilterChange('categoryId', value)}
                      options={categoryOptions}
                      placeholder="Toutes les catégories"
                    />
                    <Select
                      label="Groupe"
                      value={filters.groupId}
                      onChange={(value) => handleFilterChange('groupId', value)}
                      options={groupOptions}
                    />
                    <Select
                      label="Déclenchement"
                      value={filters.triggerType}
                      onChange={(value) => handleFilterChange('triggerType', value)}
                      options={[
                        { value: '', label: 'Tous' },
                        ...triggerTypeOptions.map((t) => ({ value: t.value, label: t.label })),
                      ]}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <Toggle
                      checked={filters.showInactive}
                      onChange={(checked) => handleFilterChange('showInactive', checked)}
                      label="Afficher les procédures inactives"
                      size="sm"
                    />
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Effacer les filtres
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

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
      ) : procedures.length === 0 ? (
        hasActiveFilters ? (
          <NoResultsEmpty onReset={clearFilters} />
        ) : (
          <NoDataEmpty
            onAdd={() => onNavigate?.('/procedures/new')}
            addLabel="Créer une procédure"
          />
        )
      ) : viewMode === 'table' ? (
        <Table
          columns={columns}
          data={procedures}
          keyExtractor={(item) => item.id}
          variant="striped"
          hoverable
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {procedures.map((procedure) => (
              <ProcedureCard
                key={procedure.id}
                procedure={procedure}
                onView={() => handleView(procedure)}
                onEdit={() => handleEdit(procedure)}
                onDuplicate={() => handleDuplicateClick(procedure)}
                onDelete={() => handleDeleteClick(procedure)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {procedures.length > 0 && (
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
                { value: '12', label: '12' },
                { value: '24', label: '24' },
                { value: '48', label: '48' },
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
        title="Supprimer la procédure"
        message={`Êtes-vous sûr de vouloir supprimer la procédure "${procedureToDelete?.name}" ? Cette action désactivera la procédure.`}
        confirmText="Supprimer"
        variant="danger"
        isLoading={deleteProcedure.isPending}
      />

      {/* Duplicate Modal */}
      <Modal
        isOpen={duplicateModalOpen}
        onClose={() => {
          setDuplicateModalOpen(false);
          setProcedureToDuplicate(null);
          setDuplicateName('');
        }}
        title="Dupliquer la procédure"
        size="sm"
      >
        <ModalBody>
          <p className="text-dark-600 dark:text-dark-300 mb-4">
            Créer une copie de "{procedureToDuplicate?.name}" avec un nouveau nom.
          </p>
          <Input
            label="Nom de la nouvelle procédure"
            value={duplicateName}
            onChange={(e) => setDuplicateName(e.target.value)}
            placeholder="Entrez le nom"
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setDuplicateModalOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleDuplicate}
            disabled={!duplicateName.trim()}
            isLoading={duplicateProcedure.isPending}
          >
            <Copy className="w-4 h-4 mr-2" />
            Dupliquer
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ProceduresListPage;
