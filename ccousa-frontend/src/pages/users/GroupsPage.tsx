import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users2,
  FolderPlus,
  Search,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Edit2,
  Trash2,
  UserPlus,
  UserMinus,
  Eye,
  X,
  Layers,
  Building,
  Shield,
  FolderTree,
  Folder,
} from 'lucide-react';
import {
  useGroups,
  useGroupHierarchy,
  useGroupMembers,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  useAddGroupMember,
  useRemoveGroupMember,
  useUsers,
} from '../../hooks';
import type { Group, User } from '../../types';

// ===========================================
// Group Type Badge
// ===========================================

const GroupTypeBadge: React.FC<{ type?: string }> = ({ type }) => {
  const config: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
    organizational: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-300',
      label: 'Organisationnel',
      icon: <Building className="w-3 h-3" />,
    },
    functional: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-300',
      label: 'Fonctionnel',
      icon: <Layers className="w-3 h-3" />,
    },
    security: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-300',
      label: 'Sécurité',
      icon: <Shield className="w-3 h-3" />,
    },
    project: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-300',
      label: 'Projet',
      icon: <FolderTree className="w-3 h-3" />,
    },
  };

  const cfg = config[type || 'organizational'] || config.organizational;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

// ===========================================
// Tree Node Component
// ===========================================

interface TreeNodeProps {
  group: Group;
  level: number;
  onSelect: (group: Group) => void;
  selectedId?: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({ group, level, onSelect, selectedId }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = group.children && group.children.length > 0;

  return (
    <div>
      <div
        onClick={() => onSelect(group)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
          selectedId === group.id
            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
            : 'hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-200'
        }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className="p-0.5 rounded hover:bg-dark-200 dark:hover:bg-dark-600"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}
        <Folder className={`w-4 h-4 ${selectedId === group.id ? 'text-primary-600' : 'text-dark-400'}`} />
        <span className="flex-1 truncate text-sm font-medium">{group.name}</span>
        <span className="text-xs text-dark-500 dark:text-dark-400">{group.memberCount || 0}</span>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {group.children!.map((child) => (
            <TreeNode
              key={child.id}
              group={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ===========================================
// Group Details Panel
// ===========================================

interface GroupDetailsPanelProps {
  group: Group;
  onEdit: () => void;
  onDelete: () => void;
  onAddMember: () => void;
}

const GroupDetailsPanel: React.FC<GroupDetailsPanelProps> = ({
  group,
  onEdit,
  onDelete,
  onAddMember,
}) => {
  const { data: members = [], isLoading: membersLoading } = useGroupMembers(group.id);
  const removeMemberMutation = useRemoveGroupMember();

  const handleRemoveMember = (userId: string) => {
    removeMemberMutation.mutate({ groupId: group.id, userId });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-dark-200 dark:border-dark-700">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
                <Users2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-dark-900 dark:text-white">{group.name}</h2>
                <p className="text-sm text-dark-500 dark:text-dark-400">{group.code}</p>
              </div>
            </div>
            <div className="mt-4">
              <GroupTypeBadge type={(group as { groupType?: string }).groupType} />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500 hover:text-primary-600 transition-colors"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
        {group.description && (
          <p className="mt-4 text-sm text-dark-600 dark:text-dark-300">{group.description}</p>
        )}
      </div>

      {/* Members */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
            Membres ({members.length})
          </h3>
          <button
            onClick={onAddMember}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors text-sm font-medium"
          >
            <UserPlus className="w-4 h-4" />
            Ajouter
          </button>
        </div>

        {membersLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-10">
            <Users2 className="w-12 h-12 mx-auto text-dark-300 dark:text-dark-600 mb-3" />
            <p className="text-dark-500 dark:text-dark-400">Aucun membre dans ce groupe</p>
            <button
              onClick={onAddMember}
              className="mt-4 text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Ajouter le premier membre
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-xl bg-dark-50 dark:bg-dark-700/50 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                    {`${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-dark-900 dark:text-white">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-xs text-dark-500 dark:text-dark-400">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-dark-500 dark:text-dark-400 bg-dark-100 dark:bg-dark-600 px-2 py-1 rounded">
                    {member.roleName}
                  </span>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={removeMemberMutation.isPending}
                    className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-dark-400 hover:text-red-600 transition-colors"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ===========================================
// Add Member Modal
// ===========================================

interface AddMemberModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ groupId, isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const { data: usersData } = useUsers({ search, pageSize: 20 });
  const { data: currentMembers = [] } = useGroupMembers(groupId);
  const addMemberMutation = useAddGroupMember();

  const users = usersData?.users || [];
  const currentMemberIds = new Set(currentMembers.map((m) => m.id));
  const availableUsers = users.filter((u) => !currentMemberIds.has(u.id));

  const handleAddMember = (userId: string) => {
    addMemberMutation.mutate(
      { groupId, userId },
      {
        onSuccess: () => {
          // Optionally close or show success
        },
      }
    );
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
        className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-200 dark:border-dark-700">
          <h3 className="text-lg font-semibold text-dark-900 dark:text-white">Ajouter des membres</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700"
          >
            <X className="w-5 h-5 text-dark-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-dark-200 dark:border-dark-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-4">
          {availableUsers.length === 0 ? (
            <p className="text-center text-dark-500 dark:text-dark-400 py-8">
              {search ? 'Aucun utilisateur trouvé' : 'Tous les utilisateurs sont déjà membres'}
            </p>
          ) : (
            <div className="space-y-2">
              {availableUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                      {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-dark-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-dark-500 dark:text-dark-400">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddMember(user.id)}
                    disabled={addMemberMutation.isPending}
                    className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ===========================================
// Group Form Modal
// ===========================================

interface GroupFormModalProps {
  group?: Group | null;
  parentGroups: Group[];
  isOpen: boolean;
  onClose: () => void;
}

const GroupFormModal: React.FC<GroupFormModalProps> = ({ group, parentGroups, isOpen, onClose }) => {
  const isEditMode = !!group;
  const createMutation = useCreateGroup();
  const updateMutation = useUpdateGroup();

  const [formData, setFormData] = useState({
    code: group?.code || '',
    name: group?.name || '',
    description: group?.description || '',
    groupType: (group as { groupType?: string })?.groupType || 'organizational',
    parentId: group?.parentId || '',
  });

  const handleSubmit = () => {
    if (isEditMode && group) {
      updateMutation.mutate(
        { id: group.id, data: { name: formData.name, description: formData.description, groupType: formData.groupType, parentId: formData.parentId || undefined } },
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
          <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
            {isEditMode ? 'Modifier le groupe' : 'Nouveau groupe'}
          </h3>
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
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              disabled={isEditMode}
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
              className="w-full px-4 py-2 rounded-xl border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-1">
              Type de groupe
            </label>
            <select
              value={formData.groupType}
              onChange={(e) => setFormData({ ...formData, groupType: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white"
            >
              <option value="organizational">Organisationnel</option>
              <option value="functional">Fonctionnel</option>
              <option value="security">Sécurité</option>
              <option value="project">Projet</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-1">
              Groupe parent
            </label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white"
            >
              <option value="">Aucun (groupe racine)</option>
              {parentGroups.filter((g) => g.id !== group?.id).map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
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
            disabled={createMutation.isPending || updateMutation.isPending}
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
// Delete Confirmation Modal
// ===========================================

interface DeleteModalProps {
  group: Group | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ group, isOpen, onClose, onConfirm, isLoading }) => {
  if (!isOpen || !group) return null;

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
        className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
            <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-dark-900 dark:text-white">Supprimer le groupe</h3>
            <p className="text-sm text-dark-500 dark:text-dark-400">Cette action est irréversible</p>
          </div>
        </div>

        <p className="text-dark-600 dark:text-dark-300 mb-6">
          Êtes-vous sûr de vouloir supprimer le groupe <strong>{group.name}</strong> ?
          Les membres ne seront pas supprimés mais retirés du groupe.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-dark-300 dark:border-dark-600 text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-700"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ===========================================
// Groups Page
// ===========================================

export const GroupsPage: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<Group | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);

  const { data: groups = [] } = useGroups();
  const { data: hierarchy = [] } = useGroupHierarchy();
  const deleteGroupMutation = useDeleteGroup();

  const filteredHierarchy = useMemo(() => {
    if (!searchQuery) return hierarchy;

    const filterGroups = (groups: Group[]): Group[] => {
      return groups
        .filter((g) =>
          g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.code.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map((g) => ({
          ...g,
          children: g.children ? filterGroups(g.children) : [],
        }));
    };

    return filterGroups(hierarchy);
  }, [hierarchy, searchQuery]);

  const handleDelete = () => {
    if (groupToDelete) {
      deleteGroupMutation.mutate(groupToDelete.id, {
        onSuccess: () => {
          setGroupToDelete(null);
          if (selectedGroup?.id === groupToDelete.id) {
            setSelectedGroup(null);
          }
        },
      });
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-6">
      {/* Left Panel - Tree */}
      <div className="w-80 flex-shrink-0 rounded-2xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-dark-200 dark:border-dark-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-dark-900 dark:text-white">Groupes</h2>
            <button
              onClick={() => { setGroupToEdit(null); setShowGroupForm(true); }}
              className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
            >
              <FolderPlus className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white text-sm"
            />
          </div>
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredHierarchy.length === 0 ? (
            <div className="text-center py-10">
              <FolderTree className="w-12 h-12 mx-auto text-dark-300 dark:text-dark-600 mb-3" />
              <p className="text-sm text-dark-500 dark:text-dark-400">
                {searchQuery ? 'Aucun groupe trouvé' : 'Aucun groupe créé'}
              </p>
            </div>
          ) : (
            filteredHierarchy.map((group) => (
              <TreeNode
                key={group.id}
                group={group}
                level={0}
                onSelect={setSelectedGroup}
                selectedId={selectedGroup?.id}
              />
            ))
          )}
        </div>

        {/* Stats */}
        <div className="p-4 border-t border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-700/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-dark-500 dark:text-dark-400">Total groupes</span>
            <span className="font-semibold text-dark-900 dark:text-white">{groups.length}</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Details */}
      <div className="flex-1 rounded-2xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 shadow-lg overflow-hidden">
        {selectedGroup ? (
          <GroupDetailsPanel
            group={selectedGroup}
            onEdit={() => { setGroupToEdit(selectedGroup); setShowGroupForm(true); }}
            onDelete={() => setGroupToDelete(selectedGroup)}
            onAddMember={() => setShowAddMember(true)}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-dark-100 dark:bg-dark-700 flex items-center justify-center mb-4">
              <Users2 className="w-10 h-10 text-dark-400" />
            </div>
            <h3 className="text-xl font-semibold text-dark-900 dark:text-white mb-2">
              Sélectionnez un groupe
            </h3>
            <p className="text-dark-500 dark:text-dark-400 max-w-md">
              Choisissez un groupe dans l'arborescence pour voir ses détails et gérer ses membres.
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <GroupFormModal
        group={groupToEdit}
        parentGroups={groups}
        isOpen={showGroupForm}
        onClose={() => { setShowGroupForm(false); setGroupToEdit(null); }}
      />

      <DeleteModal
        group={groupToDelete}
        isOpen={!!groupToDelete}
        onClose={() => setGroupToDelete(null)}
        onConfirm={handleDelete}
        isLoading={deleteGroupMutation.isPending}
      />

      {selectedGroup && (
        <AddMemberModal
          groupId={selectedGroup.id}
          isOpen={showAddMember}
          onClose={() => setShowAddMember(false)}
        />
      )}
    </div>
  );
};
