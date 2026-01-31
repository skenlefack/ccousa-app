import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  formsService,
  formSectionsService,
  formFieldsService,
  fieldTypesService,
  formSubmissionsService,
  formValidationService,
  FormQueryParams,
  SubmissionQueryParams,
  CreateFormData,
  UpdateFormData,
  CreateSectionData,
  UpdateSectionData,
  CreateFieldData,
  UpdateFieldData,
  CreateSubmissionData,
} from '../services/forms.service';
import { useToast } from '../components/ui';

// ===========================================
// Query Keys
// ===========================================

export const formKeys = {
  all: ['forms'] as const,
  lists: () => [...formKeys.all, 'list'] as const,
  list: (params?: FormQueryParams) => [...formKeys.lists(), params] as const,
  details: () => [...formKeys.all, 'detail'] as const,
  detail: (id: string) => [...formKeys.details(), id] as const,
  byCode: (code: string) => [...formKeys.all, 'code', code] as const,
  versions: (id: string) => [...formKeys.detail(id), 'versions'] as const,
  preview: (id: string) => [...formKeys.detail(id), 'preview'] as const,
  stats: () => [...formKeys.all, 'stats'] as const,

  // Sections
  sections: (formId: string) => [...formKeys.detail(formId), 'sections'] as const,
  section: (formId: string, sectionId: string) => [...formKeys.sections(formId), sectionId] as const,

  // Fields
  fields: (formId: string, sectionId: string) => [...formKeys.section(formId, sectionId), 'fields'] as const,
  field: (formId: string, sectionId: string, fieldId: string) => [...formKeys.fields(formId, sectionId), fieldId] as const,

  // Field Types
  fieldTypes: () => [...formKeys.all, 'field-types'] as const,
  fieldTypesByCategory: (category: string) => [...formKeys.fieldTypes(), category] as const,

  // Submissions
  submissions: () => [...formKeys.all, 'submissions'] as const,
  submissionList: (params?: SubmissionQueryParams) => [...formKeys.submissions(), 'list', params] as const,
  submission: (id: string) => [...formKeys.submissions(), id] as const,
  formSubmissions: (formId: string, params?: SubmissionQueryParams) => [...formKeys.detail(formId), 'submissions', params] as const,
  eventSubmissions: (eventId: string) => [...formKeys.submissions(), 'event', eventId] as const,
};

// ===========================================
// Forms Hooks
// ===========================================

export const useForms = (params?: FormQueryParams) => {
  return useQuery({
    queryKey: formKeys.list(params),
    queryFn: () => formsService.getAll(params),
  });
};

export const useForm = (id: string) => {
  return useQuery({
    queryKey: formKeys.detail(id),
    queryFn: () => formsService.getById(id),
    enabled: !!id,
  });
};

export const useFormByCode = (code: string) => {
  return useQuery({
    queryKey: formKeys.byCode(code),
    queryFn: () => formsService.getByCode(code),
    enabled: !!code,
  });
};

export const useFormStats = () => {
  return useQuery({
    queryKey: formKeys.stats(),
    queryFn: () => formsService.getStats(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useFormVersions = (id: string) => {
  return useQuery({
    queryKey: formKeys.versions(id),
    queryFn: () => formsService.getVersions(id),
    enabled: !!id,
  });
};

export const useFormPreview = (id: string) => {
  return useQuery({
    queryKey: formKeys.preview(id),
    queryFn: () => formsService.getPreview(id),
    enabled: !!id,
  });
};

export const useCreateForm = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateFormData) => formsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formKeys.lists() });
      queryClient.invalidateQueries({ queryKey: formKeys.stats() });
      showToast('success', 'Formulaire créé', 'Le formulaire a été créé avec succès.');
    },
    onError: () => {
      showToast('error', 'Erreur', 'Impossible de créer le formulaire.');
    },
  });
};

export const useUpdateForm = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFormData }) => formsService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: formKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: formKeys.lists() });
      showToast('success', 'Formulaire mis à jour', 'Le formulaire a été modifié avec succès.');
    },
    onError: () => {
      showToast('error', 'Erreur', 'Impossible de mettre à jour le formulaire.');
    },
  });
};

export const useDeleteForm = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => formsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formKeys.lists() });
      queryClient.invalidateQueries({ queryKey: formKeys.stats() });
      showToast('success', 'Formulaire supprimé', 'Le formulaire a été supprimé avec succès.');
    },
    onError: () => {
      showToast('error', 'Erreur', 'Impossible de supprimer le formulaire.');
    },
  });
};

export const useDuplicateForm = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, newName, newCode }: { id: string; newName: string; newCode: string }) =>
      formsService.duplicate(id, newName, newCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formKeys.lists() });
      queryClient.invalidateQueries({ queryKey: formKeys.stats() });
      showToast('success', 'Formulaire dupliqué', 'Le formulaire a été dupliqué avec succès.');
    },
    onError: () => {
      showToast('error', 'Erreur', 'Impossible de dupliquer le formulaire.');
    },
  });
};

export const usePublishForm = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => formsService.publish(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: formKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: formKeys.lists() });
      queryClient.invalidateQueries({ queryKey: formKeys.stats() });
      showToast('success', 'Formulaire publié', 'Le formulaire est maintenant disponible.');
    },
    onError: () => {
      showToast('error', 'Erreur', 'Impossible de publier le formulaire.');
    },
  });
};

export const useUnpublishForm = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => formsService.unpublish(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: formKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: formKeys.lists() });
      queryClient.invalidateQueries({ queryKey: formKeys.stats() });
      showToast('success', 'Formulaire dépublié', 'Le formulaire n\'est plus disponible.');
    },
    onError: () => {
      showToast('error', 'Erreur', 'Impossible de dépublier le formulaire.');
    },
  });
};

export const useValidateForm = () => {
  return useMutation({
    mutationFn: (id: string) => formsService.validate(id),
  });
};

export const useRestoreFormVersion = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ formId, versionId }: { formId: string; versionId: string }) =>
      formsService.restoreVersion(formId, versionId),
    onSuccess: (_, { formId }) => {
      queryClient.invalidateQueries({ queryKey: formKeys.detail(formId) });
      queryClient.invalidateQueries({ queryKey: formKeys.versions(formId) });
      showToast('success', 'Version restaurée', 'Le formulaire a été restauré à la version sélectionnée.');
    },
    onError: () => {
      showToast('error', 'Erreur', 'Impossible de restaurer la version.');
    },
  });
};

export const useExportForm = () => {
  return useMutation({
    mutationFn: (id: string) => formsService.export(id),
  });
};

export const useImportForm = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: object) => formsService.import(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formKeys.lists() });
      showToast('success', 'Formulaire importé', 'Le formulaire a été importé avec succès.');
    },
    onError: () => {
      showToast('error', 'Erreur', 'Impossible d\'importer le formulaire.');
    },
  });
};

// ===========================================
// Form Sections Hooks
// ===========================================

export const useFormSections = (formId: string) => {
  return useQuery({
    queryKey: formKeys.sections(formId),
    queryFn: () => formSectionsService.getAll(formId),
    enabled: !!formId,
  });
};

export const useFormSection = (formId: string, sectionId: string) => {
  return useQuery({
    queryKey: formKeys.section(formId, sectionId),
    queryFn: () => formSectionsService.getById(formId, sectionId),
    enabled: !!formId && !!sectionId,
  });
};

export const useCreateSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, data }: { formId: string; data: CreateSectionData }) =>
      formSectionsService.create(formId, data),
    onSuccess: (_, { formId }) => {
      queryClient.invalidateQueries({ queryKey: formKeys.detail(formId) });
      queryClient.invalidateQueries({ queryKey: formKeys.sections(formId) });
    },
  });
};

export const useUpdateSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, sectionId, data }: { formId: string; sectionId: string; data: UpdateSectionData }) =>
      formSectionsService.update(formId, sectionId, data),
    onSuccess: (_, { formId }) => {
      queryClient.invalidateQueries({ queryKey: formKeys.detail(formId) });
      queryClient.invalidateQueries({ queryKey: formKeys.sections(formId) });
    },
  });
};

export const useDeleteSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, sectionId }: { formId: string; sectionId: string }) =>
      formSectionsService.delete(formId, sectionId),
    onSuccess: (_, { formId }) => {
      queryClient.invalidateQueries({ queryKey: formKeys.detail(formId) });
      queryClient.invalidateQueries({ queryKey: formKeys.sections(formId) });
    },
  });
};

export const useReorderSections = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, sectionIds }: { formId: string; sectionIds: string[] }) =>
      formSectionsService.reorder(formId, sectionIds),
    onSuccess: (_, { formId }) => {
      queryClient.invalidateQueries({ queryKey: formKeys.detail(formId) });
      queryClient.invalidateQueries({ queryKey: formKeys.sections(formId) });
    },
  });
};

export const useDuplicateSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, sectionId }: { formId: string; sectionId: string }) =>
      formSectionsService.duplicate(formId, sectionId),
    onSuccess: (_, { formId }) => {
      queryClient.invalidateQueries({ queryKey: formKeys.detail(formId) });
      queryClient.invalidateQueries({ queryKey: formKeys.sections(formId) });
    },
  });
};

// ===========================================
// Form Fields Hooks
// ===========================================

export const useFormFields = (formId: string, sectionId: string) => {
  return useQuery({
    queryKey: formKeys.fields(formId, sectionId),
    queryFn: () => formFieldsService.getAll(formId, sectionId),
    enabled: !!formId && !!sectionId,
  });
};

export const useCreateField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, sectionId, data }: { formId: string; sectionId: string; data: CreateFieldData }) =>
      formFieldsService.create(formId, sectionId, data),
    onSuccess: (_, { formId, sectionId }) => {
      queryClient.invalidateQueries({ queryKey: formKeys.detail(formId) });
      queryClient.invalidateQueries({ queryKey: formKeys.fields(formId, sectionId) });
    },
  });
};

export const useUpdateField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, sectionId, fieldId, data }: { formId: string; sectionId: string; fieldId: string; data: UpdateFieldData }) =>
      formFieldsService.update(formId, sectionId, fieldId, data),
    onSuccess: (_, { formId, sectionId }) => {
      queryClient.invalidateQueries({ queryKey: formKeys.detail(formId) });
      queryClient.invalidateQueries({ queryKey: formKeys.fields(formId, sectionId) });
    },
  });
};

export const useDeleteField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, sectionId, fieldId }: { formId: string; sectionId: string; fieldId: string }) =>
      formFieldsService.delete(formId, sectionId, fieldId),
    onSuccess: (_, { formId, sectionId }) => {
      queryClient.invalidateQueries({ queryKey: formKeys.detail(formId) });
      queryClient.invalidateQueries({ queryKey: formKeys.fields(formId, sectionId) });
    },
  });
};

export const useReorderFields = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, sectionId, fieldIds }: { formId: string; sectionId: string; fieldIds: string[] }) =>
      formFieldsService.reorder(formId, sectionId, fieldIds),
    onSuccess: (_, { formId, sectionId }) => {
      queryClient.invalidateQueries({ queryKey: formKeys.detail(formId) });
      queryClient.invalidateQueries({ queryKey: formKeys.fields(formId, sectionId) });
    },
  });
};

export const useMoveField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, fieldId, targetSectionId, sortOrder }: { formId: string; fieldId: string; targetSectionId: string; sortOrder: number }) =>
      formFieldsService.move(formId, fieldId, targetSectionId, sortOrder),
    onSuccess: (_, { formId }) => {
      queryClient.invalidateQueries({ queryKey: formKeys.detail(formId) });
      queryClient.invalidateQueries({ queryKey: formKeys.sections(formId) });
    },
  });
};

export const useDuplicateField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, sectionId, fieldId }: { formId: string; sectionId: string; fieldId: string }) =>
      formFieldsService.duplicate(formId, sectionId, fieldId),
    onSuccess: (_, { formId, sectionId }) => {
      queryClient.invalidateQueries({ queryKey: formKeys.detail(formId) });
      queryClient.invalidateQueries({ queryKey: formKeys.fields(formId, sectionId) });
    },
  });
};

// ===========================================
// Field Types Hooks
// ===========================================

export const useFieldTypes = () => {
  return useQuery({
    queryKey: formKeys.fieldTypes(),
    queryFn: () => fieldTypesService.getAll(),
    staleTime: 30 * 60 * 1000, // 30 minutes - field types rarely change
  });
};

export const useFieldTypesByCategory = (category: string) => {
  return useQuery({
    queryKey: formKeys.fieldTypesByCategory(category),
    queryFn: () => fieldTypesService.getByCategory(category),
    enabled: !!category,
    staleTime: 30 * 60 * 1000,
  });
};

// ===========================================
// Form Submissions Hooks
// ===========================================

export const useFormSubmissions = (params?: SubmissionQueryParams) => {
  return useQuery({
    queryKey: formKeys.submissionList(params),
    queryFn: () => formSubmissionsService.getAll(params),
  });
};

export const useFormSubmission = (id: string) => {
  return useQuery({
    queryKey: formKeys.submission(id),
    queryFn: () => formSubmissionsService.getById(id),
    enabled: !!id,
  });
};

export const useFormSubmissionsByForm = (formId: string, params?: SubmissionQueryParams) => {
  return useQuery({
    queryKey: formKeys.formSubmissions(formId, params),
    queryFn: () => formSubmissionsService.getByFormId(formId, params),
    enabled: !!formId,
  });
};

export const useFormSubmissionsByEvent = (eventId: string) => {
  return useQuery({
    queryKey: formKeys.eventSubmissions(eventId),
    queryFn: () => formSubmissionsService.getByEventId(eventId),
    enabled: !!eventId,
  });
};

export const useCreateSubmission = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateSubmissionData) => formSubmissionsService.create(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: formKeys.submissions() });
      if (data.formId) {
        queryClient.invalidateQueries({ queryKey: formKeys.formSubmissions(data.formId) });
      }
      if (data.eventId) {
        queryClient.invalidateQueries({ queryKey: formKeys.eventSubmissions(data.eventId) });
      }
      showToast('success', 'Formulaire soumis', 'Votre réponse a été enregistrée.');
    },
    onError: () => {
      showToast('error', 'Erreur', 'Impossible de soumettre le formulaire.');
    },
  });
};

export const useUpdateSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSubmissionData> }) =>
      formSubmissionsService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: formKeys.submission(id) });
      queryClient.invalidateQueries({ queryKey: formKeys.submissions() });
    },
  });
};

export const useSubmitDraft = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => formSubmissionsService.submit(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: formKeys.submission(id) });
      queryClient.invalidateQueries({ queryKey: formKeys.submissions() });
      showToast('success', 'Formulaire soumis', 'Le brouillon a été soumis.');
    },
    onError: () => {
      showToast('error', 'Erreur', 'Impossible de soumettre le brouillon.');
    },
  });
};

export const useValidateSubmission = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => formSubmissionsService.validate(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: formKeys.submission(id) });
      queryClient.invalidateQueries({ queryKey: formKeys.submissions() });
      showToast('success', 'Soumission validée', 'La soumission a été validée.');
    },
    onError: () => {
      showToast('error', 'Erreur', 'Impossible de valider la soumission.');
    },
  });
};

export const useRejectSubmission = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      formSubmissionsService.reject(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: formKeys.submission(id) });
      queryClient.invalidateQueries({ queryKey: formKeys.submissions() });
      showToast('success', 'Soumission rejetée', 'La soumission a été rejetée.');
    },
    onError: () => {
      showToast('error', 'Erreur', 'Impossible de rejeter la soumission.');
    },
  });
};

export const useDeleteSubmission = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => formSubmissionsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formKeys.submissions() });
      showToast('success', 'Soumission supprimée', 'La soumission a été supprimée.');
    },
    onError: () => {
      showToast('error', 'Erreur', 'Impossible de supprimer la soumission.');
    },
  });
};

// ===========================================
// Form Validation Hooks
// ===========================================

export const useValidateFormData = () => {
  return useMutation({
    mutationFn: ({ formId, data }: { formId: string; data: Record<string, unknown> }) =>
      formValidationService.validateData(formId, data),
  });
};

export const useFormValidationRules = (formId: string) => {
  return useQuery({
    queryKey: [...formKeys.detail(formId), 'validation-rules'] as const,
    queryFn: () => formValidationService.getValidationRules(formId),
    enabled: !!formId,
  });
};
