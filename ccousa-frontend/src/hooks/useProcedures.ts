import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { toast } from '../components/ui';
import { handleApiError } from '../services/api';
import {
  proceduresService,
  procedureStepsService,
  procedureGroupsService,
  procedureExecutionsService,
  procedureTemplatesService,
  ProcedureQueryParams,
  ExecutionQueryParams,
  CreateProcedureData,
  UpdateProcedureData,
  CreateStepData,
  UpdateStepData,
} from '../services/procedures.service';
import type { ProcedureGroup } from '../types';

// ===========================================
// Query Keys
// ===========================================

export const procedureKeys = {
  all: ['procedures'] as const,
  lists: () => [...procedureKeys.all, 'list'] as const,
  list: (params?: ProcedureQueryParams) => [...procedureKeys.lists(), params] as const,
  details: () => [...procedureKeys.all, 'detail'] as const,
  detail: (id: string) => [...procedureKeys.details(), id] as const,
  stats: () => [...procedureKeys.all, 'stats'] as const,
  steps: (procedureId: string) => [...procedureKeys.all, 'steps', procedureId] as const,
  step: (procedureId: string, stepId: string) => [...procedureKeys.steps(procedureId), stepId] as const,
  groups: () => [...procedureKeys.all, 'groups'] as const,
  group: (id: string) => [...procedureKeys.groups(), id] as const,
  executions: () => [...procedureKeys.all, 'executions'] as const,
  executionList: (params?: ExecutionQueryParams) => [...procedureKeys.executions(), 'list', params] as const,
  execution: (id: string) => [...procedureKeys.executions(), id] as const,
  executionsByEvent: (eventId: string) => [...procedureKeys.executions(), 'event', eventId] as const,
  executionTimeline: (id: string) => [...procedureKeys.executions(), id, 'timeline'] as const,
  templates: () => [...procedureKeys.all, 'templates'] as const,
  publicTemplates: () => [...procedureKeys.templates(), 'public'] as const,
  myTemplates: () => [...procedureKeys.templates(), 'mine'] as const,
};

// ===========================================
// Procedures Hooks
// ===========================================

export function useProcedures(params?: ProcedureQueryParams) {
  return useQuery({
    queryKey: procedureKeys.list(params),
    queryFn: () => proceduresService.getAll(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useInfiniteProcedures(params?: Omit<ProcedureQueryParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: [...procedureKeys.lists(), 'infinite', params],
    queryFn: ({ pageParam = 1 }) => proceduresService.getAll({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    getPreviousPageParam: (firstPage) => (firstPage.hasPrevious ? firstPage.page - 1 : undefined),
  });
}

export function useProcedure(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: procedureKeys.detail(id),
    queryFn: () => proceduresService.getById(id),
    enabled: !!id && (options?.enabled ?? true),
  });
}

export function useProcedureStats() {
  return useQuery({
    queryKey: procedureKeys.stats(),
    queryFn: () => proceduresService.getStats(),
  });
}

export function useCreateProcedure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProcedureData) => proceduresService.create(data),
    onSuccess: (newProcedure) => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.lists() });
      queryClient.invalidateQueries({ queryKey: procedureKeys.stats() });
      toast.success('Procédure créée', `La procédure "${newProcedure.name}" a été créée avec succès.`);
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useUpdateProcedure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProcedureData }) => proceduresService.update(id, data),
    onSuccess: (updatedProcedure) => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.lists() });
      queryClient.invalidateQueries({ queryKey: procedureKeys.detail(updatedProcedure.id) });
      queryClient.invalidateQueries({ queryKey: procedureKeys.stats() });
      toast.success('Procédure mise à jour');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useDeleteProcedure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => proceduresService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.lists() });
      queryClient.invalidateQueries({ queryKey: procedureKeys.stats() });
      toast.success('Procédure supprimée');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useDuplicateProcedure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) => proceduresService.duplicate(id, newName),
    onSuccess: (newProcedure) => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.lists() });
      toast.success('Procédure dupliquée', `La procédure "${newProcedure.name}" a été créée.`);
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useValidateProcedure() {
  return useMutation({
    mutationFn: (id: string) => proceduresService.validate(id),
    onSuccess: (result) => {
      if (result.valid) {
        toast.success('Validation réussie', 'La procédure est valide et prête à être utilisée.');
      } else {
        toast.warning('Validation échouée', `${result.errors.length} erreur(s) trouvée(s).`);
      }
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

// ===========================================
// Procedure Steps Hooks
// ===========================================

export function useProcedureSteps(procedureId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: procedureKeys.steps(procedureId),
    queryFn: () => procedureStepsService.getAll(procedureId),
    enabled: !!procedureId && (options?.enabled ?? true),
  });
}

export function useCreateProcedureStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ procedureId, data }: { procedureId: string; data: CreateStepData }) =>
      procedureStepsService.create(procedureId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.steps(variables.procedureId) });
      queryClient.invalidateQueries({ queryKey: procedureKeys.detail(variables.procedureId) });
      toast.success('Étape ajoutée');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useUpdateProcedureStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ procedureId, stepId, data }: { procedureId: string; stepId: string; data: UpdateStepData }) =>
      procedureStepsService.update(procedureId, stepId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.steps(variables.procedureId) });
      queryClient.invalidateQueries({ queryKey: procedureKeys.detail(variables.procedureId) });
      toast.success('Étape mise à jour');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useDeleteProcedureStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ procedureId, stepId }: { procedureId: string; stepId: string }) =>
      procedureStepsService.delete(procedureId, stepId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.steps(variables.procedureId) });
      queryClient.invalidateQueries({ queryKey: procedureKeys.detail(variables.procedureId) });
      toast.success('Étape supprimée');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useReorderProcedureSteps() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ procedureId, stepIds }: { procedureId: string; stepIds: string[] }) =>
      procedureStepsService.reorder(procedureId, stepIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.steps(variables.procedureId) });
      queryClient.invalidateQueries({ queryKey: procedureKeys.detail(variables.procedureId) });
      toast.success('Ordre des étapes mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useBulkUpdateProcedureSteps() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ procedureId, steps }: { procedureId: string; steps: Array<{ id?: string } & CreateStepData> }) =>
      procedureStepsService.bulkUpdate(procedureId, steps),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.steps(variables.procedureId) });
      queryClient.invalidateQueries({ queryKey: procedureKeys.detail(variables.procedureId) });
      toast.success('Étapes mises à jour');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

// ===========================================
// Procedure Groups Hooks
// ===========================================

export function useProcedureGroups(asTree = false) {
  return useQuery({
    queryKey: [...procedureKeys.groups(), { asTree }],
    queryFn: () => procedureGroupsService.getAll(asTree),
  });
}

export function useProcedureGroup(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: procedureKeys.group(id),
    queryFn: () => procedureGroupsService.getById(id),
    enabled: !!id && (options?.enabled ?? true),
  });
}

export function useCreateProcedureGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<ProcedureGroup, 'id' | 'createdAt' | 'updatedAt'>) =>
      procedureGroupsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.groups() });
      toast.success('Groupe créé');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useUpdateProcedureGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProcedureGroup> }) =>
      procedureGroupsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.groups() });
      toast.success('Groupe mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useDeleteProcedureGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => procedureGroupsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.groups() });
      toast.success('Groupe supprimé');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

// ===========================================
// Procedure Executions Hooks
// ===========================================

export function useProcedureExecutions(params?: ExecutionQueryParams) {
  return useQuery({
    queryKey: procedureKeys.executionList(params),
    queryFn: () => procedureExecutionsService.getAll(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useProcedureExecution(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: procedureKeys.execution(id),
    queryFn: () => procedureExecutionsService.getById(id),
    enabled: !!id && (options?.enabled ?? true),
  });
}

export function useEventProcedureExecutions(eventId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: procedureKeys.executionsByEvent(eventId),
    queryFn: () => procedureExecutionsService.getByEventId(eventId),
    enabled: !!eventId && (options?.enabled ?? true),
  });
}

export function useProcedureExecutionTimeline(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: procedureKeys.executionTimeline(id),
    queryFn: () => procedureExecutionsService.getTimeline(id),
    enabled: !!id && (options?.enabled ?? true),
  });
}

export function useStartProcedureExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ procedureId, eventId }: { procedureId: string; eventId: string }) =>
      procedureExecutionsService.start(procedureId, eventId),
    onSuccess: (_execution, variables) => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.executions() });
      queryClient.invalidateQueries({ queryKey: procedureKeys.executionsByEvent(variables.eventId) });
      toast.success('Procédure démarrée', 'L\'exécution de la procédure a commencé.');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useCancelProcedureExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      procedureExecutionsService.cancel(id, reason),
    onSuccess: (execution) => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.executions() });
      queryClient.invalidateQueries({ queryKey: procedureKeys.execution(execution.id) });
      toast.success('Exécution annulée');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useAdvanceExecutionStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      procedureExecutionsService.advanceStep(id, notes),
    onSuccess: (execution) => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.execution(execution.id) });
      queryClient.invalidateQueries({ queryKey: procedureKeys.executionTimeline(execution.id) });
      toast.success('Étape suivante');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useCompleteExecutionStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      executionId,
      stepExecutionId,
      notes,
      formSubmissionId,
    }: {
      executionId: string;
      stepExecutionId: string;
      notes?: string;
      formSubmissionId?: string;
    }) => procedureExecutionsService.completeStep(executionId, stepExecutionId, { notes, formSubmissionId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.execution(variables.executionId) });
      queryClient.invalidateQueries({ queryKey: procedureKeys.executionTimeline(variables.executionId) });
      toast.success('Étape terminée');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useSkipExecutionStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      executionId,
      stepExecutionId,
      reason,
    }: {
      executionId: string;
      stepExecutionId: string;
      reason: string;
    }) => procedureExecutionsService.skipStep(executionId, stepExecutionId, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.execution(variables.executionId) });
      queryClient.invalidateQueries({ queryKey: procedureKeys.executionTimeline(variables.executionId) });
      toast.success('Étape sautée');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useAssignExecutionStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      executionId,
      stepExecutionId,
      assignedToId,
    }: {
      executionId: string;
      stepExecutionId: string;
      assignedToId: string;
    }) => procedureExecutionsService.assignStep(executionId, stepExecutionId, assignedToId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.execution(variables.executionId) });
      toast.success('Étape assignée');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

// ===========================================
// Procedure Templates Hooks
// ===========================================

export function usePublicProcedureTemplates() {
  return useQuery({
    queryKey: procedureKeys.publicTemplates(),
    queryFn: () => procedureTemplatesService.getPublic(),
  });
}

export function useMyProcedureTemplates() {
  return useQuery({
    queryKey: procedureKeys.myTemplates(),
    queryFn: () => procedureTemplatesService.getMine(),
  });
}

export function useCreateProcedureTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ procedureId, isPublic }: { procedureId: string; isPublic: boolean }) =>
      procedureTemplatesService.createFromProcedure(procedureId, isPublic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.templates() });
      toast.success('Modèle créé');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useImportProcedureTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (template: Parameters<typeof proceduresService.importFromTemplate>[0]) =>
      proceduresService.importFromTemplate(template),
    onSuccess: (newProcedure) => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.lists() });
      toast.success('Procédure importée', `La procédure "${newProcedure.name}" a été créée.`);
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useDeleteProcedureTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => procedureTemplatesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procedureKeys.templates() });
      toast.success('Modèle supprimé');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

// ===========================================
// Utility Hooks
// ===========================================

export function usePrefetchProcedure() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: procedureKeys.detail(id),
      queryFn: () => proceduresService.getById(id),
      staleTime: 5 * 60 * 1000,
    });
  };
}
