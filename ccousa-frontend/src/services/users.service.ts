/**
 * Users Service
 * API services for users, groups, roles, and permissions management
 */

import api from './api';
import type { User, Group, Role, Permission, OrganizationalUnit } from '../types';

// ===========================================
// Types
// ===========================================

export interface UserQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  roleId?: string;
  groupId?: string;
  organizationalUnitId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
  organizationalUnitId?: string;
  phone?: string;
  identifier?: string;
}

export interface UpdateUserData {
  identifier?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  roleId?: string;
  organizationalUnitId?: string;
  phone?: string;
  isActive?: boolean;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: { roleId: string; roleName: string; count: number }[];
  byOrganizationalUnit: { unitId: string; unitName: string; count: number }[];
  newThisMonth: number;
  lastLoginToday: number;
}

export interface GroupQueryParams {
  search?: string;
  groupType?: string;
  parentId?: string;
  isActive?: boolean;
}

export interface CreateGroupData {
  code: string;
  name: string;
  description?: string;
  groupType?: string;
  parentId?: string;
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  groupType?: string;
  parentId?: string;
  isActive?: boolean;
}

export interface GroupMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
}

export interface CreateRoleData {
  code: string;
  name: string;
  description?: string;
  level: number;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  level?: number;
  isActive?: boolean;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface PermissionsByModule {
  module: string;
  moduleName: string;
  permissions: Permission[];
}

// ===========================================
// API Response Types
// ===========================================

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ===========================================
// Users Service
// ===========================================

export const usersService = {
  /**
   * Get all users with pagination and filters
   */
  async getAll(params: UserQueryParams = {}): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('limit', params.pageSize.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.roleId) queryParams.append('roleId', params.roleId);
    if (params.groupId) queryParams.append('groupId', params.groupId);
    if (params.organizationalUnitId) queryParams.append('organizationalUnitId', params.organizationalUnitId);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await api.get(`/users?${queryParams.toString()}`);

    // Transform backend response to frontend format
    const users = response.data.data?.users || response.data.users || [];
    const pagination = response.data.data?.pagination || response.data.pagination || {
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      total: users.length,
      totalPages: 1,
    };

    return {
      success: true,
      data: users.map(transformUser),
      pagination: {
        page: pagination.page,
        pageSize: pagination.limit || pagination.pageSize,
        total: pagination.total,
        totalPages: pagination.totalPages,
      },
    };
  },

  /**
   * Get user by ID
   */
  async getById(id: string): Promise<ApiResponse<User>> {
    const response = await api.get(`/users/${id}`);
    return {
      success: true,
      data: transformUser(response.data.data || response.data),
    };
  },

  /**
   * Create a new user
   */
  async create(data: CreateUserData): Promise<ApiResponse<User>> {
    const response = await api.post('/users', data);
    return {
      success: true,
      data: transformUser(response.data.data || response.data),
    };
  },

  /**
   * Update an existing user
   */
  async update(id: string, data: UpdateUserData): Promise<ApiResponse<User>> {
    const response = await api.put(`/users/${id}`, data);
    return {
      success: true,
      data: transformUser(response.data.data || response.data),
    };
  },

  /**
   * Delete a user
   */
  async delete(id: string): Promise<ApiResponse<{ id: string }>> {
    const response = await api.delete(`/users/${id}`);
    return {
      success: true,
      data: response.data.data || { id },
    };
  },

  /**
   * Toggle user active status
   */
  async toggleActive(id: string, isActive: boolean): Promise<ApiResponse<User>> {
    const response = await api.put(`/users/${id}`, { isActive });
    return {
      success: true,
      data: transformUser(response.data.data || response.data),
    };
  },

  /**
   * Get user statistics
   */
  async getStats(): Promise<ApiResponse<UserStats>> {
    const response = await api.get('/users/stats');
    return {
      success: true,
      data: response.data.data || response.data,
    };
  },

  /**
   * Get roles list
   */
  async getRoles(): Promise<ApiResponse<Role[]>> {
    const response = await api.get('/users/roles');
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformRole),
    };
  },

  /**
   * Get organizational units
   */
  async getOrganizationalUnits(): Promise<ApiResponse<OrganizationalUnit[]>> {
    const response = await api.get('/users/organizational-units');
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformOrganizationalUnit),
    };
  },

  /**
   * Reset user password
   */
  async resetPassword(id: string, newPassword: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await api.post(`/users/${id}/reset-password`, { newPassword });
    return {
      success: true,
      data: response.data.data || { success: true },
    };
  },

  /**
   * Get users by group
   */
  async getByGroup(groupId: string): Promise<ApiResponse<User[]>> {
    const response = await api.get(`/users/groups/${groupId}/members`);
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformUser),
    };
  },
};

// ===========================================
// Groups Service
// ===========================================

export const groupsService = {
  /**
   * Get all groups
   */
  async getAll(params: GroupQueryParams = {}): Promise<ApiResponse<Group[]>> {
    const queryParams = new URLSearchParams();

    if (params.search) queryParams.append('search', params.search);
    if (params.groupType) queryParams.append('groupType', params.groupType);
    if (params.parentId) queryParams.append('parentId', params.parentId);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const response = await api.get(`/users/groups/list?${queryParams.toString()}`);
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformGroup),
    };
  },

  /**
   * Get group by ID
   */
  async getById(id: string): Promise<ApiResponse<Group>> {
    const response = await api.get(`/users/groups/${id}`);
    return {
      success: true,
      data: transformGroup(response.data.data || response.data),
    };
  },

  /**
   * Create a new group
   */
  async create(data: CreateGroupData): Promise<ApiResponse<Group>> {
    const response = await api.post('/users/groups', data);
    return {
      success: true,
      data: transformGroup(response.data.data || response.data),
    };
  },

  /**
   * Update an existing group
   */
  async update(id: string, data: UpdateGroupData): Promise<ApiResponse<Group>> {
    const response = await api.put(`/users/groups/${id}`, data);
    return {
      success: true,
      data: transformGroup(response.data.data || response.data),
    };
  },

  /**
   * Delete a group
   */
  async delete(id: string): Promise<ApiResponse<{ id: string }>> {
    const response = await api.delete(`/users/groups/${id}`);
    return {
      success: true,
      data: response.data.data || { id },
    };
  },

  /**
   * Get group members
   */
  async getMembers(groupId: string): Promise<ApiResponse<GroupMember[]>> {
    const response = await api.get(`/users/groups/${groupId}/members`);
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformGroupMember),
    };
  },

  /**
   * Add user to group
   */
  async addMember(groupId: string, userId: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await api.post(`/users/groups/${groupId}/members`, { userId });
    return {
      success: true,
      data: response.data.data || { success: true },
    };
  },

  /**
   * Remove user from group
   */
  async removeMember(groupId: string, userId: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await api.delete(`/users/groups/${groupId}/members/${userId}`);
    return {
      success: true,
      data: response.data.data || { success: true },
    };
  },

  /**
   * Get group hierarchy tree
   */
  async getHierarchy(): Promise<ApiResponse<Group[]>> {
    const response = await api.get('/users/groups/list');
    const groups = (response.data.data || response.data || []).map(transformGroup);

    // Build hierarchy
    const groupMap = new Map<string, Group>();
    groups.forEach(g => groupMap.set(g.id, { ...g, children: [] }));

    const rootGroups: Group[] = [];
    groups.forEach(g => {
      const group = groupMap.get(g.id)!;
      if (g.parentId && groupMap.has(g.parentId)) {
        const parent = groupMap.get(g.parentId)!;
        if (!parent.children) parent.children = [];
        parent.children.push(group);
      } else {
        rootGroups.push(group);
      }
    });

    return {
      success: true,
      data: rootGroups,
    };
  },
};

// ===========================================
// Roles Service
// ===========================================

export const rolesService = {
  /**
   * Get all roles with permissions
   */
  async getAll(): Promise<ApiResponse<RoleWithPermissions[]>> {
    const response = await api.get('/users/roles/list');
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformRoleWithPermissions),
    };
  },

  /**
   * Get role by ID
   */
  async getById(id: string): Promise<ApiResponse<RoleWithPermissions>> {
    const response = await api.get(`/users/roles/${id}`);
    return {
      success: true,
      data: transformRoleWithPermissions(response.data.data || response.data),
    };
  },

  /**
   * Create a new role
   */
  async create(data: CreateRoleData): Promise<ApiResponse<Role>> {
    const response = await api.post('/users/roles/create', data);
    return {
      success: true,
      data: transformRole(response.data.data || response.data),
    };
  },

  /**
   * Update an existing role
   */
  async update(id: string, data: UpdateRoleData): Promise<ApiResponse<Role>> {
    const response = await api.put(`/users/roles/${id}`, data);
    return {
      success: true,
      data: transformRole(response.data.data || response.data),
    };
  },

  /**
   * Assign permission to role
   */
  async assignPermission(roleId: string, permissionId: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await api.post(`/users/roles/${roleId}/permissions`, { permissionId });
    return {
      success: true,
      data: response.data.data || { success: true },
    };
  },

  /**
   * Revoke permission from role
   */
  async revokePermission(roleId: string, permissionId: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await api.delete(`/users/roles/${roleId}/permissions/${permissionId}`);
    return {
      success: true,
      data: response.data.data || { success: true },
    };
  },

  /**
   * Update role permissions (batch)
   */
  async updatePermissions(roleId: string, permissionIds: string[]): Promise<ApiResponse<{ success: boolean }>> {
    const response = await api.put(`/users/roles/${roleId}/permissions`, { permissionIds });
    return {
      success: true,
      data: response.data.data || { success: true },
    };
  },
};

// ===========================================
// Permissions Service
// ===========================================

export const permissionsService = {
  /**
   * Get all permissions
   */
  async getAll(): Promise<ApiResponse<Permission[]>> {
    const response = await api.get('/users/permissions/list');
    return {
      success: true,
      data: (response.data.data || response.data || []).map(transformPermission),
    };
  },

  /**
   * Get permissions grouped by module
   */
  async getByModule(): Promise<ApiResponse<PermissionsByModule[]>> {
    const response = await api.get('/users/permissions/list');
    const permissions = (response.data.data || response.data || []).map(transformPermission);

    // Group by module
    const moduleMap = new Map<string, Permission[]>();
    permissions.forEach((p: Permission) => {
      const module = p.module || 'OTHER';
      if (!moduleMap.has(module)) {
        moduleMap.set(module, []);
      }
      moduleMap.get(module)!.push(p);
    });

    const moduleLabels: Record<string, string> = {
      EVENTS: 'Événements',
      PROCEDURES: 'Procédures',
      FORMS: 'Formulaires',
      USERS: 'Utilisateurs',
      GROUPS: 'Groupes',
      SETTINGS: 'Paramètres',
      ANALYTICS: 'Statistiques',
      KNOWLEDGE: 'Base de connaissances',
      OTHER: 'Autres',
    };

    const result: PermissionsByModule[] = [];
    moduleMap.forEach((perms, module) => {
      result.push({
        module,
        moduleName: moduleLabels[module] || module,
        permissions: perms,
      });
    });

    return {
      success: true,
      data: result.sort((a, b) => a.moduleName.localeCompare(b.moduleName)),
    };
  },
};

// ===========================================
// Transform Functions
// ===========================================

function transformUser(data: Record<string, unknown>): User {
  return {
    id: data.id as string,
    email: data.email as string,
    firstName: data.first_name as string || data.firstName as string || '',
    lastName: data.last_name as string || data.lastName as string || '',
    phone: data.phone as string || undefined,
    identifier: data.identifier as string || undefined,
    avatarUrl: data.avatar_url as string || data.avatarUrl as string || undefined,
    isActive: data.is_active as boolean ?? data.isActive as boolean ?? true,
    roleId: data.role_id as string || data.roleId as string || '',
    role: data.role_name ? {
      id: data.role_id as string || data.roleId as string || '',
      code: '',
      name: data.role_name as string,
      level: 0,
      isSystem: false,
      createdAt: '',
      updatedAt: '',
    } : undefined,
    organizationalUnitId: data.organizational_unit_id as string || data.organizationalUnitId as string || undefined,
    organizationalUnit: data.organizational_unit_name ? {
      id: data.organizational_unit_id as string || data.organizationalUnitId as string || '',
      code: '',
      name: data.organizational_unit_name as string,
      type: 'NATIONAL',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    } : undefined,
    supervisorId: data.supervisor_id as string || data.supervisorId as string || undefined,
    languageCode: data.language_code as string || data.languageCode as string || 'fr',
    timezoneId: data.timezone_id as string || data.timezoneId as string || undefined,
    lastLoginAt: data.last_login_at as string || data.lastLoginAt as string || undefined,
    createdAt: data.created_at as string || data.createdAt as string || '',
    updatedAt: data.updated_at as string || data.updatedAt as string || '',
  };
}

function transformRole(data: Record<string, unknown>): Role {
  return {
    id: data.id as string,
    code: data.code as string || '',
    name: data.name as string || '',
    description: data.description as string || undefined,
    level: data.level as number || 0,
    isSystem: data.is_system as boolean ?? data.isSystem as boolean ?? false,
    createdAt: data.created_at as string || data.createdAt as string || '',
    updatedAt: data.updated_at as string || data.updatedAt as string || '',
  };
}

function transformRoleWithPermissions(data: Record<string, unknown>): RoleWithPermissions {
  const role = transformRole(data);
  const permissions = ((data.permissions as Record<string, unknown>[]) || []).map(transformPermission);
  return { ...role, permissions };
}

function transformPermission(data: Record<string, unknown>): Permission {
  return {
    id: data.id as string,
    code: data.code as string || '',
    name: data.name as string || '',
    description: data.description as string || undefined,
    module: data.module as string || 'OTHER',
    isActive: data.is_active as boolean ?? data.isActive as boolean ?? true,
    createdAt: data.created_at as string || data.createdAt as string || '',
    updatedAt: data.updated_at as string || data.updatedAt as string || '',
  };
}

function transformGroup(data: Record<string, unknown>): Group {
  return {
    id: data.id as string,
    code: data.code as string || '',
    name: data.name as string || '',
    description: data.description as string || undefined,
    parentId: data.parent_id as string || data.parentId as string || undefined,
    isActive: data.is_active as boolean ?? data.isActive as boolean ?? true,
    memberCount: data.members_count as number || data.memberCount as number || 0,
    createdAt: data.created_at as string || data.createdAt as string || '',
    updatedAt: data.updated_at as string || data.updatedAt as string || '',
  };
}

function transformGroupMember(data: Record<string, unknown>): GroupMember {
  return {
    id: data.id as string,
    email: data.email as string || '',
    firstName: data.first_name as string || data.firstName as string || '',
    lastName: data.last_name as string || data.lastName as string || '',
    roleName: data.role_name as string || data.roleName as string || '',
  };
}

function transformOrganizationalUnit(data: Record<string, unknown>): OrganizationalUnit {
  return {
    id: data.id as string,
    code: data.code as string || '',
    name: data.name as string || '',
    type: (data.type as OrganizationalUnit['type']) || 'NATIONAL',
    parentId: data.parent_id as string || data.parentId as string || undefined,
    latitude: data.latitude as number || undefined,
    longitude: data.longitude as number || undefined,
    isActive: data.is_active as boolean ?? data.isActive as boolean ?? true,
    createdAt: data.created_at as string || data.createdAt as string || '',
    updatedAt: data.updated_at as string || data.updatedAt as string || '',
  };
}

export default {
  users: usersService,
  groups: groupsService,
  roles: rolesService,
  permissions: permissionsService,
};
