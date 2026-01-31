import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Pause,
  Copy,
  Pencil,
  Trash2,
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
  ArrowDown,
  BarChart3,
  GitBranch,
  Search,
  Eye,
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  Timer,
  Target,
  Layers,
  Activity,
  MoreVertical,
  ExternalLink,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  IconButton,
  Badge,
  Tabs,
  TabItem,
  Table,
  Column,
  Modal,
  ModalBody,
  ModalFooter,
  ConfirmModal,
  Skeleton,
  EmptyState,
  Select,
} from '../../components/ui';
import { cn } from '../../utils/cn';
import { formatDate, formatDateTime, formatRelativeTime, getFullName } from '../../utils/format';
import {
  useProcedure,
  useProcedureExecutions,
  useDeleteProcedure,
  useDuplicateProcedure,
  useStartProcedureExecution,
} from '../../hooks/useProcedures';
import type { Procedure, ProcedureStep } from '../../types';
import type { ProcedureExecution } from '../../services/procedures.service';

// ===========================================
// Types & Constants
// ===========================================

interface ProcedureDetailPageProps {
  procedureId: string;
  onBack: () => void;
  onEdit: () => void;
}

const procedureTypeConfig = {
  INVESTIGATION: { label: 'Investigation', icon: Search, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  VACCINATION: { label: 'Vaccination', icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  INSPECTION: { label: 'Inspection', icon: Eye, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  SAMPLING: { label: 'Prélèvement', icon: FileText, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  TREATMENT: { label: 'Traitement', icon: CheckCircle2, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  OTHER: { label: 'Autre', icon: Settings2, color: 'text-dark-500', bg: 'bg-dark-50 dark:bg-dark-900/20' },
};

const triggerTypeConfig = {
  MANUAL: { label: 'Manuel', icon: Play, description: 'Démarrage manuel' },
  AUTOMATIC: { label: 'Automatique', icon: Zap, description: 'Déclenché par un événement' },
  SCHEDULED: { label: 'Planifié', icon: Clock, description: 'Exécution programmée' },
};

const assigneeTypeConfig = {
  USER: { label: 'Utilisateur', icon: User },
  ROLE: { label: 'Rôle', icon: Users },
  GROUP: { label: 'Groupe', icon: Users },
  UNIT: { label: 'Unité', icon: Building2 },
};

const executionStatusConfig = {
  PENDING: { label: 'En attente', color: 'bg-dark-100 text-dark-600 dark:bg-dark-700 dark:text-dark-300' },
  IN_PROGRESS: { label: 'En cours', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  COMPLETED: { label: 'Terminée', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  CANCELLED: { label: 'Annulée', color: 'bg-dark-100 text-dark-400 dark:bg-dark-800 dark:text-dark-500' },
  FAILED: { label: 'Échouée', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
};

// ===========================================
// Helper Components
// ===========================================

const WorkflowDiagram: React.FC<{ steps: ProcedureStep[] }> = ({ steps }) => {
  if (steps.length === 0) {
    return (
      <EmptyState
        icon={Workflow}
        title="Aucune étape définie"
        description="Ajoutez des étapes pour construire le workflow."
        size="sm"
      />
    );
  }

  return (
    <div className="relative py-8">
      {/* Connection line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-dark-200 dark:bg-dark-700 -translate-x-1/2" />

      <div className="space-y-6">
        {steps.map((step, index) => {
          const assigneeConfig = assigneeTypeConfig[step.assigneeType];
          const AssigneeIcon = assigneeConfig?.icon || User;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-center gap-6"
            >
              {/* Step number circle */}
              <div className="absolute left-1/2 -translate-x-1/2 z-10">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg',
                    'bg-primary-500 text-white shadow-lg'
                  )}
                >
                  {step.stepNumber}
                </div>
              </div>

              {/* Left content (odd steps) */}
              <div className={cn('flex-1', index % 2 === 0 ? 'pr-16 text-right' : 'invisible')}>
                {index % 2 === 0 && (
                  <div className="inline-block p-4 rounded-xl bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 shadow-sm">
                    <div className="flex items-center justify-end gap-2 mb-2">
                      {step.isOptional && (
                        <Badge variant="outline" size="xs">Optionnel</Badge>
                      )}
                      <h4 className="font-semibold text-dark-900 dark:text-white">
                        {step.name}
                      </h4>
                    </div>
                    {step.description && (
                      <p className="text-sm text-dark-500 dark:text-dark-400 mb-2">
                        {step.description}
                      </p>
                    )}
                    <div className="flex items-center justify-end gap-3 text-xs text-dark-500">
                      {step.durationHours && (
                        <span className="flex items-center gap-1">
                          <Timer className="w-3.5 h-3.5" />
                          {step.durationHours}h
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <AssigneeIcon className="w-3.5 h-3.5" />
                        {assigneeConfig?.label}
                      </span>
                      {step.form && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          Formulaire
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right content (even steps) */}
              <div className={cn('flex-1', index % 2 === 1 ? 'pl-16' : 'invisible')}>
                {index % 2 === 1 && (
                  <div className="inline-block p-4 rounded-xl bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-dark-900 dark:text-white">
                        {step.name}
                      </h4>
                      {step.isOptional && (
                        <Badge variant="outline" size="xs">Optionnel</Badge>
                      )}
                    </div>
                    {step.description && (
                      <p className="text-sm text-dark-500 dark:text-dark-400 mb-2">
                        {step.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-dark-500">
                      {step.durationHours && (
                        <span className="flex items-center gap-1">
                          <Timer className="w-3.5 h-3.5" />
                          {step.durationHours}h
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <AssigneeIcon className="w-3.5 h-3.5" />
                        {assigneeConfig?.label}
                      </span>
                      {step.form && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          Formulaire
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* End marker */}
        <div className="relative flex justify-center">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center z-10">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

const StepsList: React.FC<{ steps: ProcedureStep[] }> = ({ steps }) => {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  if (steps.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="Aucune étape"
        description="Cette procédure ne contient pas encore d'étapes."
        size="sm"
      />
    );
  }

  return (
    <div className="space-y-3">
      {steps.map((step) => {
        const assigneeConfig = assigneeTypeConfig[step.assigneeType];
        const AssigneeIcon = assigneeConfig?.icon || User;
        const isExpanded = expandedStep === step.id;

        return (
          <motion.div
            key={step.id}
            layout
            className="border border-dark-200 dark:border-dark-700 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setExpandedStep(isExpanded ? null : step.id)}
              className="w-full flex items-center gap-4 p-4 hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center font-bold text-primary-600 dark:text-primary-400">
                {step.stepNumber}
              </div>

              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-dark-900 dark:text-white">
                    {step.name}
                  </h4>
                  {step.isOptional && (
                    <Badge variant="outline" size="xs">Optionnel</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-dark-500">
                  <span className="flex items-center gap-1">
                    <AssigneeIcon className="w-3.5 h-3.5" />
                    {assigneeConfig?.label}
                  </span>
                  {step.durationHours && (
                    <span className="flex items-center gap-1">
                      <Timer className="w-3.5 h-3.5" />
                      ~{step.durationHours}h
                    </span>
                  )}
                </div>
              </div>

              <ChevronDown
                className={cn(
                  'w-5 h-5 text-dark-400 transition-transform',
                  isExpanded && 'rotate-180'
                )}
              />
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 border-t border-dark-100 dark:border-dark-700 bg-dark-50 dark:bg-dark-800/50">
                    {step.description && (
                      <p className="text-sm text-dark-600 dark:text-dark-300 mb-4">
                        {step.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-dark-500 mb-1">Assignation</p>
                        <div className="flex items-center gap-2">
                          <AssigneeIcon className="w-4 h-4 text-dark-400" />
                          <span className="text-dark-900 dark:text-white">
                            {assigneeConfig?.label}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-dark-500 mb-1">Durée estimée</p>
                        <p className="text-dark-900 dark:text-white">
                          {step.durationHours ? `${step.durationHours} heure(s)` : 'Non définie'}
                        </p>
                      </div>

                      {step.form && (
                        <div>
                          <p className="text-dark-500 mb-1">Formulaire</p>
                          <p className="text-dark-900 dark:text-white flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {step.form.name}
                          </p>
                        </div>
                      )}

                      {step.requiredDocuments && step.requiredDocuments.length > 0 && (
                        <div>
                          <p className="text-dark-500 mb-1">Documents requis</p>
                          <div className="flex flex-wrap gap-1">
                            {step.requiredDocuments.map((doc) => (
                              <Badge key={doc.id} variant="outline" size="xs">
                                {doc.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};

const ExecutionItem: React.FC<{ execution: ProcedureExecution }> = ({ execution }) => {
  const statusConfig = executionStatusConfig[execution.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Badge className={statusConfig.color} size="sm">
            {statusConfig.label}
          </Badge>
          <span className="text-xs text-dark-500">
            Étape {execution.currentStepNumber}
          </span>
        </div>
        {execution.event && (
          <p className="text-sm text-dark-900 dark:text-white">
            {execution.event.title}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1 text-xs text-dark-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatRelativeTime(execution.startedAt)}
          </span>
          {execution.startedBy && (
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {getFullName(execution.startedBy.firstName, execution.startedBy.lastName)}
            </span>
          )}
        </div>
      </div>

      <IconButton
        variant="ghost"
        size="sm"
        icon={<ExternalLink className="w-4 h-4" />}
        aria-label="Voir détails"
      />
    </motion.div>
  );
};

// ===========================================
// Main Component
// ===========================================

export const ProcedureDetailPage: React.FC<ProcedureDetailPageProps> = ({
  procedureId,
  onBack,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState('workflow');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');
  const [startExecutionModalOpen, setStartExecutionModalOpen] = useState(false);

  // Queries
  const { data: procedure, isLoading } = useProcedure(procedureId);
  const { data: executionsData } = useProcedureExecutions({ procedureId });
  const deleteProcedure = useDeleteProcedure();
  const duplicateProcedure = useDuplicateProcedure();
  const startExecution = useStartProcedureExecution();

  const executions = executionsData?.items || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48 rounded-xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!procedure) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Procédure non trouvée"
        description="La procédure demandée n'existe pas ou a été supprimée."
        action={{
          label: 'Retour à la liste',
          onClick: onBack,
        }}
      />
    );
  }

  const typeConfig = procedureTypeConfig[procedure.type];
  const TypeIcon = typeConfig.icon;
  const triggerConfig = triggerTypeConfig[procedure.triggerType];
  const TriggerIcon = triggerConfig.icon;

  const handleDelete = async () => {
    try {
      await deleteProcedure.mutateAsync(procedureId);
      onBack();
    } catch {
      // Error handled by hook
    }
  };

  const handleDuplicate = async () => {
    if (!duplicateName.trim()) return;
    try {
      await duplicateProcedure.mutateAsync({
        id: procedureId,
        newName: duplicateName.trim(),
      });
      setDuplicateModalOpen(false);
      setDuplicateName('');
    } catch {
      // Error handled by hook
    }
  };

  const tabs: TabItem[] = [
    { id: 'workflow', label: 'Workflow', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'steps', label: 'Étapes', icon: <Layers className="w-4 h-4" />, badge: procedure.steps?.length },
    { id: 'executions', label: 'Exécutions', icon: <Activity className="w-4 h-4" />, badge: executions.length },
    { id: 'stats', label: 'Statistiques', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  // Calculate stats
  const completedExecutions = executions.filter((e) => e.status === 'COMPLETED').length;
  const inProgressExecutions = executions.filter((e) => e.status === 'IN_PROGRESS').length;
  const completionRate = executions.length > 0 ? Math.round((completedExecutions / executions.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <span className="text-dark-300">/</span>
        <span className="text-sm font-mono text-dark-500">{procedure.code}</span>
      </div>

      {/* Procedure Header Card */}
      <Card variant="gradient" className="overflow-hidden">
        <div className="relative p-6">
          {/* Type strip */}
          <div
            className={cn(
              'absolute top-0 left-0 w-full h-1',
              typeConfig.color.replace('text-', 'bg-')
            )}
          />

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className={cn('flex items-center gap-1.5', typeConfig.bg, typeConfig.color)}>
                  <TypeIcon className="w-3.5 h-3.5" />
                  {typeConfig.label}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1.5">
                  <TriggerIcon className="w-3.5 h-3.5" />
                  {triggerConfig.label}
                </Badge>
                {procedure.category && (
                  <Badge
                    variant="outline"
                    style={{
                      backgroundColor: `${procedure.category.color}15`,
                      borderColor: procedure.category.color,
                      color: procedure.category.color,
                    }}
                  >
                    {procedure.category.name}
                  </Badge>
                )}
                <Badge variant={procedure.isActive ? 'success' : 'default'} dot>
                  {procedure.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">
                {procedure.name}
              </h1>

              {/* Description */}
              {procedure.description && (
                <p className="text-dark-600 dark:text-dark-300 mb-4">
                  {procedure.description}
                </p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-dark-500 dark:text-dark-400">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>{procedure.steps?.length || 0} étape(s)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  <span>{executions.length} exécution(s)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Target className="w-4 h-4" />
                  <span>{completionRate}% de réussite</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>Créée le {formatDate(procedure.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {procedure.triggerType === 'MANUAL' && procedure.isActive && (
                <Button onClick={() => setStartExecutionModalOpen(true)}>
                  <Play className="w-4 h-4 mr-2" />
                  Démarrer
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => {
                setDuplicateName(`${procedure.name} (copie)`);
                setDuplicateModalOpen(true);
              }}>
                <Copy className="w-4 h-4 mr-2" />
                Dupliquer
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
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Play className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark-900 dark:text-white">
                {inProgressExecutions}
              </p>
              <p className="text-xs text-dark-500">En cours</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark-900 dark:text-white">
                {completedExecutions}
              </p>
              <p className="text-xs text-dark-500">Terminées</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark-900 dark:text-white">
                {completionRate}%
              </p>
              <p className="text-xs text-dark-500">Taux réussite</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Layers className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark-900 dark:text-white">
                {procedure.steps?.length || 0}
              </p>
              <p className="text-xs text-dark-500">Étapes</p>
            </div>
          </div>
        </Card>
      </div>

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
          {activeTab === 'workflow' && (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h3 className="font-semibold text-dark-900 dark:text-white">
                  Diagramme du workflow
                </h3>
              </CardHeader>
              <CardBody>
                <WorkflowDiagram steps={procedure.steps || []} />
              </CardBody>
            </Card>
          )}

          {activeTab === 'steps' && (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h3 className="font-semibold text-dark-900 dark:text-white">
                  Liste des étapes
                </h3>
                <Button size="sm" onClick={onEdit}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Modifier les étapes
                </Button>
              </CardHeader>
              <CardBody>
                <StepsList steps={procedure.steps || []} />
              </CardBody>
            </Card>
          )}

          {activeTab === 'executions' && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-dark-900 dark:text-white">
                  Historique des exécutions
                </h3>
              </CardHeader>
              <CardBody>
                {executions.length > 0 ? (
                  <div className="space-y-3">
                    {executions.map((execution) => (
                      <ExecutionItem key={execution.id} execution={execution} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Activity}
                    title="Aucune exécution"
                    description="Cette procédure n'a pas encore été exécutée."
                    size="sm"
                  />
                )}
              </CardBody>
            </Card>
          )}

          {activeTab === 'stats' && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-dark-900 dark:text-white">
                  Statistiques de la procédure
                </h3>
              </CardHeader>
              <CardBody>
                <div className="text-center py-12 text-dark-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Les statistiques détaillées seront disponibles prochainement.</p>
                </div>
              </CardBody>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer la procédure"
        message={`Êtes-vous sûr de vouloir supprimer la procédure "${procedure.name}" ? Cette action désactivera la procédure.`}
        confirmText="Supprimer"
        variant="danger"
        isLoading={deleteProcedure.isPending}
      />

      {/* Duplicate Modal */}
      <Modal
        isOpen={duplicateModalOpen}
        onClose={() => {
          setDuplicateModalOpen(false);
          setDuplicateName('');
        }}
        title="Dupliquer la procédure"
        size="sm"
      >
        <ModalBody>
          <p className="text-dark-600 dark:text-dark-300 mb-4">
            Créer une copie de "{procedure.name}" avec un nouveau nom.
          </p>
          <input
            type="text"
            value={duplicateName}
            onChange={(e) => setDuplicateName(e.target.value)}
            placeholder="Nom de la nouvelle procédure"
            className="w-full px-4 py-2 rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-white"
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

      {/* Start Execution Modal */}
      <Modal
        isOpen={startExecutionModalOpen}
        onClose={() => setStartExecutionModalOpen(false)}
        title="Démarrer la procédure"
        size="sm"
      >
        <ModalBody>
          <p className="text-dark-600 dark:text-dark-300 mb-4">
            Pour démarrer cette procédure, vous devez la lier à un événement sanitaire existant.
          </p>
          <p className="text-sm text-dark-500">
            Cette fonctionnalité sera disponible prochainement.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setStartExecutionModalOpen(false)}>
            Fermer
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ProcedureDetailPage;
