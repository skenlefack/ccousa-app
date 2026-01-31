import api, { ApiResponse, PaginatedResponse } from './api';
import type { Form, FormSection, FormField, FieldType, User } from '../types';

// ===========================================
// Extended Form Types
// ===========================================

export interface FormSubmission {
  id: string;
  formId: string;
  form?: Form;
  eventId?: string;
  procedureExecutionId?: string;
  stepExecutionId?: string;
  data: Record<string, unknown>;
  status: 'DRAFT' | 'SUBMITTED' | 'VALIDATED' | 'REJECTED';
  submittedById: string;
  submittedBy?: User;
  submittedAt?: string;
  validatedById?: string;
  validatedBy?: User;
  validatedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormStats {
  total: number;
  byStatus: {
    published: number;
    draft: number;
    inactive: number;
  };
  submissionStats: {
    total: number;
    submitted: number;
    validated: number;
    rejected: number;
    averageCompletionTimeMinutes: number;
  };
  topForms: Array<{
    formId: string;
    form: Form;
    submissionCount: number;
    validationRate: number;
  }>;
}

export interface FormVersion {
  id: string;
  formId: string;
  version: number;
  sections: FormSection[];
  createdAt: string;
  createdById: string;
  createdBy?: User;
  changeLog?: string;
}

export interface ConditionalLogic {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: unknown;
  action: 'show' | 'hide' | 'require' | 'disable';
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
  custom?: string;
}

// ===========================================
// Filter & Query Types
// ===========================================

export interface FormFilters {
  search?: string;
  type?: string | string[];
  languageCode?: string;
  isPublished?: boolean;
  isActive?: boolean;
}

export interface FormQueryParams extends FormFilters {
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'version';
  sortOrder?: 'asc' | 'desc';
}

export interface SubmissionFilters {
  formId?: string;
  eventId?: string;
  status?: FormSubmission['status'] | FormSubmission['status'][];
  submittedById?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SubmissionQueryParams extends SubmissionFilters {
  page?: number;
  pageSize?: number;
  sortBy?: 'submittedAt' | 'status' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateFormData {
  code: string;
  name: string;
  description?: string;
  type?: string;
  languageCode?: string;
  layoutColumns?: 1 | 2 | 3;
  sections?: CreateSectionData[];
}

export interface UpdateFormData extends Partial<Omit<CreateFormData, 'code'>> {
  isPublished?: boolean;
  isActive?: boolean;
}

export interface CreateSectionData {
  title: string;
  description?: string;
  sortOrder: number;
  columns?: 1 | 2 | 3;
  isCollapsible?: boolean;
  isCollapsedDefault?: boolean;
  fields?: CreateFieldData[];
}

export interface UpdateSectionData extends Partial<CreateSectionData> {}

export interface CreateFieldData {
  fieldTypeId: string;
  code: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  isRequired?: boolean;
  isReadonly?: boolean;
  isHidden?: boolean;
  validationRules?: FieldValidation;
  options?: Array<{ value: string; label: string; sortOrder: number }>;
  conditionalLogic?: ConditionalLogic[];
  sortOrder: number;
  columnSpan?: 1 | 2 | 3;
}

export interface UpdateFieldData extends Partial<CreateFieldData> {}

export interface CreateSubmissionData {
  formId: string;
  eventId?: string;
  procedureExecutionId?: string;
  stepExecutionId?: string;
  data: Record<string, unknown>;
  status?: 'DRAFT' | 'SUBMITTED';
}

// ===========================================
// Forms Service
// ===========================================

export const formsService = {
  // Get all forms with pagination and filters
  getAll: async (params?: FormQueryParams): Promise<PaginatedResponse<Form>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Form>>>('/forms', {
      params: {
        ...params,
        type: Array.isArray(params?.type) ? params.type.join(',') : params?.type,
      },
    });
    return response.data.data;
  },

  // Get single form with sections and fields
  getById: async (id: string): Promise<Form> => {
    const response = await api.get<ApiResponse<Form>>(`/forms/${id}`);
    return response.data.data;
  },

  // Get form by code
  getByCode: async (code: string): Promise<Form> => {
    const response = await api.get<ApiResponse<Form>>(`/forms/code/${code}`);
    return response.data.data;
  },

  // Create form
  create: async (data: CreateFormData): Promise<Form> => {
    const response = await api.post<ApiResponse<Form>>('/forms', data);
    return response.data.data;
  },

  // Update form
  update: async (id: string, data: UpdateFormData): Promise<Form> => {
    const response = await api.put<ApiResponse<Form>>(`/forms/${id}`, data);
    return response.data.data;
  },

  // Delete form (soft delete)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/forms/${id}`);
  },

  // Duplicate form
  duplicate: async (id: string, newName: string, newCode: string): Promise<Form> => {
    const response = await api.post<ApiResponse<Form>>(`/forms/${id}/duplicate`, { name: newName, code: newCode });
    return response.data.data;
  },

  // Publish form
  publish: async (id: string): Promise<Form> => {
    const response = await api.post<ApiResponse<Form>>(`/forms/${id}/publish`);
    return response.data.data;
  },

  // Unpublish form
  unpublish: async (id: string): Promise<Form> => {
    const response = await api.post<ApiResponse<Form>>(`/forms/${id}/unpublish`);
    return response.data.data;
  },

  // Validate form structure
  validate: async (id: string): Promise<{ valid: boolean; errors: string[] }> => {
    const response = await api.post<ApiResponse<{ valid: boolean; errors: string[] }>>(`/forms/${id}/validate`);
    return response.data.data;
  },

  // Get form statistics
  getStats: async (): Promise<FormStats> => {
    const response = await api.get<ApiResponse<FormStats>>('/forms/stats');
    return response.data.data;
  },

  // Get form versions
  getVersions: async (id: string): Promise<FormVersion[]> => {
    const response = await api.get<ApiResponse<FormVersion[]>>(`/forms/${id}/versions`);
    return response.data.data;
  },

  // Restore form version
  restoreVersion: async (id: string, versionId: string): Promise<Form> => {
    const response = await api.post<ApiResponse<Form>>(`/forms/${id}/versions/${versionId}/restore`);
    return response.data.data;
  },

  // Preview form
  getPreview: async (id: string): Promise<Form> => {
    const response = await api.get<ApiResponse<Form>>(`/forms/${id}/preview`);
    return response.data.data;
  },

  // Export form as JSON
  export: async (id: string): Promise<object> => {
    const response = await api.get<ApiResponse<object>>(`/forms/${id}/export`);
    return response.data.data;
  },

  // Import form from JSON
  import: async (data: object): Promise<Form> => {
    const response = await api.post<ApiResponse<Form>>('/forms/import', data);
    return response.data.data;
  },
};

// ===========================================
// Form Sections Service
// ===========================================

export const formSectionsService = {
  // Get all sections for a form
  getAll: async (formId: string): Promise<FormSection[]> => {
    const response = await api.get<ApiResponse<FormSection[]>>(`/forms/${formId}/sections`);
    return response.data.data;
  },

  // Get single section
  getById: async (formId: string, sectionId: string): Promise<FormSection> => {
    const response = await api.get<ApiResponse<FormSection>>(`/forms/${formId}/sections/${sectionId}`);
    return response.data.data;
  },

  // Add section
  create: async (formId: string, data: CreateSectionData): Promise<FormSection> => {
    const response = await api.post<ApiResponse<FormSection>>(`/forms/${formId}/sections`, data);
    return response.data.data;
  },

  // Update section
  update: async (formId: string, sectionId: string, data: UpdateSectionData): Promise<FormSection> => {
    const response = await api.put<ApiResponse<FormSection>>(`/forms/${formId}/sections/${sectionId}`, data);
    return response.data.data;
  },

  // Delete section
  delete: async (formId: string, sectionId: string): Promise<void> => {
    await api.delete(`/forms/${formId}/sections/${sectionId}`);
  },

  // Reorder sections
  reorder: async (formId: string, sectionIds: string[]): Promise<FormSection[]> => {
    const response = await api.put<ApiResponse<FormSection[]>>(`/forms/${formId}/sections/reorder`, { sectionIds });
    return response.data.data;
  },

  // Duplicate section
  duplicate: async (formId: string, sectionId: string): Promise<FormSection> => {
    const response = await api.post<ApiResponse<FormSection>>(`/forms/${formId}/sections/${sectionId}/duplicate`);
    return response.data.data;
  },
};

// ===========================================
// Form Fields Service
// ===========================================

export const formFieldsService = {
  // Get all fields for a section
  getAll: async (formId: string, sectionId: string): Promise<FormField[]> => {
    const response = await api.get<ApiResponse<FormField[]>>(`/forms/${formId}/sections/${sectionId}/fields`);
    return response.data.data;
  },

  // Get single field
  getById: async (formId: string, sectionId: string, fieldId: string): Promise<FormField> => {
    const response = await api.get<ApiResponse<FormField>>(`/forms/${formId}/sections/${sectionId}/fields/${fieldId}`);
    return response.data.data;
  },

  // Add field
  create: async (formId: string, sectionId: string, data: CreateFieldData): Promise<FormField> => {
    const response = await api.post<ApiResponse<FormField>>(`/forms/${formId}/sections/${sectionId}/fields`, data);
    return response.data.data;
  },

  // Update field
  update: async (formId: string, sectionId: string, fieldId: string, data: UpdateFieldData): Promise<FormField> => {
    const response = await api.put<ApiResponse<FormField>>(`/forms/${formId}/sections/${sectionId}/fields/${fieldId}`, data);
    return response.data.data;
  },

  // Delete field
  delete: async (formId: string, sectionId: string, fieldId: string): Promise<void> => {
    await api.delete(`/forms/${formId}/sections/${sectionId}/fields/${fieldId}`);
  },

  // Reorder fields
  reorder: async (formId: string, sectionId: string, fieldIds: string[]): Promise<FormField[]> => {
    const response = await api.put<ApiResponse<FormField[]>>(`/forms/${formId}/sections/${sectionId}/fields/reorder`, { fieldIds });
    return response.data.data;
  },

  // Move field to another section
  move: async (formId: string, fieldId: string, targetSectionId: string, sortOrder: number): Promise<FormField> => {
    const response = await api.put<ApiResponse<FormField>>(`/forms/${formId}/fields/${fieldId}/move`, {
      sectionId: targetSectionId,
      sortOrder,
    });
    return response.data.data;
  },

  // Duplicate field
  duplicate: async (formId: string, sectionId: string, fieldId: string): Promise<FormField> => {
    const response = await api.post<ApiResponse<FormField>>(`/forms/${formId}/sections/${sectionId}/fields/${fieldId}/duplicate`);
    return response.data.data;
  },
};

// ===========================================
// Field Types Service
// ===========================================

export const fieldTypesService = {
  // Get all field types
  getAll: async (): Promise<FieldType[]> => {
    const response = await api.get<ApiResponse<FieldType[]>>('/forms/field-types');
    return response.data.data;
  },

  // Get field type by id
  getById: async (id: string): Promise<FieldType> => {
    const response = await api.get<ApiResponse<FieldType>>(`/forms/field-types/${id}`);
    return response.data.data;
  },

  // Get field types by category
  getByCategory: async (category: string): Promise<FieldType[]> => {
    const response = await api.get<ApiResponse<FieldType[]>>(`/forms/field-types/category/${category}`);
    return response.data.data;
  },
};

// ===========================================
// Form Submissions Service
// ===========================================

export const formSubmissionsService = {
  // Get all submissions with filters
  getAll: async (params?: SubmissionQueryParams): Promise<PaginatedResponse<FormSubmission>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<FormSubmission>>>('/forms/submissions', {
      params: {
        ...params,
        status: Array.isArray(params?.status) ? params.status.join(',') : params?.status,
      },
    });
    return response.data.data;
  },

  // Get single submission
  getById: async (id: string): Promise<FormSubmission> => {
    const response = await api.get<ApiResponse<FormSubmission>>(`/forms/submissions/${id}`);
    return response.data.data;
  },

  // Get submissions for a form
  getByFormId: async (formId: string, params?: SubmissionQueryParams): Promise<PaginatedResponse<FormSubmission>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<FormSubmission>>>(`/forms/${formId}/submissions`, { params });
    return response.data.data;
  },

  // Get submissions for an event
  getByEventId: async (eventId: string): Promise<FormSubmission[]> => {
    const response = await api.get<ApiResponse<FormSubmission[]>>(`/events/${eventId}/form-submissions`);
    return response.data.data;
  },

  // Create/submit form
  create: async (data: CreateSubmissionData): Promise<FormSubmission> => {
    const response = await api.post<ApiResponse<FormSubmission>>('/forms/submissions', data);
    return response.data.data;
  },

  // Update submission (for drafts)
  update: async (id: string, data: Partial<CreateSubmissionData>): Promise<FormSubmission> => {
    const response = await api.put<ApiResponse<FormSubmission>>(`/forms/submissions/${id}`, data);
    return response.data.data;
  },

  // Submit draft
  submit: async (id: string): Promise<FormSubmission> => {
    const response = await api.post<ApiResponse<FormSubmission>>(`/forms/submissions/${id}/submit`);
    return response.data.data;
  },

  // Validate submission
  validate: async (id: string): Promise<FormSubmission> => {
    const response = await api.post<ApiResponse<FormSubmission>>(`/forms/submissions/${id}/validate`);
    return response.data.data;
  },

  // Reject submission
  reject: async (id: string, reason: string): Promise<FormSubmission> => {
    const response = await api.post<ApiResponse<FormSubmission>>(`/forms/submissions/${id}/reject`, { reason });
    return response.data.data;
  },

  // Delete submission
  delete: async (id: string): Promise<void> => {
    await api.delete(`/forms/submissions/${id}`);
  },

  // Export submissions to CSV
  export: async (formId: string, params?: SubmissionFilters): Promise<Blob> => {
    const response = await api.get(`/forms/${formId}/submissions/export`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

// ===========================================
// Form Validation Service
// ===========================================

export const formValidationService = {
  // Validate form data against schema
  validateData: async (formId: string, data: Record<string, unknown>): Promise<{
    valid: boolean;
    errors: Array<{ field: string; message: string }>;
  }> => {
    const response = await api.post<ApiResponse<{
      valid: boolean;
      errors: Array<{ field: string; message: string }>;
    }>>(`/forms/${formId}/validate-data`, { data });
    return response.data.data;
  },

  // Get validation rules for a form
  getValidationRules: async (formId: string): Promise<Record<string, FieldValidation>> => {
    const response = await api.get<ApiResponse<Record<string, FieldValidation>>>(`/forms/${formId}/validation-rules`);
    return response.data.data;
  },
};

// Export combined service
export default {
  forms: formsService,
  sections: formSectionsService,
  fields: formFieldsService,
  fieldTypes: fieldTypesService,
  submissions: formSubmissionsService,
  validation: formValidationService,
};
