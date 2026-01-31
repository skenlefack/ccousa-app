import api, { ApiResponse } from './api';
import type {
  SystemConfiguration,
  EventCategory,
  DocumentType,
  OrganizationalUnit,
  WorkSchedule,
  WorkScheduleDay,
  Language,
  Country,
  Timezone,
} from '../types';

// ===========================================
// System Configuration Service
// ===========================================

export const systemConfigService = {
  // Get all system configurations
  getAll: async (): Promise<SystemConfiguration[]> => {
    const response = await api.get<ApiResponse<SystemConfiguration[]>>('/config/settings');
    return response.data.data;
  },

  // Get single configuration by key
  getByKey: async (key: string): Promise<SystemConfiguration> => {
    const response = await api.get<ApiResponse<SystemConfiguration>>(`/config/settings/${key}`);
    return response.data.data;
  },

  // Update configuration
  update: async (key: string, value: string): Promise<SystemConfiguration> => {
    const response = await api.put<ApiResponse<SystemConfiguration>>(`/config/settings/${key}`, {
      value,
    });
    return response.data.data;
  },

  // Bulk update configurations
  bulkUpdate: async (configs: Array<{ key: string; value: string }>): Promise<SystemConfiguration[]> => {
    const response = await api.put<ApiResponse<SystemConfiguration[]>>('/config/settings/bulk', {
      configurations: configs,
    });
    return response.data.data;
  },
};

// ===========================================
// Event Categories Service
// ===========================================

export const eventCategoryService = {
  // Get all categories
  getAll: async (includeInactive = false): Promise<EventCategory[]> => {
    const response = await api.get<ApiResponse<EventCategory[]>>('/config/event-categories', {
      params: { includeInactive },
    });
    return response.data.data;
  },

  // Get single category
  getById: async (id: string): Promise<EventCategory> => {
    const response = await api.get<ApiResponse<EventCategory>>(`/config/event-categories/${id}`);
    return response.data.data;
  },

  // Create category
  create: async (data: Omit<EventCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<EventCategory> => {
    const response = await api.post<ApiResponse<EventCategory>>('/config/event-categories', data);
    return response.data.data;
  },

  // Update category
  update: async (id: string, data: Partial<EventCategory>): Promise<EventCategory> => {
    const response = await api.put<ApiResponse<EventCategory>>(`/config/event-categories/${id}`, data);
    return response.data.data;
  },

  // Delete category
  delete: async (id: string): Promise<void> => {
    await api.delete(`/config/event-categories/${id}`);
  },

  // Reorder categories
  reorder: async (orderedIds: string[]): Promise<void> => {
    await api.put('/config/event-categories/reorder', { orderedIds });
  },
};

// ===========================================
// Document Types Service
// ===========================================

export const documentTypeService = {
  // Get all document types
  getAll: async (includeInactive = false): Promise<DocumentType[]> => {
    const response = await api.get<ApiResponse<DocumentType[]>>('/config/document-types', {
      params: { includeInactive },
    });
    return response.data.data;
  },

  // Get single document type
  getById: async (id: string): Promise<DocumentType> => {
    const response = await api.get<ApiResponse<DocumentType>>(`/config/document-types/${id}`);
    return response.data.data;
  },

  // Create document type
  create: async (data: Omit<DocumentType, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentType> => {
    const response = await api.post<ApiResponse<DocumentType>>('/config/document-types', data);
    return response.data.data;
  },

  // Update document type
  update: async (id: string, data: Partial<DocumentType>): Promise<DocumentType> => {
    const response = await api.put<ApiResponse<DocumentType>>(`/config/document-types/${id}`, data);
    return response.data.data;
  },

  // Delete document type
  delete: async (id: string): Promise<void> => {
    await api.delete(`/config/document-types/${id}`);
  },

  // Reorder document types
  reorder: async (orderedIds: string[]): Promise<void> => {
    await api.put('/config/document-types/reorder', { orderedIds });
  },
};

// ===========================================
// Organizational Units Service
// ===========================================

export const organizationalUnitService = {
  // Get all units (flat or tree)
  getAll: async (asTree = false): Promise<OrganizationalUnit[]> => {
    const response = await api.get<ApiResponse<OrganizationalUnit[]>>('/config/organizational-units', {
      params: { asTree },
    });
    return response.data.data;
  },

  // Get single unit
  getById: async (id: string): Promise<OrganizationalUnit> => {
    const response = await api.get<ApiResponse<OrganizationalUnit>>(`/config/organizational-units/${id}`);
    return response.data.data;
  },

  // Get children of a unit
  getChildren: async (parentId: string): Promise<OrganizationalUnit[]> => {
    const response = await api.get<ApiResponse<OrganizationalUnit[]>>(
      `/config/organizational-units/${parentId}/children`
    );
    return response.data.data;
  },

  // Create unit
  create: async (data: Omit<OrganizationalUnit, 'id' | 'createdAt' | 'updatedAt'>): Promise<OrganizationalUnit> => {
    const response = await api.post<ApiResponse<OrganizationalUnit>>('/config/organizational-units', data);
    return response.data.data;
  },

  // Update unit
  update: async (id: string, data: Partial<OrganizationalUnit>): Promise<OrganizationalUnit> => {
    const response = await api.put<ApiResponse<OrganizationalUnit>>(`/config/organizational-units/${id}`, data);
    return response.data.data;
  },

  // Delete unit
  delete: async (id: string): Promise<void> => {
    await api.delete(`/config/organizational-units/${id}`);
  },

  // Move unit (change parent)
  move: async (id: string, newParentId: string | null): Promise<OrganizationalUnit> => {
    const response = await api.put<ApiResponse<OrganizationalUnit>>(`/config/organizational-units/${id}/move`, {
      parentId: newParentId,
    });
    return response.data.data;
  },
};

// ===========================================
// Work Schedules Service
// ===========================================

export const workScheduleService = {
  // Get all schedules
  getAll: async (): Promise<WorkSchedule[]> => {
    const response = await api.get<ApiResponse<WorkSchedule[]>>('/config/work-schedules');
    return response.data.data;
  },

  // Get single schedule with days
  getById: async (id: string): Promise<WorkSchedule> => {
    const response = await api.get<ApiResponse<WorkSchedule>>(`/config/work-schedules/${id}`);
    return response.data.data;
  },

  // Create schedule
  create: async (data: {
    code: string;
    name: string;
    description?: string;
    timezoneId: string;
    startDate?: string;
    endDate?: string;
    isDefault?: boolean;
    days: Omit<WorkScheduleDay, 'id' | 'workScheduleId'>[];
  }): Promise<WorkSchedule> => {
    const response = await api.post<ApiResponse<WorkSchedule>>('/config/work-schedules', data);
    return response.data.data;
  },

  // Update schedule
  update: async (id: string, data: Partial<WorkSchedule>): Promise<WorkSchedule> => {
    const response = await api.put<ApiResponse<WorkSchedule>>(`/config/work-schedules/${id}`, data);
    return response.data.data;
  },

  // Delete schedule
  delete: async (id: string): Promise<void> => {
    await api.delete(`/config/work-schedules/${id}`);
  },

  // Update schedule days
  updateDays: async (scheduleId: string, days: Omit<WorkScheduleDay, 'id' | 'workScheduleId'>[]): Promise<WorkScheduleDay[]> => {
    const response = await api.put<ApiResponse<WorkScheduleDay[]>>(
      `/config/work-schedules/${scheduleId}/days`,
      { days }
    );
    return response.data.data;
  },

  // Set as default
  setDefault: async (id: string): Promise<WorkSchedule> => {
    const response = await api.put<ApiResponse<WorkSchedule>>(`/config/work-schedules/${id}/set-default`);
    return response.data.data;
  },
};

// ===========================================
// Reference Data Service
// ===========================================

export const referenceDataService = {
  // Get languages
  getLanguages: async (): Promise<Language[]> => {
    const response = await api.get<ApiResponse<Language[]>>('/config/languages');
    return response.data.data;
  },

  // Get countries
  getCountries: async (): Promise<Country[]> => {
    const response = await api.get<ApiResponse<Country[]>>('/config/countries');
    return response.data.data;
  },

  // Get timezones
  getTimezones: async (): Promise<Timezone[]> => {
    const response = await api.get<ApiResponse<Timezone[]>>('/config/timezones');
    return response.data.data;
  },

  // Get all reference data at once
  getAll: async (): Promise<{
    languages: Language[];
    countries: Country[];
    timezones: Timezone[];
  }> => {
    const response = await api.get<
      ApiResponse<{
        languages: Language[];
        countries: Country[];
        timezones: Timezone[];
      }>
    >('/config/reference-data');
    return response.data.data;
  },
};

// Export all services
export const settingsService = {
  systemConfig: systemConfigService,
  eventCategories: eventCategoryService,
  documentTypes: documentTypeService,
  organizationalUnits: organizationalUnitService,
  workSchedules: workScheduleService,
  referenceData: referenceDataService,
};

export default settingsService;
