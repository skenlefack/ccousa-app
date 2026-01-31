import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  Building2,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  X,
  Key,
  UserCog,
  Clock,
} from 'lucide-react';
import {
  useUsers,
  useUserStats,
  useDeleteUser,
  useToggleUserActive,
  useRolesList,
  useOrganizationalUnits,
} from '../../hooks';
import type { User, Role } from '../../types';
import type { UserQueryParams } from '../../services/users.service';

// ===========================================
// Stats Card Component
// ===========================================

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; isUp: boolean };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 p-6 shadow-lg"
  >
    <div className="absolute -right-4 -top-4 opacity-10">
      <div className={`w-24 h-24 rounded-full ${color}`} />
    </div>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-dark-500 dark:text-dark-400">{title}</p>
        <p className="mt-2 text-3xl font-bold text-dark-900 dark:text-white">{value}</p>
        {trend && (
          <p className={`mt-1 text-xs flex items-center gap-1 ${trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isUp ? '+' : '-'}{Math.abs(trend.value)}% ce mois
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-20 dark:bg-opacity-30`}>
        {icon}
      </div>
    </div>
  </motion.div>
);

// ===========================================
// Role Badge
// ===========================================

const RoleBadge: React.FC<{ role?: Role | string }> = ({ role }) => {
  const roleName = typeof role === 'string' ? role : role?.name || 'Utilisateur';
  const roleLevel = typeof role === 'object' ? role?.level || 5 : 5;

  const config: Record<number, { bg: string; text: string }> = {
    1: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
    2: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
    3: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
    4: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
    5: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-300' },
  };

  const cfg = config[roleLevel] || config[5];

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <Shield className="w-3 h-3" />
      {roleName}
    </span>
  );
};

// ===========================================
// Status Badge
// ===========================================

const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
      isActive
        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
    }`}
  >
    {isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
    {isActive ? 'Actif' : 'Inactif'}
  </span>
);

// ===========================================
// User Card (Grid View)
// ===========================================

interface UserCardProps {
  user: User;
  onView: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onResetPassword: () => void;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  onView,
  onEdit,
  onToggleActive,
  onDelete,
  onResetPassword,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative group rounded-2xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      {/* Menu Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
        >
          <MoreVertical className="w-4 h-4 text-dark-500" />
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 top-10 z-20 w-48 bg-white dark:bg-dark-800 rounded-xl shadow-xl border border-dark-200 dark:border-dark-700 py-2"
            >
              <button
                onClick={() => { onView(); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-700 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Voir le profil
              </button>
              <button
                onClick={() => { onEdit(); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-700 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Modifier
              </button>
              <button
                onClick={() => { onResetPassword(); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-700 flex items-center gap-2"
              >
                <Key className="w-4 h-4" />
                Réinitialiser le mot de passe
              </button>
              <button
                onClick={() => { onToggleActive(); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-700 flex items-center gap-2"
              >
                {user.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                {user.isActive ? 'Désactiver' : 'Activer'}
              </button>
              <hr className="my-2 border-dark-200 dark:border-dark-700" />
              <button
                onClick={() => { onDelete(); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Avatar */}
      <div className="flex flex-col items-center text-center mb-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <h3 className="mt-4 text-lg font-semibold text-dark-900 dark:text-white">
          {user.firstName} {user.lastName}
        </h3>
        {user.identifier && (
          <p className="text-sm text-dark-500 dark:text-dark-400">{user.identifier}</p>
        )}
      </div>

      {/* User Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-300">
          <Mail className="w-4 h-4 text-dark-400" />
          <span className="truncate">{user.email}</span>
        </div>
        {user.phone && (
          <div className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-300">
            <Phone className="w-4 h-4 text-dark-400" />
            <span>{user.phone}</span>
          </div>
        )}
        {user.organizationalUnit && (
          <div className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-300">
            <Building2 className="w-4 h-4 text-dark-400" />
            <span className="truncate">{user.organizationalUnit.name}</span>
          </div>
        )}
        {user.lastLoginAt && (
          <div className="flex items-center gap-2 text-sm text-dark-500 dark:text-dark-400">
            <Clock className="w-4 h-4" />
            <span>Dernière connexion: {new Date(user.lastLoginAt).toLocaleDateString('fr-FR')}</span>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="mt-4 flex flex-wrap gap-2">
        <RoleBadge role={user.role || user.roleId} />
        <StatusBadge isActive={user.isActive} />
      </div>
    </motion.div>
  );
};

// ===========================================
// Delete Confirmation Modal
// ===========================================

interface DeleteModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ user, isOpen, onClose, onConfirm, isLoading }) => {
  if (!isOpen || !user) return null;

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
            <h3 className="text-lg font-semibold text-dark-900 dark:text-white">Supprimer l'utilisateur</h3>
            <p className="text-sm text-dark-500 dark:text-dark-400">Cette action est irréversible</p>
          </div>
        </div>

        <p className="text-dark-600 dark:text-dark-300 mb-6">
          Êtes-vous sûr de vouloir supprimer <strong>{user.firstName} {user.lastName}</strong> ?
          Toutes les données associées seront perdues.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-dark-300 dark:border-dark-600 text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ===========================================
// User Form Modal
// ===========================================

interface UserFormModalProps {
  user?: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ user, isOpen, onClose }) => {
  const isEditMode = !!user;
  const { data: roles = [] } = useRolesList();
  const { data: units = [] } = useOrganizationalUnits();

  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    identifier: user?.identifier || '',
    roleId: user?.roleId || '',
    organizationalUnitId: user?.organizationalUnitId || '',
    password: '',
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-200 dark:border-dark-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/30">
              <UserCog className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-xl font-bold text-dark-900 dark:text-white">
              {isEditMode ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            </h2>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-1">
                Prénom *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-1">
                Nom *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-1">
                Identifiant
              </label>
              <input
                type="text"
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                placeholder="Généré automatiquement"
                className="w-full px-4 py-2 rounded-xl border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-1">
              Rôle *
            </label>
            <select
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Sélectionner un rôle</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-1">
              Unité organisationnelle
            </label>
            <select
              value={formData.organizationalUnitId}
              onChange={(e) => setFormData({ ...formData, organizationalUnitId: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Sélectionner une unité</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </div>

          {!isEditMode && (
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-1">
                Mot de passe *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-dark-200 dark:border-dark-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-dark-300 dark:border-dark-600 text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
          >
            Annuler
          </button>
          <button
            className="flex-1 px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            {isEditMode ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ===========================================
// Users List Page
// ===========================================

interface UsersListPageProps {
  onNavigate?: (path: string) => void;
}

export const UsersListPage: React.FC<UsersListPageProps> = ({ onNavigate }) => {
  // State
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<UserQueryParams>({
    page: 1,
    pageSize: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);

  // Queries
  const queryParams = useMemo(() => ({
    ...filters,
    search: searchQuery || undefined,
    roleId: selectedRole || undefined,
    isActive: selectedStatus === 'active' ? true : selectedStatus === 'inactive' ? false : undefined,
  }), [filters, searchQuery, selectedRole, selectedStatus]);

  const { data: usersData, isLoading } = useUsers(queryParams);
  const { data: stats } = useUserStats();
  const { data: roles = [] } = useRolesList();

  // Mutations
  const deleteUserMutation = useDeleteUser();
  const toggleActiveMutation = useToggleUserActive();

  // Handlers
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleView = (user: User) => {
    onNavigate?.(`/users/${user.id}`);
  };

  const handleEdit = (user: User) => {
    setUserToEdit(user);
    setShowUserForm(true);
  };

  const handleCreate = () => {
    setUserToEdit(null);
    setShowUserForm(true);
  };

  const handleDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id, {
        onSuccess: () => setUserToDelete(null),
      });
    }
  };

  const handleToggleActive = (user: User) => {
    toggleActiveMutation.mutate({ id: user.id, isActive: !user.isActive });
  };

  const handleResetPassword = (user: User) => {
    console.log('Reset password for:', user.id);
  };

  const users = usersData?.users || [];
  const pagination = usersData?.pagination || { page: 1, pageSize: 12, total: 0, totalPages: 0 };

  const totalPages = pagination.totalPages;
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    const start = Math.max(1, pagination.page - 2);
    return start + i;
  }).filter(p => p <= totalPages);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark-900 dark:text-white">
            Utilisateurs
          </h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">
            Gérez les utilisateurs et leurs accès
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-300 hover:-translate-y-0.5"
        >
          <UserPlus className="w-5 h-5" />
          Nouvel utilisateur
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total utilisateurs"
          value={stats?.total || 0}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Utilisateurs actifs"
          value={stats?.active || 0}
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          color="bg-green-500"
          trend={{ value: 5, isUp: true }}
        />
        <StatCard
          title="Utilisateurs inactifs"
          value={stats?.inactive || 0}
          icon={<XCircle className="w-6 h-6 text-red-600" />}
          color="bg-red-500"
        />
        <StatCard
          title="Connexions aujourd'hui"
          value={stats?.lastLoginToday || 0}
          icon={<Clock className="w-6 h-6 text-purple-600" />}
          color="bg-purple-500"
        />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou identifiant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl text-dark-900 dark:text-white placeholder-dark-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 rounded-xl border flex items-center gap-2 transition-colors ${
            showFilters
              ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
              : 'border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-800/80 text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-700'
          }`}
        >
          <Filter className="w-5 h-5" />
          Filtres
        </button>

        {/* View Mode Toggle */}
        <div className="flex rounded-xl border border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-800/80 overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-3 flex items-center gap-2 ${
              viewMode === 'grid'
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'text-dark-500 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-700'
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-3 flex items-center gap-2 ${
              viewMode === 'table'
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'text-dark-500 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-700'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-dark-200 dark:border-dark-700">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-2">
                  Rôle
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white"
                >
                  <option value="">Tous les rôles</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-2">
                  Statut
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-dark-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-dark-900 dark:text-white"
                >
                  <option value="">Tous les statuts</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedRole('');
                    setSelectedStatus('');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users Grid/Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-dark-100 dark:bg-dark-800 flex items-center justify-center">
            <Users className="w-10 h-10 text-dark-400" />
          </div>
          <h3 className="text-xl font-semibold text-dark-900 dark:text-white mb-2">
            Aucun utilisateur trouvé
          </h3>
          <p className="text-dark-500 dark:text-dark-400 mb-6">
            Commencez par créer votre premier utilisateur
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Créer un utilisateur
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onView={() => handleView(user)}
              onEdit={() => handleEdit(user)}
              onToggleActive={() => handleToggleActive(user)}
              onDelete={() => setUserToDelete(user)}
              onResetPassword={() => handleResetPassword(user)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 shadow-lg">
          <table className="w-full">
            <thead className="bg-dark-50 dark:bg-dark-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-dark-50 dark:hover:bg-dark-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                        {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-dark-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        {user.identifier && (
                          <p className="text-sm text-dark-500 dark:text-dark-400">{user.identifier}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-dark-900 dark:text-white">{user.email}</p>
                    {user.phone && (
                      <p className="text-sm text-dark-500 dark:text-dark-400">{user.phone}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <RoleBadge role={user.role || user.roleId} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge isActive={user.isActive} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleView(user)}
                        className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500 hover:text-primary-600 transition-colors"
                        title="Voir"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500 hover:text-blue-600 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setUserToDelete(user)}
                        className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500 hover:text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="p-2 rounded-lg border border-dark-200 dark:border-dark-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-100 dark:hover:bg-dark-700"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {pages.map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                page === pagination.page
                  ? 'bg-primary-600 text-white'
                  : 'border border-dark-200 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-200'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === totalPages}
            className="p-2 rounded-lg border border-dark-200 dark:border-dark-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-100 dark:hover:bg-dark-700"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Modals */}
      <DeleteModal
        user={userToDelete}
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDelete}
        isLoading={deleteUserMutation.isPending}
      />

      <UserFormModal
        user={userToEdit}
        isOpen={showUserForm}
        onClose={() => { setShowUserForm(false); setUserToEdit(null); }}
        onSuccess={() => { setShowUserForm(false); setUserToEdit(null); }}
      />
    </div>
  );
};
