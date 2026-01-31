import api, { ApiResponse, PaginatedResponse } from './api';
import type { Event, EventCategory, OrganizationalUnit, User } from '../types';

// ===========================================
// Extended Event Types
// ===========================================

export interface EventComment {
  id: string;
  eventId: string;
  userId: string;
  user?: User;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventAttachment {
  id: string;
  eventId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  documentTypeId?: string;
  uploadedById: string;
  uploadedBy?: User;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface EventTask {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedToId?: string;
  assignedTo?: User;
  dueDate?: string;
  completedAt?: string;
  createdById: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface EventTimeline {
  id: string;
  eventId: string;
  action: 'CREATED' | 'UPDATED' | 'STATUS_CHANGED' | 'ASSIGNED' | 'COMMENT_ADDED' | 'ATTACHMENT_ADDED' | 'TASK_ADDED' | 'TASK_COMPLETED';
  description: string;
  userId: string;
  user?: User;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface EventDetails extends Event {
  comments?: EventComment[];
  attachments?: EventAttachment[];
  tasks?: EventTask[];
  timeline?: EventTimeline[];
}

// ===========================================
// Filter & Query Types
// ===========================================

export interface EventFilters {
  search?: string;
  status?: Event['status'] | Event['status'][];
  severity?: Event['severity'] | Event['severity'][];
  categoryId?: string | string[];
  organizationalUnitId?: string | string[];
  assignedToId?: string;
  reportedById?: string;
  dateFrom?: string;
  dateTo?: string;
  hasLocation?: boolean;
}

export interface EventQueryParams extends EventFilters {
  page?: number;
  pageSize?: number;
  sortBy?: 'reportedAt' | 'createdAt' | 'updatedAt' | 'severity' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface EventStats {
  total: number;
  byStatus: Record<Event['status'], number>;
  bySeverity: Record<Event['severity'], number>;
  byCategory: Array<{ categoryId: string; category: EventCategory; count: number }>;
  byUnit: Array<{ unitId: string; unit: OrganizationalUnit; count: number }>;
  recentTrend: Array<{ date: string; count: number }>;
}

export interface CreateEventData {
  title: string;
  description?: string;
  categoryId: string;
  severity: Event['severity'];
  location: string;
  latitude?: number;
  longitude?: number;
  organizationalUnitId?: string;
  reportedAt?: string;
}

export interface UpdateEventData extends Partial<CreateEventData> {
  status?: Event['status'];
  assignedToId?: string | null;
}

// ===========================================
// Events Service
// ===========================================

export const eventsService = {
  // Get all events with pagination and filters
  getAll: async (params?: EventQueryParams): Promise<PaginatedResponse<Event>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Event>>>('/events', {
      params: {
        ...params,
        status: Array.isArray(params?.status) ? params.status.join(',') : params?.status,
        severity: Array.isArray(params?.severity) ? params.severity.join(',') : params?.severity,
        categoryId: Array.isArray(params?.categoryId) ? params.categoryId.join(',') : params?.categoryId,
        organizationalUnitId: Array.isArray(params?.organizationalUnitId)
          ? params.organizationalUnitId.join(',')
          : params?.organizationalUnitId,
      },
    });
    return response.data.data;
  },

  // Get single event with details
  getById: async (id: string, includeDetails = true): Promise<EventDetails> => {
    const response = await api.get<ApiResponse<EventDetails>>(`/events/${id}`, {
      params: { includeDetails },
    });
    return response.data.data;
  },

  // Create new event
  create: async (data: CreateEventData): Promise<Event> => {
    const response = await api.post<ApiResponse<Event>>('/events', data);
    return response.data.data;
  },

  // Update event
  update: async (id: string, data: UpdateEventData): Promise<Event> => {
    const response = await api.put<ApiResponse<Event>>(`/events/${id}`, data);
    return response.data.data;
  },

  // Delete event
  delete: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
  },

  // Change event status
  changeStatus: async (id: string, status: Event['status'], reason?: string): Promise<Event> => {
    const response = await api.put<ApiResponse<Event>>(`/events/${id}/status`, { status, reason });
    return response.data.data;
  },

  // Assign event to user
  assign: async (id: string, assignedToId: string | null): Promise<Event> => {
    const response = await api.put<ApiResponse<Event>>(`/events/${id}/assign`, { assignedToId });
    return response.data.data;
  },

  // Get event statistics
  getStats: async (params?: Pick<EventFilters, 'dateFrom' | 'dateTo' | 'organizationalUnitId'>): Promise<EventStats> => {
    const response = await api.get<ApiResponse<EventStats>>('/events/stats', { params });
    return response.data.data;
  },

  // Export events
  export: async (params?: EventQueryParams, format: 'xlsx' | 'csv' | 'pdf' = 'xlsx'): Promise<Blob> => {
    const response = await api.get('/events/export', {
      params: { ...params, format },
      responseType: 'blob',
    });
    return response.data;
  },

  // Bulk operations
  bulkUpdateStatus: async (ids: string[], status: Event['status']): Promise<Event[]> => {
    const response = await api.put<ApiResponse<Event[]>>('/events/bulk/status', { ids, status });
    return response.data.data;
  },

  bulkAssign: async (ids: string[], assignedToId: string): Promise<Event[]> => {
    const response = await api.put<ApiResponse<Event[]>>('/events/bulk/assign', { ids, assignedToId });
    return response.data.data;
  },

  bulkDelete: async (ids: string[]): Promise<void> => {
    await api.delete('/events/bulk', { data: { ids } });
  },
};

// ===========================================
// Event Comments Service
// ===========================================

export const eventCommentsService = {
  // Get all comments for an event
  getAll: async (eventId: string): Promise<EventComment[]> => {
    const response = await api.get<ApiResponse<EventComment[]>>(`/events/${eventId}/comments`);
    return response.data.data;
  },

  // Add comment
  create: async (eventId: string, content: string): Promise<EventComment> => {
    const response = await api.post<ApiResponse<EventComment>>(`/events/${eventId}/comments`, { content });
    return response.data.data;
  },

  // Update comment
  update: async (eventId: string, commentId: string, content: string): Promise<EventComment> => {
    const response = await api.put<ApiResponse<EventComment>>(`/events/${eventId}/comments/${commentId}`, { content });
    return response.data.data;
  },

  // Delete comment
  delete: async (eventId: string, commentId: string): Promise<void> => {
    await api.delete(`/events/${eventId}/comments/${commentId}`);
  },
};

// ===========================================
// Event Attachments Service
// ===========================================

export const eventAttachmentsService = {
  // Get all attachments for an event
  getAll: async (eventId: string): Promise<EventAttachment[]> => {
    const response = await api.get<ApiResponse<EventAttachment[]>>(`/events/${eventId}/attachments`);
    return response.data.data;
  },

  // Upload attachment
  upload: async (eventId: string, file: File, documentTypeId?: string): Promise<EventAttachment> => {
    const formData = new FormData();
    formData.append('file', file);
    if (documentTypeId) {
      formData.append('documentTypeId', documentTypeId);
    }

    const response = await api.post<ApiResponse<EventAttachment>>(`/events/${eventId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Upload multiple attachments
  uploadMultiple: async (eventId: string, files: File[], documentTypeId?: string): Promise<EventAttachment[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    if (documentTypeId) {
      formData.append('documentTypeId', documentTypeId);
    }

    const response = await api.post<ApiResponse<EventAttachment[]>>(`/events/${eventId}/attachments/bulk`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Download attachment
  download: async (eventId: string, attachmentId: string): Promise<Blob> => {
    const response = await api.get(`/events/${eventId}/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Delete attachment
  delete: async (eventId: string, attachmentId: string): Promise<void> => {
    await api.delete(`/events/${eventId}/attachments/${attachmentId}`);
  },
};

// ===========================================
// Event Tasks Service
// ===========================================

export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: EventTask['priority'];
  assignedToId?: string;
  dueDate?: string;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  status?: EventTask['status'];
}

export const eventTasksService = {
  // Get all tasks for an event
  getAll: async (eventId: string): Promise<EventTask[]> => {
    const response = await api.get<ApiResponse<EventTask[]>>(`/events/${eventId}/tasks`);
    return response.data.data;
  },

  // Get single task
  getById: async (eventId: string, taskId: string): Promise<EventTask> => {
    const response = await api.get<ApiResponse<EventTask>>(`/events/${eventId}/tasks/${taskId}`);
    return response.data.data;
  },

  // Create task
  create: async (eventId: string, data: CreateTaskData): Promise<EventTask> => {
    const response = await api.post<ApiResponse<EventTask>>(`/events/${eventId}/tasks`, data);
    return response.data.data;
  },

  // Update task
  update: async (eventId: string, taskId: string, data: UpdateTaskData): Promise<EventTask> => {
    const response = await api.put<ApiResponse<EventTask>>(`/events/${eventId}/tasks/${taskId}`, data);
    return response.data.data;
  },

  // Change task status
  changeStatus: async (eventId: string, taskId: string, status: EventTask['status']): Promise<EventTask> => {
    const response = await api.put<ApiResponse<EventTask>>(`/events/${eventId}/tasks/${taskId}/status`, { status });
    return response.data.data;
  },

  // Delete task
  delete: async (eventId: string, taskId: string): Promise<void> => {
    await api.delete(`/events/${eventId}/tasks/${taskId}`);
  },
};

// ===========================================
// Event Timeline Service
// ===========================================

export const eventTimelineService = {
  // Get timeline for an event
  getAll: async (eventId: string): Promise<EventTimeline[]> => {
    const response = await api.get<ApiResponse<EventTimeline[]>>(`/events/${eventId}/timeline`);
    return response.data.data;
  },
};

// Export combined service
export default {
  events: eventsService,
  comments: eventCommentsService,
  attachments: eventAttachmentsService,
  tasks: eventTasksService,
  timeline: eventTimelineService,
};
