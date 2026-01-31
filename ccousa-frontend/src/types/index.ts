// ==========================================
// CCOUSA-APP Type Definitions
// ==========================================

// Base types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// User & Authentication
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  identifier?: string;
  avatarUrl?: string;
  isActive: boolean;
  roleId: string;
  role?: Role;
  organizationalUnitId?: string;
  organizationalUnit?: OrganizationalUnit;
  supervisorId?: string;
  supervisor?: User;
  languageCode: string;
  timezoneId?: string;
  lastLoginAt?: string;
}

export interface Role extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  level: number;
  isSystem: boolean;
  permissions?: Permission[];
}

export interface Permission extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  module: string;
  isActive: boolean;
}

export interface Group extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  parent?: Group;
  children?: Group[];
  isActive: boolean;
  members?: User[];
  memberCount?: number;
}

// Organizational Structure
export interface OrganizationalUnit extends BaseEntity {
  code: string;
  name: string;
  type: 'NATIONAL' | 'REGIONAL' | 'DEPARTMENTAL' | 'ARRONDISSEMENT' | 'DISTRICT';
  parentId?: string;
  parent?: OrganizationalUnit;
  children?: OrganizationalUnit[];
  latitude?: number;
  longitude?: number;
  isActive: boolean;
}

// Event Categories
export interface EventCategory extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
}

// Document Types
export interface DocumentType extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  allowedExtensions?: string[];
  maxSizeBytes?: number;
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
}

// Work Schedules
export interface WorkSchedule extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  timezoneId: string;
  startDate?: string;
  endDate?: string;
  isDefault: boolean;
  isActive: boolean;
  days?: WorkScheduleDay[];
}

export interface WorkScheduleDay {
  id: string;
  workScheduleId: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  startTime: string; // HH:mm format
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  breakDurationMinutes?: number;
  isWorkingDay: boolean;
}

// System Configuration
export interface SystemConfiguration extends BaseEntity {
  key: string;
  value: string;
  dataType: 'string' | 'number' | 'boolean' | 'json' | 'date';
  category: string;
  description?: string;
  isEditable: boolean;
  isActive: boolean;
}

// Reference Data
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface Country {
  code: string;
  name: string;
  iso3: string;
  phoneCode?: string;
  isActive: boolean;
}

export interface Timezone {
  id: string;
  name: string;
  offset: string;
  offsetMinutes: number;
  isActive: boolean;
}

// External Steps (for procedures)
export interface ExternalStep extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  organization: string;
  contactEmail?: string;
  contactPhone?: string;
  apiEndpoint?: string;
  isActive: boolean;
}

// Forms
export interface Form extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  version: number;
  isPublished: boolean;
  isActive: boolean;
  sections?: FormSection[];
}

export interface FormSection extends BaseEntity {
  formId: string;
  title: string;
  description?: string;
  sortOrder: number;
  columns: 1 | 2 | 3;
  isCollapsible: boolean;
  fields?: FormField[];
}

export interface FormField extends BaseEntity {
  sectionId: string;
  fieldTypeId: string;
  fieldType?: FieldType;
  code: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  isRequired: boolean;
  isReadonly: boolean;
  isHidden: boolean;
  validationRules?: Record<string, unknown>;
  options?: FieldOption[];
  sortOrder: number;
  columnSpan: 1 | 2 | 3;
}

export interface FieldType {
  id: string;
  code: string;
  name: string;
  component: string;
  icon?: string;
  hasOptions: boolean;
  validationSchema?: Record<string, unknown>;
}

export interface FieldOption {
  value: string;
  label: string;
  sortOrder: number;
}

// Procedures
export interface Procedure extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  type: 'INVESTIGATION' | 'VACCINATION' | 'INSPECTION' | 'SAMPLING' | 'TREATMENT' | 'OTHER';
  groupId?: string;
  group?: ProcedureGroup;
  categoryId?: string;
  category?: EventCategory;
  triggerType: 'MANUAL' | 'AUTOMATIC' | 'SCHEDULED';
  triggerConfig?: Record<string, unknown>;
  isActive: boolean;
  steps?: ProcedureStep[];
}

export interface ProcedureGroup extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  parent?: ProcedureGroup;
  children?: ProcedureGroup[];
  isActive: boolean;
}

export interface ProcedureStep extends BaseEntity {
  procedureId: string;
  name: string;
  description?: string;
  stepNumber: number;
  durationHours?: number;
  isOptional: boolean;
  assigneeType: 'USER' | 'ROLE' | 'GROUP' | 'UNIT';
  assigneeId?: string;
  formId?: string;
  form?: Form;
  requiredDocuments?: DocumentType[];
  externalStepId?: string;
  externalStep?: ExternalStep;
}

// Events
export interface Event extends BaseEntity {
  code: string;
  title: string;
  description?: string;
  categoryId: string;
  category?: EventCategory;
  status: 'REPORTED' | 'INVESTIGATING' | 'CONFIRMED' | 'RESOLVED' | 'CLOSED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location: string;
  latitude?: number;
  longitude?: number;
  organizationalUnitId?: string;
  organizationalUnit?: OrganizationalUnit;
  reportedById: string;
  reportedBy?: User;
  assignedToId?: string;
  assignedTo?: User;
  reportedAt: string;
  confirmedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
}

// Notifications
export interface Notification extends BaseEntity {
  userId: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'TASK';
  channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  notificationType: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: ApiError[];
}

export interface ApiError {
  code: string;
  field?: string;
  message: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// UI State Types
export interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view' | 'delete';
  data?: unknown;
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
}

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  isExpanded?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  icon?: React.ReactNode;
  data?: unknown;
}

// Theme
export type Theme = 'light' | 'dark' | 'system';

// Toast
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}
