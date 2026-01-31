import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldPlus,
  Key,
  Lock,
  Unlock,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Users,
  Settings,
  FileText,
  Calendar,
  BarChart3,
  BookOpen,
  Bell,
  Database,
} from 'lucide-react';
import {
  useRoles,
  usePermissions,
  usePermissionsByModule,
  useCreateRole,
  useUpdateRole,
  useAssignPermission,
  useRevokePermission,
  useUpdateRolePermissions,
} from '../../hooks';
import type { Role, Permission } from '../../types';
import type { RoleWithPermissions } from '../../services/users.service';

// ===========================================
// Module Icons
// ===========================================

const moduleIcons: Record<string, React.ReactNode> = {
  EVENTS: <Calendar className="w-4 h-4" />,
  PROCEDURES: <FileText className="w-4 h-4" />,
  FORMS: <FileText className="w-4 h-4" />,
  USERS: <Users className="w-4 h-4" />,
  GROUPS: <Users className="w-4 h-4" />,
  SETTINGS: <Settings className="w-4 h-4" />,
  ANALYTICS: <BarChart3 className="w-4 h-4" />,
  KNOWLEDGE: <BookOpen className="w-4 h-4" />,
  NOTIFICATIONS: <Bell className="w-4 h-4" />,
  OTHER: <Database className="w-4 h-4" />,
};

// ===========================================
// Role Level Badge
// ===========================================

const RoleLevelBadge: React.FC<{ level: number }> = ({ level }) => {
  const config: Record<number, { bg: string; text: string; label: string }> = {
    1: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Super Admin' },
    2: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', label: 'Admin' },
    3: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Manager' },
    4: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Utilisateur' },
    5: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-300', label: 'Invité' },
  };

  const cfg = config[level] || config[5];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
};

// ===========================================
// Role Card
// ===========================================

interface RoleCardProps {
  role: RoleWithPermissions;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
}

const RoleCard: React.FC<RoleCardProps> = ({ role, isSelected, onClick, onEdit }) => {
  const permissionCount = role.permissions?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`relative p-4 rounded-xl cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500 shadow-lg'
          : 'bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary-200 dark:bg-primary-800' : 'bg-dark-100 dark:bg-dark-700'}`}>
            <Shield className={`w-5 h-5 ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-dark-500'}`} />
          </div>
          <div>
            <h3 className={`font-semibold ${isSelected ? 'text-primary-900 dark:text-primary-100' : 'text-dark-900 dark:text-white'}`}>
              {role.name}
            </h3>
            <p className="text-xs text-dark-500 dark:text-dark-400">{role.code}</p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-1.5 rounded-lg hover:bg-dark-200 dark:hover:bg-dark-600 text-dark-400 hover:text-dark-600 dark:hover:text-dark-200 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      {role.description && (
        <p className="mt-3 text-sm text-dark-600 dark:text-dark-300 line-clamp-2">
          {role.description}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <RoleLevelBadge level={role.level} />
        <div className="flex items-center gap-1 text-xs text-dark-500 dark:text-dark-400">
          <Key className="w-3 h-3" />
          <span>{permissionCount} permissions</span>
        </div>
      </div>
    </motion.div>
  );
};

// ===========================================
// Permission Module Card
// ===========================================

interface PermissionModuleCardProps {
  module: string;
  moduleName: string;
  permissions: Permission[];
  assignedPermissions: Set<string>;
  onToggle: (permissionId: string, isAssigned: boolean) => void;
  isEditing: boolean;
}

const PermissionModuleCard: React.FC<PermissionModuleCardProps> = ({
  module,
  moduleName,
  permissions,
  assignedPermissions,
  onToggle,
  isEditing,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const assignedCount = permissions.filter((p) => assignedPermissions.has(p.id)).length;
  const allAssigned = assignedCount === permissions.length;
  const someAssigned = assignedCount > 0 && !allAssigned;

  return (
    <div className="rounded-xl border border-dark-200 dark:border-dark-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-dark-50 dark:bg-dark-700/50 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${assignedCount > 0 ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-dark-100 dark:bg-dark-600'}`}>
            {moduleIcons[module] || moduleIcons.OTHER}
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-dark-900 dark:text-white">{moduleName}</h4>
            <p className="text-xs text-dark-500 dark:text-dark-400">
              {assignedCount} / {permissions.length} permissions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress indicator */}
          <div className="w-20 h-2 bg-dark-200 dark:bg-dark-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${(assignedCount / permissions.length) * 100}%` }}
            />
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-dark-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-dark-400" />
          )}
        </div>
      </button>

      {/* Permissions List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-2 bg-white dark:bg-dark-800">
              {permissions.map((permission) => {
                const isAssigned = assignedPermissions.has(permission.id);

                return (
                  <div
                    key={permission.id}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                      isAssigned
                        ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                        : 'bg-dark-50 dark:bg-dark-700/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded ${isAssigned ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-dark-100 dark:bg-dark-600'}`}>
                        {isAssigned ? (
                          <Unlock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        ) : (
                          <Lock className="w-4 h-4 text-dark-400" />
                        )}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isAssigned ? 'text-primary-900 dark:text-primary-100' : 'text-dark-700 dark:text-dark-200'}`}>
                          {permission.name}
                        </p>
                        <p className="text-xs text-dark-500 dark:text-dark-400">{permission.code}</p>
                      </div>
                    </div>

                    {isEditing && (
                      <button
                        onClick={() => onToggle(permission.id, isAssigned)}
                        className={`p-2 rounded-lg transition-colors ${
                          isAssigned
                            ? 'bg-primary-500 text-white hover:bg-primary-600'
                            : 'bg-dark-200 dark:bg-dark-600 text-dark-500 hover:bg-dark-300 dark:hover:bg-dark-500'
                        }`}
                      >
                        {isAssigned ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ===========================================
// Role Form Modal
// ===========================================

interface RoleFormModalProps {
  role?: RoleWithPermissions | null;
  isOpen: boolean;
  onClose: () => void;
}

const RoleFormModal: React.FC<RoleFormModalProps> = ({ role, isOpen, onClose }) => {
  const isEditMode = !!role;
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();

  const [formData, setFormData] = useState({
    code: role?.code || '',
    name: role?.name || '',
    description: role?.description || '',
    level: role?.level || 4,
  });

  const handleSubmit = () => {
    if (isEditMode && role) {
      updateMutation.mutate(
        { id: role.id, data: { name: formData.name, description: formData.description, level: formData.level } },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(formData, { onSuccess: onClose });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-200 dark:border-dark-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/30">
              <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
              {isEditMode ? 'Modifier le rôle' : 'Nouveau rôle'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700"
          >
            <X className="w-5 h-5 text-dark-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-1">
              Code *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              disabled={isEditMode}
              placeholder="ROLE_CODE"
              className="w-full px-4 py-2 rounded-xl border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-1">
              Nom *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nom du rôle"
              className="w-full px-4 py-2 rounded-xl border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Description du rôle..."
              className="w-full px-4 py-2 rounded-xl border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-1">
              Niveau de privilège
            </label>
            <select
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
              className="w-full px-4 py-2 rounded-xl border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white"
            >
              <option value={1}>1 - Super Administrateur</option>
              <option value={2}>2 - Administrateur</option>
              <option value={3}>3 - Manager</option>
              <option value={4}>4 - Utilisateur standard</option>
              <option value={5}>5 - Invité</option>
            </select>
            <p className="mt-1 text-xs text-dark-500 dark:text-dark-400">
              Plus le niveau est bas, plus les privilèges sont élevés
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-dark-200 dark:border-dark-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-dark-300 dark:border-dark-600 text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-700"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending || !formData.name || !formData.code}
            className="flex-1 px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {isEditMode ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ===========================================
// Roles & Permissions Page
// ===========================================

export const RolesPermissionsPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<RoleWithPermissions | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());

  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: permissionsByModule = [] } = usePermissionsByModule();

  const assignPermissionMutation = useAssignPermission();
  const revokePermissionMutation = useRevokePermission();

  // Get assigned permissions for selected role
  const assignedPermissions = useMemo(() => {
    if (!selectedRole) return new Set<string>();
    const set = new Set(selectedRole.permissions?.map((p) => p.id) || []);
    // Apply pending changes
    pendingChanges.forEach((id) => {
      if (set.has(id)) {
        set.delete(id);
      } else {
        set.add(id);
      }
    });
    return set;
  }, [selectedRole, pendingChanges]);

  const handleTogglePermission = (permissionId: string, isCurrentlyAssigned: boolean) => {
    if (!selectedRole) return;

    setPendingChanges((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  const handleSaveChanges = async () => {
    if (!selectedRole || pendingChanges.size === 0) return;

    // Process changes
    const originalPermissions = new Set(selectedRole.permissions?.map((p) => p.id) || []);

    for (const permissionId of pendingChanges) {
      if (originalPermissions.has(permissionId)) {
        // Was assigned, now revoking
        await revokePermissionMutation.mutateAsync({ roleId: selectedRole.id, permissionId });
      } else {
        // Was not assigned, now assigning
        await assignPermissionMutation.mutateAsync({ roleId: selectedRole.id, permissionId });
      }
    }

    setPendingChanges(new Set());
    setIsEditing(false);
  };

  const handleCancelChanges = () => {
    setPendingChanges(new Set());
    setIsEditing(false);
  };

  const handleSelectRole = (role: RoleWithPermissions) => {
    if (pendingChanges.size > 0) {
      // Could show a confirmation dialog here
      setPendingChanges(new Set());
    }
    setSelectedRole(role);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark-900 dark:text-white">
            Rôles & Permissions
          </h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">
            Gérez les rôles et configurez les droits d'accès
          </p>
        </div>
        <button
          onClick={() => { setRoleToEdit(null); setShowRoleForm(true); }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-300 hover:-translate-y-0.5"
        >
          <ShieldPlus className="w-5 h-5" />
          Nouveau rôle
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-dark-900 dark:text-white">
              Rôles ({roles.length})
            </h2>
          </div>

          {rolesLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center py-10 rounded-xl bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700">
              <Shield className="w-12 h-12 mx-auto text-dark-300 dark:text-dark-600 mb-3" />
              <p className="text-dark-500 dark:text-dark-400">Aucun rôle créé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {roles.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  isSelected={selectedRole?.id === role.id}
                  onClick={() => handleSelectRole(role)}
                  onEdit={() => { setRoleToEdit(role); setShowRoleForm(true); }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Permissions Panel */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 shadow-lg overflow-hidden">
            {selectedRole ? (
              <>
                {/* Header */}
                <div className="p-6 border-b border-dark-200 dark:border-dark-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-dark-900 dark:text-white">
                        Permissions de {selectedRole.name}
                      </h2>
                      <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
                        {assignedPermissions.size} permissions attribuées
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleCancelChanges}
                            className="px-4 py-2 rounded-lg border border-dark-300 dark:border-dark-600 text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={handleSaveChanges}
                            disabled={pendingChanges.size === 0}
                            className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Enregistrer ({pendingChanges.size})
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Modifier
                        </button>
                      )}
                    </div>
                  </div>

                  {pendingChanges.size > 0 && (
                    <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        {pendingChanges.size} modification(s) non enregistrée(s)
                      </p>
                    </div>
                  )}
                </div>

                {/* Permissions by Module */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                  {permissionsByModule.map((module) => (
                    <PermissionModuleCard
                      key={module.module}
                      module={module.module}
                      moduleName={module.moduleName}
                      permissions={module.permissions}
                      assignedPermissions={assignedPermissions}
                      onToggle={handleTogglePermission}
                      isEditing={isEditing}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                <div className="w-20 h-20 rounded-full bg-dark-100 dark:bg-dark-700 flex items-center justify-center mb-4">
                  <Key className="w-10 h-10 text-dark-400" />
                </div>
                <h3 className="text-xl font-semibold text-dark-900 dark:text-white mb-2">
                  Sélectionnez un rôle
                </h3>
                <p className="text-dark-500 dark:text-dark-400 max-w-md">
                  Choisissez un rôle dans la liste pour voir et gérer ses permissions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role Form Modal */}
      <RoleFormModal
        role={roleToEdit}
        isOpen={showRoleForm}
        onClose={() => { setShowRoleForm(false); setRoleToEdit(null); }}
      />
    </div>
  );
};
