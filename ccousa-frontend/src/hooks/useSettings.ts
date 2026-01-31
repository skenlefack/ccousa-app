import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../components/ui';
import { handleApiError } from '../services/api';
import {
  systemConfigService,
  eventCategoryService,
  documentTypeService,
  organizationalUnitService,
  workScheduleService,
  referenceDataService,
} from '../services/settings.service';
import type {
  EventCategory,
  DocumentType,
  OrganizationalUnit,
  WorkSchedule,
  WorkScheduleDay,
} from '../types';

// Flexible type for work schedule data (days without id/workScheduleId)
type WorkScheduleInput = Omit<WorkSchedule, 'id' | 'createdAt' | 'updatedAt' | 'days'> & {
  days?: Array<Omit<WorkScheduleDay, 'id' | 'workScheduleId'>>;
};

// Query Keys
export const settingsKeys = {
  all: ['settings'] as const,
  systemConfigs: () => [...settingsKeys.all, 'system-configs'] as const,
  eventCategories: () => [...settingsKeys.all, 'event-categories'] as const,
  eventCategory: (id: string) => [...settingsKeys.eventCategories(), id] as const,
  documentTypes: () => [...settingsKeys.all, 'document-types'] as const,
  documentType: (id: string) => [...settingsKeys.documentTypes(), id] as const,
  organizationalUnits: () => [...settingsKeys.all, 'organizational-units'] as const,
  organizationalUnit: (id: string) => [...settingsKeys.organizationalUnits(), id] as const,
  workSchedules: () => [...settingsKeys.all, 'work-schedules'] as const,
  workSchedule: (id: string) => [...settingsKeys.workSchedules(), id] as const,
  referenceData: () => [...settingsKeys.all, 'reference-data'] as const,
  languages: () => [...settingsKeys.referenceData(), 'languages'] as const,
  countries: () => [...settingsKeys.referenceData(), 'countries'] as const,
  timezones: () => [...settingsKeys.referenceData(), 'timezones'] as const,
};

// ===========================================
// System Configuration Hooks
// ===========================================

export function useSystemConfigs() {
  return useQuery({
    queryKey: settingsKeys.systemConfigs(),
    queryFn: systemConfigService.getAll,
  });
}

export function useUpdateSystemConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      systemConfigService.update(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.systemConfigs() });
      toast.success('Configuration mise à jour');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useBulkUpdateSystemConfigs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (configs: Array<{ key: string; value: string }>) =>
      systemConfigService.bulkUpdate(configs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.systemConfigs() });
      toast.success('Configurations mises à jour');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

// ===========================================
// Event Categories Hooks
// ===========================================

export function useEventCategories(includeInactive = false) {
  return useQuery({
    queryKey: [...settingsKeys.eventCategories(), { includeInactive }],
    queryFn: () => eventCategoryService.getAll(includeInactive),
  });
}

export function useEventCategory(id: string) {
  return useQuery({
    queryKey: settingsKeys.eventCategory(id),
    queryFn: () => eventCategoryService.getById(id),
    enabled: !!id,
  });
}

export function useCreateEventCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<EventCategory, 'id' | 'createdAt' | 'updatedAt'>) =>
      eventCategoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.eventCategories() });
      toast.success('Catégorie créée avec succès');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useUpdateEventCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EventCategory> }) =>
      eventCategoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.eventCategories() });
      toast.success('Catégorie mise à jour');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useDeleteEventCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => eventCategoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.eventCategories() });
      toast.success('Catégorie supprimée');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

// ===========================================
// Document Types Hooks
// ===========================================

export function useDocumentTypes(includeInactive = false) {
  return useQuery({
    queryKey: [...settingsKeys.documentTypes(), { includeInactive }],
    queryFn: () => documentTypeService.getAll(includeInactive),
  });
}

export function useDocumentType(id: string) {
  return useQuery({
    queryKey: settingsKeys.documentType(id),
    queryFn: () => documentTypeService.getById(id),
    enabled: !!id,
  });
}

export function useCreateDocumentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<DocumentType, 'id' | 'createdAt' | 'updatedAt'>) =>
      documentTypeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.documentTypes() });
      toast.success('Type de document créé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useUpdateDocumentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DocumentType> }) =>
      documentTypeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.documentTypes() });
      toast.success('Type de document mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useDeleteDocumentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentTypeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.documentTypes() });
      toast.success('Type de document supprimé');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

// ===========================================
// Organizational Units Hooks
// ===========================================

export function useOrganizationalUnits(asTree = false) {
  return useQuery({
    queryKey: [...settingsKeys.organizationalUnits(), { asTree }],
    queryFn: () => organizationalUnitService.getAll(asTree),
  });
}

export function useOrganizationalUnit(id: string) {
  return useQuery({
    queryKey: settingsKeys.organizationalUnit(id),
    queryFn: () => organizationalUnitService.getById(id),
    enabled: !!id,
  });
}

export function useCreateOrganizationalUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<OrganizationalUnit, 'id' | 'createdAt' | 'updatedAt'>) =>
      organizationalUnitService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.organizationalUnits() });
      toast.success('Unité organisationnelle créée');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useUpdateOrganizationalUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OrganizationalUnit> }) =>
      organizationalUnitService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.organizationalUnits() });
      toast.success('Unité organisationnelle mise à jour');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useDeleteOrganizationalUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => organizationalUnitService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.organizationalUnits() });
      toast.success('Unité organisationnelle supprimée');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

// ===========================================
// Work Schedules Hooks
// ===========================================

export function useWorkSchedules() {
  return useQuery({
    queryKey: settingsKeys.workSchedules(),
    queryFn: workScheduleService.getAll,
  });
}

export function useWorkSchedule(id: string) {
  return useQuery({
    queryKey: settingsKeys.workSchedule(id),
    queryFn: () => workScheduleService.getById(id),
    enabled: !!id,
  });
}

export function useCreateWorkSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WorkScheduleInput) =>
      workScheduleService.create(data as Parameters<typeof workScheduleService.create>[0]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.workSchedules() });
      toast.success('Horaire de travail créé');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useUpdateWorkSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkScheduleInput> }) =>
      workScheduleService.update(id, data as Partial<WorkSchedule>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.workSchedules() });
      toast.success('Horaire de travail mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useDeleteWorkSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workScheduleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.workSchedules() });
      toast.success('Horaire de travail supprimé');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

// ===========================================
// Reference Data Hooks
// ===========================================

export function useReferenceData() {
  return useQuery({
    queryKey: settingsKeys.referenceData(),
    queryFn: referenceDataService.getAll,
    staleTime: 1000 * 60 * 60, // 1 hour - reference data rarely changes
  });
}

export function useLanguages() {
  return useQuery({
    queryKey: settingsKeys.languages(),
    queryFn: referenceDataService.getLanguages,
    staleTime: 1000 * 60 * 60,
  });
}

export function useCountries() {
  return useQuery({
    queryKey: settingsKeys.countries(),
    queryFn: referenceDataService.getCountries,
    staleTime: 1000 * 60 * 60,
  });
}

export function useTimezones() {
  return useQuery({
    queryKey: settingsKeys.timezones(),
    queryFn: referenceDataService.getTimezones,
    staleTime: 1000 * 60 * 60,
  });
}
