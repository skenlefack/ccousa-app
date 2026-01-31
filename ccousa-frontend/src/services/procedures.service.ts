import api, { ApiResponse, PaginatedResponse } from './api';
import type { Procedure, ProcedureStep, ProcedureGroup, User, Event } from '../types';

// ===========================================
// Extended Procedure Types
// ===========================================

export interface ProcedureExecution {
  id: string;
  procedureId: string;
  procedure?: Procedure;
  eventId: string;
  event?: Event;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  currentStepNumber: number;
  startedById: string;
  startedBy?: User;
  startedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  stepExecutions?: StepExecution[];
  createdAt: string;
  updatedAt: string;
}

export interface StepExecution {
  id: string;
  executionId: string;
  stepId: string;
  step?: ProcedureStep;
  stepNumber: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'FAILED';
  assignedToId?: string;
  assignedTo?: User;
  startedAt?: string;
  completedAt?: string;
  completedById?: string;
  completedBy?: User;
  notes?: string;
  formSubmissionId?: string;
  attachments?: StepAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface StepAttachment {
  id: string;
  stepExecutionId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedById: string;
  uploadedBy?: User;
  createdAt: string;
}

export interface ProcedureTemplate {
  id: string;
  name: string;
  description?: string;
  type: Procedure['type'];
  steps: Omit<ProcedureStep, 'id' | 'procedureId' | 'createdAt' | 'updatedAt'>[];
  isPublic: boolean;
  createdById: string;
  createdAt: string;
}

export interface ProcedureStats {
  total: number;
  byType: Record<Procedure['type'], number>;
  byStatus: {
    active: number;
    inactive: number;
  };
  executionStats: {
    total: number;
    completed: number;
    inProgress: number;
    averageCompletionTimeHours: number;
  };
  topProcedures: Array<{
    procedureId: string;
    procedure: Procedure;
    executionCount: number;
    completionRate: number;
  }>;
}

// ===========================================
// Filter & Query Types
// ===========================================

export interface ProcedureFilters {
  search?: string;
  type?: Procedure['type'] | Procedure['type'][];
  categoryId?: string | string[];
  groupId?: string;
  triggerType?: Procedure['triggerType'];
  isActive?: boolean;
}

export interface ProcedureQueryParams extends ProcedureFilters {
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'type';
  sortOrder?: 'asc' | 'desc';
}

export interface ExecutionFilters {
  procedureId?: string;
  eventId?: string;
  status?: ProcedureExecution['status'] | ProcedureExecution['status'][];
  startedById?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ExecutionQueryParams extends ExecutionFilters {
  page?: number;
  pageSize?: number;
  sortBy?: 'startedAt' | 'completedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProcedureData {
  code: string;
  name: string;
  description?: string;
  type: Procedure['type'];
  groupId?: string;
  categoryId?: string;
  triggerType: Procedure['triggerType'];
  triggerConfig?: Record<string, unknown>;
  steps?: CreateStepData[];
}

export interface UpdateProcedureData extends Partial<Omit<CreateProcedureData, 'code'>> {
  isActive?: boolean;
}

export interface CreateStepData {
  name: string;
  description?: string;
  stepNumber: number;
  durationHours?: number;
  isOptional?: boolean;
  assigneeType: ProcedureStep['assigneeType'];
  assigneeId?: string;
  formId?: string;
  requiredDocumentIds?: string[];
  externalStepId?: string;
}

export interface UpdateStepData extends Partial<CreateStepData> {}

// ===========================================
// Procedures Service
// ===========================================

export const proceduresService = {
  // Get all procedures with pagination and filters
  getAll: async (params?: ProcedureQueryParams): Promise<PaginatedResponse<Procedure>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Procedure>>>('/procedures', {
      params: {
        ...params,
        type: Array.isArray(params?.type) ? params.type.join(',') : params?.type,
        categoryId: Array.isArray(params?.categoryId) ? params.categoryId.join(',') : params?.categoryId,
      },
    });
    return response.data.data;
  },

  // Get single procedure with steps
  getById: async (id: string): Promise<Procedure> => {
    const response = await api.get<ApiResponse<Procedure>>(`/procedures/${id}`);
    return response.data.data;
  },

  // Create procedure
  create: async (data: CreateProcedureData): Promise<Procedure> => {
    const response = await api.post<ApiResponse<Procedure>>('/procedures', data);
    return response.data.data;
  },

  // Update procedure
  update: async (id: string, data: UpdateProcedureData): Promise<Procedure> => {
    const response = await api.put<ApiResponse<Procedure>>(`/procedures/${id}`, data);
    return response.data.data;
  },

  // Delete procedure (soft delete)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/procedures/${id}`);
  },

  // Duplicate procedure
  duplicate: async (id: string, newName: string): Promise<Procedure> => {
    const response = await api.post<ApiResponse<Procedure>>(`/procedures/${id}/duplicate`, { name: newName });
    return response.data.data;
  },

  // Get procedure statistics
  getStats: async (): Promise<ProcedureStats> => {
    const response = await api.get<ApiResponse<ProcedureStats>>('/procedures/stats');
    return response.data.data;
  },

  // Validate procedure workflow
  validate: async (id: string): Promise<{ valid: boolean; errors: string[] }> => {
    const response = await api.post<ApiResponse<{ valid: boolean; errors: string[] }>>(`/procedures/${id}/validate`);
    return response.data.data;
  },

  // Export procedure as template
  exportAsTemplate: async (id: string): Promise<ProcedureTemplate> => {
    const response = await api.get<ApiResponse<ProcedureTemplate>>(`/procedures/${id}/export`);
    return response.data.data;
  },

  // Import procedure from template
  importFromTemplate: async (template: ProcedureTemplate): Promise<Procedure> => {
    const response = await api.post<ApiResponse<Procedure>>('/procedures/import', template);
    return response.data.data;
  },
};

// ===========================================
// Procedure Steps Service
// ===========================================

export const procedureStepsService = {
  // Get all steps for a procedure
  getAll: async (procedureId: string): Promise<ProcedureStep[]> => {
    const response = await api.get<ApiResponse<ProcedureStep[]>>(`/procedures/${procedureId}/steps`);
    return response.data.data;
  },

  // Get single step
  getById: async (procedureId: string, stepId: string): Promise<ProcedureStep> => {
    const response = await api.get<ApiResponse<ProcedureStep>>(`/procedures/${procedureId}/steps/${stepId}`);
    return response.data.data;
  },

  // Add step
  create: async (procedureId: string, data: CreateStepData): Promise<ProcedureStep> => {
    const response = await api.post<ApiResponse<ProcedureStep>>(`/procedures/${procedureId}/steps`, data);
    return response.data.data;
  },

  // Update step
  update: async (procedureId: string, stepId: string, data: UpdateStepData): Promise<ProcedureStep> => {
    const response = await api.put<ApiResponse<ProcedureStep>>(`/procedures/${procedureId}/steps/${stepId}`, data);
    return response.data.data;
  },

  // Delete step
  delete: async (procedureId: string, stepId: string): Promise<void> => {
    await api.delete(`/procedures/${procedureId}/steps/${stepId}`);
  },

  // Reorder steps
  reorder: async (procedureId: string, stepIds: string[]): Promise<ProcedureStep[]> => {
    const response = await api.put<ApiResponse<ProcedureStep[]>>(`/procedures/${procedureId}/steps/reorder`, { stepIds });
    return response.data.data;
  },

  // Bulk update steps
  bulkUpdate: async (procedureId: string, steps: Array<{ id?: string } & CreateStepData>): Promise<ProcedureStep[]> => {
    const response = await api.put<ApiResponse<ProcedureStep[]>>(`/procedures/${procedureId}/steps/bulk`, { steps });
    return response.data.data;
  },
};

// ===========================================
// Procedure Groups Service
// ===========================================

export const procedureGroupsService = {
  // Get all groups (optionally as tree)
  getAll: async (asTree = false): Promise<ProcedureGroup[]> => {
    const response = await api.get<ApiResponse<ProcedureGroup[]>>('/procedures/groups', {
      params: { asTree },
    });
    return response.data.data;
  },

  // Get single group
  getById: async (id: string): Promise<ProcedureGroup> => {
    const response = await api.get<ApiResponse<ProcedureGroup>>(`/procedures/groups/${id}`);
    return response.data.data;
  },

  // Create group
  create: async (data: Omit<ProcedureGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProcedureGroup> => {
    const response = await api.post<ApiResponse<ProcedureGroup>>('/procedures/groups', data);
    return response.data.data;
  },

  // Update group
  update: async (id: string, data: Partial<ProcedureGroup>): Promise<ProcedureGroup> => {
    const response = await api.put<ApiResponse<ProcedureGroup>>(`/procedures/groups/${id}`, data);
    return response.data.data;
  },

  // Delete group
  delete: async (id: string): Promise<void> => {
    await api.delete(`/procedures/groups/${id}`);
  },
};

// ===========================================
// Procedure Executions Service
// ===========================================

export const procedureExecutionsService = {
  // Get all executions with filters
  getAll: async (params?: ExecutionQueryParams): Promise<PaginatedResponse<ProcedureExecution>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<ProcedureExecution>>>('/procedures/executions', {
      params: {
        ...params,
        status: Array.isArray(params?.status) ? params.status.join(',') : params?.status,
      },
    });
    return response.data.data;
  },

  // Get single execution with step executions
  getById: async (id: string): Promise<ProcedureExecution> => {
    const response = await api.get<ApiResponse<ProcedureExecution>>(`/procedures/executions/${id}`);
    return response.data.data;
  },

  // Get executions for an event
  getByEventId: async (eventId: string): Promise<ProcedureExecution[]> => {
    const response = await api.get<ApiResponse<ProcedureExecution[]>>(`/events/${eventId}/procedures`);
    return response.data.data;
  },

  // Start procedure execution
  start: async (procedureId: string, eventId: string): Promise<ProcedureExecution> => {
    const response = await api.post<ApiResponse<ProcedureExecution>>('/procedures/executions/start', {
      procedureId,
      eventId,
    });
    return response.data.data;
  },

  // Cancel execution
  cancel: async (id: string, reason: string): Promise<ProcedureExecution> => {
    const response = await api.put<ApiResponse<ProcedureExecution>>(`/procedures/executions/${id}/cancel`, { reason });
    return response.data.data;
  },

  // Advance to next step
  advanceStep: async (id: string, notes?: string): Promise<ProcedureExecution> => {
    const response = await api.put<ApiResponse<ProcedureExecution>>(`/procedures/executions/${id}/advance`, { notes });
    return response.data.data;
  },

  // Complete step execution
  completeStep: async (
    executionId: string,
    stepExecutionId: string,
    data: { notes?: string; formSubmissionId?: string }
  ): Promise<StepExecution> => {
    const response = await api.put<ApiResponse<StepExecution>>(
      `/procedures/executions/${executionId}/steps/${stepExecutionId}/complete`,
      data
    );
    return response.data.data;
  },

  // Skip optional step
  skipStep: async (executionId: string, stepExecutionId: string, reason: string): Promise<StepExecution> => {
    const response = await api.put<ApiResponse<StepExecution>>(
      `/procedures/executions/${executionId}/steps/${stepExecutionId}/skip`,
      { reason }
    );
    return response.data.data;
  },

  // Assign step to user
  assignStep: async (executionId: string, stepExecutionId: string, assignedToId: string): Promise<StepExecution> => {
    const response = await api.put<ApiResponse<StepExecution>>(
      `/procedures/executions/${executionId}/steps/${stepExecutionId}/assign`,
      { assignedToId }
    );
    return response.data.data;
  },

  // Upload attachment to step
  uploadStepAttachment: async (executionId: string, stepExecutionId: string, file: File): Promise<StepAttachment> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<StepAttachment>>(
      `/procedures/executions/${executionId}/steps/${stepExecutionId}/attachments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data;
  },

  // Get execution timeline
  getTimeline: async (id: string): Promise<Array<{
    id: string;
    action: string;
    description: string;
    userId: string;
    user?: User;
    createdAt: string;
  }>> => {
    const response = await api.get<ApiResponse<Array<{
      id: string;
      action: string;
      description: string;
      userId: string;
      user?: User;
      createdAt: string;
    }>>>(`/procedures/executions/${id}/timeline`);
    return response.data.data;
  },
};

// ===========================================
// Procedure Templates Service
// ===========================================

export const procedureTemplatesService = {
  // Get public templates
  getPublic: async (): Promise<ProcedureTemplate[]> => {
    const response = await api.get<ApiResponse<ProcedureTemplate[]>>('/procedures/templates');
    return response.data.data;
  },

  // Get my templates
  getMine: async (): Promise<ProcedureTemplate[]> => {
    const response = await api.get<ApiResponse<ProcedureTemplate[]>>('/procedures/templates/mine');
    return response.data.data;
  },

  // Create template from procedure
  createFromProcedure: async (procedureId: string, isPublic: boolean): Promise<ProcedureTemplate> => {
    const response = await api.post<ApiResponse<ProcedureTemplate>>('/procedures/templates', {
      procedureId,
      isPublic,
    });
    return response.data.data;
  },

  // Delete template
  delete: async (id: string): Promise<void> => {
    await api.delete(`/procedures/templates/${id}`);
  },
};

// Export combined service
export default {
  procedures: proceduresService,
  steps: procedureStepsService,
  groups: procedureGroupsService,
  executions: procedureExecutionsService,
  templates: procedureTemplatesService,
};
