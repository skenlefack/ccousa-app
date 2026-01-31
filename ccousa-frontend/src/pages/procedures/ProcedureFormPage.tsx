import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Settings2,
  Zap,
  Clock,
  CheckCircle2,
  FileText,
  Users,
  User,
  Building2,
  Play,
  Search,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Info,
  Workflow,
  Timer,
  Copy,
  X,
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
  Toggle,
  Badge,
  Modal,
  ModalBody,
  ModalFooter,
  ConfirmModal,
  Skeleton,
  EmptyState,
} from '../../components/ui';
import { cn } from '../../utils/cn';
import { formatDate } from '../../utils/format';
import {
  useProcedure,
  useCreateProcedure,
  useUpdateProcedure,
  useBulkUpdateProcedureSteps,
  useProcedureGroups,
} from '../../hooks/useProcedures';
import { useEventCategories } from '../../hooks/useSettings';
import type { Procedure, ProcedureStep } from '../../types';
import type { CreateProcedureData, CreateStepData } from '../../services/procedures.service';

// ===========================================
// Types & Constants
// ===========================================

interface ProcedureFormPageProps {
  procedureId?: string;
  onBack: () => void;
  onSuccess: (procedure: Procedure) => void;
}

interface FormData {
  code: string;
  name: string;
  description: string;
  type: Procedure['type'];
  groupId: string;
  categoryId: string;
  triggerType: Procedure['triggerType'];
  isActive: boolean;
}

interface StepFormData {
  id?: string;
  tempId: string;
  name: string;
  description: string;
  stepNumber: number;
  durationHours: string;
  isOptional: boolean;
  assigneeType: ProcedureStep['assigneeType'];
  assigneeId: string;
  formId: string;
  isExpanded: boolean;
}

const defaultFormData: FormData = {
  code: '',
  name: '',
  description: '',
  type: 'INVESTIGATION',
  groupId: '',
  categoryId: '',
  triggerType: 'MANUAL',
  isActive: true,
};

const createDefaultStep = (stepNumber: number): StepFormData => ({
  tempId: `temp-${Date.now()}-${Math.random()}`,
  name: '',
  description: '',
  stepNumber,
  durationHours: '',
  isOptional: false,
  assigneeType: 'ROLE',
  assigneeId: '',
  formId: '',
  isExpanded: true,
});

const procedureTypeOptions = [
  { value: 'INVESTIGATION', label: 'Investigation', icon: Search, color: 'text-blue-500', description: 'Enquête épidémiologique' },
  { value: 'VACCINATION', label: 'Vaccination', icon: Zap, color: 'text-emerald-500', description: 'Campagne de vaccination' },
  { value: 'INSPECTION', label: 'Inspection', icon: Eye, color: 'text-purple-500', description: 'Inspection sanitaire' },
  { value: 'SAMPLING', label: 'Prélèvement', icon: FileText, color: 'text-orange-500', description: 'Collecte d\'échantillons' },
  { value: 'TREATMENT', label: 'Traitement', icon: CheckCircle2, color: 'text-cyan-500', description: 'Procédure de traitement' },
  { value: 'OTHER', label: 'Autre', icon: Settings2, color: 'text-dark-500', description: 'Autre type de procédure' },
];

const triggerTypeOptions = [
  { value: 'MANUAL', label: 'Manuel', icon: Play, description: 'Démarrage manuel par un utilisateur' },
  { value: 'AUTOMATIC', label: 'Automatique', icon: Zap, description: 'Déclenché automatiquement par un événement' },
  { value: 'SCHEDULED', label: 'Planifié', icon: Clock, description: 'Exécution programmée' },
];

const assigneeTypeOptions = [
  { value: 'ROLE', label: 'Rôle', icon: Users, description: 'Assigné à un rôle' },
  { value: 'USER', label: 'Utilisateur', icon: User, description: 'Assigné à un utilisateur spécifique' },
  { value: 'GROUP', label: 'Groupe', icon: Users, description: 'Assigné à un groupe' },
  { value: 'UNIT', label: 'Unité', icon: Building2, description: 'Assigné à une unité organisationnelle' },
];

// ===========================================
// Helper Components
// ===========================================

const TypeSelector: React.FC<{
  value: Procedure['type'];
  onChange: (value: Procedure['type']) => void;
}> = ({ value, onChange }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
    {procedureTypeOptions.map((option) => {
      const Icon = option.icon;
      const isSelected = value === option.value;

      return (
        <motion.button
          key={option.value}
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange(option.value as Procedure['type'])}
          className={cn(
            'relative flex flex-col items-center p-4 rounded-xl border-2 transition-all text-center',
            isSelected
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-dark-200 dark:border-dark-700 hover:border-dark-300 dark:hover:border-dark-600'
          )}
        >
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center mb-2',
              isSelected ? 'bg-white dark:bg-dark-800' : 'bg-dark-100 dark:bg-dark-700'
            )}
          >
            <Icon className={cn('w-6 h-6', option.color)} />
          </div>
          <p className={cn(
            'font-medium text-sm',
            isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-dark-900 dark:text-white'
          )}>
            {option.label}
          </p>
          <p className="text-xs text-dark-500 mt-0.5">
            {option.description}
          </p>
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </motion.div>
          )}
        </motion.button>
      );
    })}
  </div>
);

const TriggerSelector: React.FC<{
  value: Procedure['triggerType'];
  onChange: (value: Procedure['triggerType']) => void;
}> = ({ value, onChange }) => (
  <div className="grid grid-cols-3 gap-3">
    {triggerTypeOptions.map((option) => {
      const Icon = option.icon;
      const isSelected = value === option.value;

      return (
        <motion.button
          key={option.value}
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange(option.value as Procedure['triggerType'])}
          className={cn(
            'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
            isSelected
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-dark-200 dark:border-dark-700 hover:border-dark-300 dark:hover:border-dark-600'
          )}
        >
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            isSelected ? 'bg-primary-500 text-white' : 'bg-dark-100 dark:bg-dark-700'
          )}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className={cn(
              'font-medium text-sm',
              isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-dark-900 dark:text-white'
            )}>
              {option.label}
            </p>
            <p className="text-xs text-dark-500">
              {option.description}
            </p>
          </div>
        </motion.button>
      );
    })}
  </div>
);

const StepCard: React.FC<{
  step: StepFormData;
  index: number;
  totalSteps: number;
  onUpdate: (data: Partial<StepFormData>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}> = ({ step, index, totalSteps, onUpdate, onDelete, onDuplicate }) => {
  const assigneeConfig = assigneeTypeOptions.find((a) => a.value === step.assigneeType);

  return (
    <Reorder.Item value={step} id={step.tempId || step.id}>
      <motion.div
        layout
        className={cn(
          'border rounded-xl overflow-hidden transition-all',
          step.isExpanded
            ? 'border-primary-300 dark:border-primary-700 bg-white dark:bg-dark-800'
            : 'border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800'
        )}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 p-4 cursor-pointer hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors"
          onClick={() => onUpdate({ isExpanded: !step.isExpanded })}
        >
          <div className="cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
            <GripVertical className="w-5 h-5 text-dark-400" />
          </div>

          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center font-bold text-primary-600 dark:text-primary-400">
            {index + 1}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-dark-900 dark:text-white truncate">
                {step.name || 'Nouvelle étape'}
              </h4>
              {step.isOptional && (
                <Badge variant="outline" size="xs">Optionnel</Badge>
              )}
            </div>
            {!step.isExpanded && step.description && (
              <p className="text-sm text-dark-500 truncate mt-0.5">
                {step.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step.durationHours && (
              <span className="text-xs text-dark-500 flex items-center gap-1">
                <Timer className="w-3.5 h-3.5" />
                {step.durationHours}h
              </span>
            )}
            <IconButton
              variant="ghost"
              size="sm"
              icon={<Copy className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              aria-label="Dupliquer"
            />
            <IconButton
              variant="ghost"
              size="sm"
              icon={<Trash2 className="w-4 h-4 text-red-500" />}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label="Supprimer"
              disabled={totalSteps <= 1}
            />
            {step.isExpanded ? (
              <ChevronUp className="w-5 h-5 text-dark-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-dark-400" />
            )}
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {step.isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0 border-t border-dark-100 dark:border-dark-700 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nom de l'étape"
                    value={step.name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                    placeholder="Ex: Collecte des informations"
                  />
                  <Input
                    label="Durée estimée (heures)"
                    type="number"
                    value={step.durationHours}
                    onChange={(e) => onUpdate({ durationHours: e.target.value })}
                    placeholder="Ex: 2"
                    min="0"
                    step="0.5"
                  />
                </div>

                <Textarea
                  label="Description"
                  value={step.description}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                  placeholder="Décrivez les actions à effectuer..."
                  rows={2}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Type d'assignation"
                    value={step.assigneeType}
                    onChange={(value) => onUpdate({ assigneeType: value as ProcedureStep['assigneeType'] })}
                    options={assigneeTypeOptions.map((a) => ({
                      value: a.value,
                      label: a.label,
                      description: a.description,
                    }))}
                  />
                  <Select
                    label="Formulaire associé"
                    value={step.formId}
                    onChange={(value) => onUpdate({ formId: value })}
                    options={[
                      { value: '', label: 'Aucun formulaire' },
                      // Forms would be loaded dynamically
                    ]}
                    placeholder="Sélectionner un formulaire"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-dark-50 dark:bg-dark-700/50">
                  <div>
                    <p className="font-medium text-dark-900 dark:text-white text-sm">
                      Étape optionnelle
                    </p>
                    <p className="text-xs text-dark-500">
                      Cette étape peut être sautée lors de l'exécution
                    </p>
                  </div>
                  <Toggle
                    checked={step.isOptional}
                    onChange={(checked) => onUpdate({ isOptional: checked })}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Reorder.Item>
  );
};

// ===========================================
// Main Component
// ===========================================

export const ProcedureFormPage: React.FC<ProcedureFormPageProps> = ({
  procedureId,
  onBack,
  onSuccess,
}) => {
  const isEditMode = !!procedureId;

  // State
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [steps, setSteps] = useState<StepFormData[]>([createDefaultStep(1)]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<'info' | 'steps'>('info');

  // Queries
  const { data: procedure, isLoading: isLoadingProcedure } = useProcedure(procedureId || '', {
    enabled: isEditMode,
  });
  const { data: categories } = useEventCategories();
  const { data: groups } = useProcedureGroups();
  const createProcedure = useCreateProcedure();
  const updateProcedure = useUpdateProcedure();
  const bulkUpdateSteps = useBulkUpdateProcedureSteps();

  // Populate form in edit mode
  useEffect(() => {
    if (procedure && isEditMode) {
      setFormData({
        code: procedure.code,
        name: procedure.name,
        description: procedure.description || '',
        type: procedure.type,
        groupId: procedure.groupId || '',
        categoryId: procedure.categoryId || '',
        triggerType: procedure.triggerType,
        isActive: procedure.isActive,
      });

      if (procedure.steps && procedure.steps.length > 0) {
        setSteps(
          procedure.steps.map((step) => ({
            id: step.id,
            tempId: step.id,
            name: step.name,
            description: step.description || '',
            stepNumber: step.stepNumber,
            durationHours: step.durationHours?.toString() || '',
            isOptional: step.isOptional,
            assigneeType: step.assigneeType,
            assigneeId: step.assigneeId || '',
            formId: step.formId || '',
            isExpanded: false,
          }))
        );
      }
    }
  }, [procedure, isEditMode]);

  // Handlers
  const handleChange = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddStep = () => {
    const newStep = createDefaultStep(steps.length + 1);
    setSteps([...steps, newStep]);
  };

  const handleUpdateStep = (index: number, data: Partial<StepFormData>) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, ...data } : step))
    );
  };

  const handleDeleteStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps((prev) => {
      const newSteps = prev.filter((_, i) => i !== index);
      return newSteps.map((step, i) => ({ ...step, stepNumber: i + 1 }));
    });
  };

  const handleDuplicateStep = (index: number) => {
    const stepToDuplicate = steps[index];
    const newStep: StepFormData = {
      ...stepToDuplicate,
      id: undefined,
      tempId: `temp-${Date.now()}-${Math.random()}`,
      name: `${stepToDuplicate.name} (copie)`,
      stepNumber: steps.length + 1,
      isExpanded: true,
    };
    setSteps([...steps, newStep]);
  };

  const handleReorderSteps = (newOrder: StepFormData[]) => {
    setSteps(newOrder.map((step, i) => ({ ...step, stepNumber: i + 1 })));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!isEditMode && !formData.code.trim()) {
      newErrors.code = 'Le code est requis';
    } else if (!isEditMode && !/^[A-Z][A-Z0-9_-]{2,19}$/.test(formData.code)) {
      newErrors.code = 'Code invalide (majuscules, 3-20 caractères)';
    }

    // Validate steps
    const emptySteps = steps.filter((s) => !s.name.trim());
    if (emptySteps.length > 0) {
      newErrors.steps = 'Toutes les étapes doivent avoir un nom';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const stepsData: CreateStepData[] = steps.map((step) => ({
      name: step.name.trim(),
      description: step.description.trim() || undefined,
      stepNumber: step.stepNumber,
      durationHours: step.durationHours ? parseFloat(step.durationHours) : undefined,
      isOptional: step.isOptional,
      assigneeType: step.assigneeType,
      assigneeId: step.assigneeId || undefined,
      formId: step.formId || undefined,
    }));

    try {
      let result: Procedure;

      if (isEditMode && procedureId) {
        // Update procedure
        result = await updateProcedure.mutateAsync({
          id: procedureId,
          data: {
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            type: formData.type,
            groupId: formData.groupId || undefined,
            categoryId: formData.categoryId || undefined,
            triggerType: formData.triggerType,
            isActive: formData.isActive,
          },
        });

        // Update steps
        await bulkUpdateSteps.mutateAsync({
          procedureId,
          steps: steps.map((step) => ({
            id: step.id,
            name: step.name.trim(),
            description: step.description.trim() || undefined,
            stepNumber: step.stepNumber,
            durationHours: step.durationHours ? parseFloat(step.durationHours) : undefined,
            isOptional: step.isOptional,
            assigneeType: step.assigneeType,
            assigneeId: step.assigneeId || undefined,
            formId: step.formId || undefined,
          })),
        });
      } else {
        // Create new procedure with steps
        result = await createProcedure.mutateAsync({
          code: formData.code.trim(),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          type: formData.type,
          groupId: formData.groupId || undefined,
          categoryId: formData.categoryId || undefined,
          triggerType: formData.triggerType,
          steps: stepsData,
        });
      }

      onSuccess(result);
    } catch {
      // Error handled by hooks
    }
  };

  // Options
  const categoryOptions = useMemo(() => [
    { value: '', label: 'Aucune catégorie' },
    ...(categories || []).map((c) => ({ value: c.id, label: c.name })),
  ], [categories]);

  const groupOptions = useMemo(() => [
    { value: '', label: 'Aucun groupe' },
    ...(groups || []).map((g) => ({ value: g.id, label: g.name })),
  ], [groups]);

  const isSubmitting = createProcedure.isPending || updateProcedure.isPending || bulkUpdateSteps.isPending;
  const isLoading = isLoadingProcedure && isEditMode;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48 rounded-xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (isEditMode && !procedure && !isLoadingProcedure) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
              {isEditMode ? 'Modifier la procédure' : 'Nouvelle procédure'}
            </h1>
            <p className="text-dark-500 dark:text-dark-400">
              {isEditMode ? `Modification de ${procedure?.code}` : 'Créez un nouveau workflow de procédure'}
            </p>
          </div>
        </div>
        <Button onClick={handleSubmit} isLoading={isSubmitting}>
          <Save className="w-4 h-4 mr-2" />
          {isEditMode ? 'Enregistrer' : 'Créer'}
        </Button>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-2 p-1 bg-dark-100 dark:bg-dark-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveSection('info')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeSection === 'info'
              ? 'bg-white dark:bg-dark-700 text-dark-900 dark:text-white shadow'
              : 'text-dark-500 hover:text-dark-700 dark:hover:text-dark-300'
          )}
        >
          Informations
        </button>
        <button
          onClick={() => setActiveSection('steps')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
            activeSection === 'steps'
              ? 'bg-white dark:bg-dark-700 text-dark-900 dark:text-white shadow'
              : 'text-dark-500 hover:text-dark-700 dark:hover:text-dark-300'
          )}
        >
          Étapes du workflow
          <Badge variant="primary" size="xs">{steps.length}</Badge>
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeSection === 'info' ? (
          <motion.div
            key="info"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-dark-900 dark:text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary-500" />
                  Informations générales
                </h3>
              </CardHeader>
              <CardBody className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!isEditMode && (
                    <Input
                      label="Code"
                      value={formData.code}
                      onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                      placeholder="PROC_INVEST_001"
                      error={errors.code}
                      helperText="Identifiant unique (majuscules)"
                    />
                  )}
                  <Input
                    label="Nom de la procédure"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Investigation épidémiologique standard"
                    error={errors.name}
                    className={isEditMode ? 'md:col-span-2' : ''}
                  />
                </div>

                <Textarea
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Décrivez l'objectif et le contexte d'utilisation de cette procédure..."
                  rows={3}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Catégorie d'événement"
                    value={formData.categoryId}
                    onChange={(value) => handleChange('categoryId', value)}
                    options={categoryOptions}
                  />
                  <Select
                    label="Groupe de procédures"
                    value={formData.groupId}
                    onChange={(value) => handleChange('groupId', value)}
                    options={groupOptions}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-dark-50 dark:bg-dark-700/50">
                  <div>
                    <p className="font-medium text-dark-900 dark:text-white">
                      Procédure active
                    </p>
                    <p className="text-sm text-dark-500">
                      Une procédure inactive ne peut pas être démarrée
                    </p>
                  </div>
                  <Toggle
                    checked={formData.isActive}
                    onChange={(checked) => handleChange('isActive', checked)}
                  />
                </div>
              </CardBody>
            </Card>

            {/* Type Selection */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-dark-900 dark:text-white flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-primary-500" />
                  Type de procédure
                </h3>
              </CardHeader>
              <CardBody>
                <TypeSelector
                  value={formData.type}
                  onChange={(value) => handleChange('type', value)}
                />
              </CardBody>
            </Card>

            {/* Trigger Type */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-dark-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary-500" />
                  Mode de déclenchement
                </h3>
              </CardHeader>
              <CardBody>
                <TriggerSelector
                  value={formData.triggerType}
                  onChange={(value) => handleChange('triggerType', value)}
                />
              </CardBody>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="steps"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-dark-900 dark:text-white flex items-center gap-2">
                    <Workflow className="w-5 h-5 text-primary-500" />
                    Étapes du workflow
                  </h3>
                  <p className="text-sm text-dark-500 mt-1">
                    Glissez-déposez pour réorganiser les étapes
                  </p>
                </div>
                <Button size="sm" onClick={handleAddStep}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une étape
                </Button>
              </CardHeader>
              <CardBody>
                {errors.steps && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.steps}
                  </div>
                )}

                <Reorder.Group
                  axis="y"
                  values={steps}
                  onReorder={handleReorderSteps}
                  className="space-y-3"
                >
                  {steps.map((step, index) => (
                    <StepCard
                      key={step.tempId || step.id}
                      step={step}
                      index={index}
                      totalSteps={steps.length}
                      onUpdate={(data) => handleUpdateStep(index, data)}
                      onDelete={() => handleDeleteStep(index)}
                      onDuplicate={() => handleDuplicateStep(index)}
                    />
                  ))}
                </Reorder.Group>

                {steps.length === 0 && (
                  <EmptyState
                    icon={Workflow}
                    title="Aucune étape"
                    description="Ajoutez des étapes pour construire votre workflow."
                    action={{
                      label: 'Ajouter une étape',
                      onClick: handleAddStep,
                    }}
                    size="sm"
                  />
                )}
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProcedureFormPage;
