/**
 * Users Hooks
 * React Query hooks for users, groups, roles, and permissions management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  usersService,
  groupsService,
  rolesService,
  permissionsService,
  type UserQueryParams,
  type CreateUserData,
  type UpdateUserData,
  type GroupQueryParams,
  type CreateGroupData,
  type UpdateGroupData,
  type CreateRoleData,
  type UpdateRoleData,
} from '../services/users.service';

// ===========================================
// Query Keys
// ===========================================

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: UserQueryParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  stats: () => [...userKeys.all, 'stats'] as const,
  roles: () => [...userKeys.all, 'roles'] as const,
  organizationalUnits: () => [...userKeys.all, 'organizational-units'] as const,
};

export const groupKeys = {
  all: ['groups'] as const,
  lists: () => [...groupKeys.all, 'list'] as const,
  list: (params: GroupQueryParams) => [...groupKeys.lists(), params] as const,
  details: () => [...groupKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupKeys.details(), id] as const,
  members: (id: string) => [...groupKeys.all, 'members', id] as const,
  hierarchy: () => [...groupKeys.all, 'hierarchy'] as const,
};

export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: string) => [...roleKeys.details(), id] as const,
};

export const permissionKeys = {
  all: ['permissions'] as const,
  lists: () => [...permissionKeys.all, 'list'] as const,
  byModule: () => [...permissionKeys.all, 'by-module'] as const,
};

// ===========================================
// Users Hooks
// ===========================================

/**
 * Get all users with pagination and filters
 */
export function useUsers(params: UserQueryParams = {}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersService.getAll(params),
    select: (response) => ({
      users: response.data,
      pagination: response.pagination,
    }),
  });
}

/**
 * Get user by ID
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersService.getById(id),
    select: (response) => response.data,
    enabled: !!id,
  });
}

/**
 * Get user statistics
 */
export function useUserStats() {
  return useQuery({
    queryKey: userKeys.stats(),
    queryFn: () => usersService.getStats(),
    select: (response) => response.data,
  });
}

/**
 * Get roles list
 */
export function useRolesList() {
  return useQuery({
    queryKey: userKeys.roles(),
    queryFn: () => usersService.getRoles(),
    select: (response) => response.data,
  });
}

/**
 * Get organizational units
 */
export function useOrganizationalUnits() {
  return useQuery({
    queryKey: userKeys.organizationalUnits(),
    queryFn: () => usersService.getOrganizationalUnits(),
    select: (response) => response.data,
  });
}

/**
 * Create user mutation
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserData) => usersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
    },
  });
}

/**
 * Update user mutation
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      usersService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
    },
  });
}

/**
 * Delete user mutation
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
    },
  });
}

/**
 * Toggle user active status mutation
 */
export function useToggleUserActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersService.toggleActive(id, isActive),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
    },
  });
}

/**
 * Reset user password mutation
 */
export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      usersService.resetPassword(id, newPassword),
  });
}

// ===========================================
// Groups Hooks
// ===========================================

/**
 * Get all groups
 */
export function useGroups(params: GroupQueryParams = {}) {
  return useQuery({
    queryKey: groupKeys.list(params),
    queryFn: () => groupsService.getAll(params),
    select: (response) => response.data,
  });
}

/**
 * Get group by ID
 */
export function useGroup(id: string) {
  return useQuery({
    queryKey: groupKeys.detail(id),
    queryFn: () => groupsService.getById(id),
    select: (response) => response.data,
    enabled: !!id,
  });
}

/**
 * Get group members
 */
export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: groupKeys.members(groupId),
    queryFn: () => groupsService.getMembers(groupId),
    select: (response) => response.data,
    enabled: !!groupId,
  });
}

/**
 * Get group hierarchy tree
 */
export function useGroupHierarchy() {
  return useQuery({
    queryKey: groupKeys.hierarchy(),
    queryFn: () => groupsService.getHierarchy(),
    select: (response) => response.data,
  });
}

/**
 * Create group mutation
 */
export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGroupData) => groupsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupKeys.hierarchy() });
    },
  });
}

/**
 * Update group mutation
 */
export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGroupData }) =>
      groupsService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: groupKeys.hierarchy() });
    },
  });
}

/**
 * Delete group mutation
 */
export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => groupsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupKeys.hierarchy() });
    },
  });
}

/**
 * Add member to group mutation
 */
export function useAddGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      groupsService.addMember(groupId, userId),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
}

/**
 * Remove member from group mutation
 */
export function useRemoveGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      groupsService.removeMember(groupId, userId),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
}

// ===========================================
// Roles Hooks
// ===========================================

/**
 * Get all roles with permissions
 */
export function useRoles() {
  return useQuery({
    queryKey: roleKeys.lists(),
    queryFn: () => rolesService.getAll(),
    select: (response) => response.data,
  });
}

/**
 * Get role by ID
 */
export function useRole(id: string) {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: () => rolesService.getById(id),
    select: (response) => response.data,
    enabled: !!id,
  });
}

/**
 * Create role mutation
 */
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoleData) => rolesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.roles() });
    },
  });
}

/**
 * Update role mutation
 */
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleData }) =>
      rolesService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: userKeys.roles() });
    },
  });
}

/**
 * Assign permission to role mutation
 */
export function useAssignPermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      rolesService.assignPermission(roleId, permissionId),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(roleId) });
    },
  });
}

/**
 * Revoke permission from role mutation
 */
export function useRevokePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      rolesService.revokePermission(roleId, permissionId),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(roleId) });
    },
  });
}

/**
 * Update role permissions (batch) mutation
 */
export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      rolesService.updatePermissions(roleId, permissionIds),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(roleId) });
    },
  });
}

// ===========================================
// Permissions Hooks
// ===========================================

/**
 * Get all permissions
 */
export function usePermissions() {
  return useQuery({
    queryKey: permissionKeys.lists(),
    queryFn: () => permissionsService.getAll(),
    select: (response) => response.data,
  });
}

/**
 * Get permissions grouped by module
 */
export function usePermissionsByModule() {
  return useQuery({
    queryKey: permissionKeys.byModule(),
    queryFn: () => permissionsService.getByModule(),
    select: (response) => response.data,
  });
}
