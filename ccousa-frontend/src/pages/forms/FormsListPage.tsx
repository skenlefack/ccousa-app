import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  Eye,
  Edit2,
  Copy,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Archive,
  Globe,
  FileCheck,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useForms, useFormStats, useDeleteForm, useDuplicateForm, usePublishForm, useUnpublishForm } from '../../hooks';
import type { Form } from '../../types';
import type { FormQueryParams } from '../../services/forms.service';

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
// Form Type Badge
// ===========================================

const FormTypeBadge: React.FC<{ type?: string }> = ({ type }) => {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    PARAMETER: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Paramètre' },
    PROCEDURE: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', label: 'Procédure' },
    EVENT: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', label: 'Événement' },
    REPORT: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Rapport' },
    SURVEY: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300', label: 'Enquête' },
  };

  const cfg = config[type || 'PARAMETER'] || config.PARAMETER;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
};

// ===========================================
// Status Badge
// ===========================================

const StatusBadge: React.FC<{ isPublished: boolean; isActive: boolean }> = ({ isPublished, isActive }) => {
  if (!isActive) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
        <Archive className="w-3 h-3" />
        Inactif
      </span>
    );
  }
  if (isPublished) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
        <Globe className="w-3 h-3" />
        Publié
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
      <Clock className="w-3 h-3" />
      Brouillon
    </span>
  );
};

// ===========================================
// Fields Preview
// ===========================================

const FieldsPreview: React.FC<{ sections?: Form['sections'] }> = ({ sections }) => {
  const totalFields = sections?.reduce((acc, s) => acc + (s.fields?.length || 0), 0) || 0;
  const sectionCount = sections?.length || 0;

  return (
    <div className="flex items-center gap-3 text-xs text-dark-500 dark:text-dark-400">
      <span className="flex items-center gap-1">
        <Layers className="w-3.5 h-3.5" />
        {sectionCount} section{sectionCount !== 1 ? 's' : ''}
      </span>
      <span className="flex items-center gap-1">
        <FileText className="w-3.5 h-3.5" />
        {totalFields} champ{totalFields !== 1 ? 's' : ''}
      </span>
    </div>
  );
};

// ===========================================
// Form Card Component
// ===========================================

interface FormCardProps {
  form: Form;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
}

const FormCard: React.FC<FormCardProps> = ({
  form,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onPublish,
  onUnpublish,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 shadow-lg hover:shadow-xl transition-all duration-300 group"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <FormTypeBadge type={(form as { type?: string }).type} />
              <StatusBadge isPublished={form.isPublished} isActive={form.isActive} />
            </div>
            <h3 className="text-lg font-semibold text-dark-900 dark:text-white truncate">
              {form.name}
            </h3>
            <p className="text-sm text-dark-500 dark:text-dark-400 font-mono">{form.code}</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-dark-400" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-dark-800 rounded-xl shadow-xl border border-dark-200 dark:border-dark-700 py-1 z-20"
                >
                  <button
                    onClick={() => { onView(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:hover:bg-dark-700"
                  >
                    <Eye className="w-4 h-4" />
                    Aperçu
                  </button>
                  <button
                    onClick={() => { onEdit(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:hover:bg-dark-700"
                  >
                    <Edit2 className="w-4 h-4" />
                    Modifier
                  </button>
                  <button
                    onClick={() => { onDuplicate(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:hover:bg-dark-700"
                  >
                    <Copy className="w-4 h-4" />
                    Dupliquer
                  </button>
                  <hr className="my-1 border-dark-200 dark:border-dark-700" />
                  {form.isPublished ? (
                    <button
                      onClick={() => { onUnpublish(); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                    >
                      <Clock className="w-4 h-4" />
                      Dépublier
                    </button>
                  ) : (
                    <button
                      onClick={() => { onPublish(); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      <Globe className="w-4 h-4" />
                      Publier
                    </button>
                  )}
                  <button
                    onClick={() => { onDelete(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {form.description && (
          <p className="text-sm text-dark-600 dark:text-dark-300 line-clamp-2 mb-4">
            {form.description}
          </p>
        )}

        <FieldsPreview sections={form.sections} />

        <div className="mt-4 pt-4 border-t border-dark-100 dark:border-dark-700 flex items-center justify-between">
          <span className="text-xs text-dark-400">
            v{form.version}
          </span>
          <span className="text-xs text-dark-400">
            {new Date(form.updatedAt).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// ===========================================
// Delete Confirmation Modal
// ===========================================

interface DeleteModalProps {
  form: Form | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ form, onClose, onConfirm, isDeleting }) => {
  if (!form) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
              Supprimer le formulaire
            </h3>
            <p className="text-sm text-dark-500 dark:text-dark-400">
              Cette action est irréversible
            </p>
          </div>
        </div>

        <p className="text-dark-600 dark:text-dark-300 mb-6">
          Êtes-vous sûr de vouloir supprimer le formulaire <strong>{form.name}</strong> ?
          Toutes les données associées seront perdues.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors font-medium"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Supprimer
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ===========================================
// Duplicate Modal
// ===========================================

interface DuplicateModalProps {
  form: Form | null;
  onClose: () => void;
  onConfirm: (name: string, code: string) => void;
  isDuplicating: boolean;
}

const DuplicateModal: React.FC<DuplicateModalProps> = ({ form, onClose, onConfirm, isDuplicating }) => {
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');

  React.useEffect(() => {
    if (form) {
      setNewName(`${form.name} (copie)`);
      setNewCode(`${form.code}_COPY`);
    }
  }, [form]);

  if (!form) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
            Dupliquer le formulaire
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
          >
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-1">
              Nouveau nom
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-1">
              Nouveau code
            </label>
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDuplicating}
            className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors font-medium"
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(newName, newCode)}
            disabled={isDuplicating || !newName || !newCode}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDuplicating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                Duplication...
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Dupliquer
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ===========================================
// Forms List Page
// ===========================================

interface FormsListPageProps {
  onNavigate?: (path: string) => void;
}

export const FormsListPage: React.FC<FormsListPageProps> = ({ onNavigate }) => {
  // State
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FormQueryParams>({
    page: 1,
    pageSize: 12,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [formToDelete, setFormToDelete] = useState<Form | null>(null);
  const [formToDuplicate, setFormToDuplicate] = useState<Form | null>(null);

  // Queries
  const queryParams = useMemo(() => ({
    ...filters,
    search: searchQuery || undefined,
    type: selectedType || undefined,
    isPublished: selectedStatus === 'published' ? true : selectedStatus === 'draft' ? false : undefined,
    isActive: selectedStatus === 'inactive' ? false : undefined,
  }), [filters, searchQuery, selectedType, selectedStatus]);

  const { data: formsData, isLoading } = useForms(queryParams);
  const { data: stats } = useFormStats();

  // Mutations
  const deleteFormMutation = useDeleteForm();
  const duplicateFormMutation = useDuplicateForm();
  const publishFormMutation = usePublishForm();
  const unpublishFormMutation = useUnpublishForm();

  // Handlers
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleView = (form: Form) => {
    onNavigate?.(`/forms/${form.id}/preview`);
  };

  const handleEdit = (form: Form) => {
    onNavigate?.(`/forms/${form.id}/edit`);
  };

  const handleCreate = () => {
    onNavigate?.('/forms/new');
  };

  const handleDelete = () => {
    if (formToDelete) {
      deleteFormMutation.mutate(formToDelete.id, {
        onSuccess: () => setFormToDelete(null),
      });
    }
  };

  const handleDuplicate = (name: string, code: string) => {
    if (formToDuplicate) {
      duplicateFormMutation.mutate(
        { id: formToDuplicate.id, newName: name, newCode: code },
        { onSuccess: () => setFormToDuplicate(null) }
      );
    }
  };

  const handlePublish = (form: Form) => {
    publishFormMutation.mutate(form.id);
  };

  const handleUnpublish = (form: Form) => {
    unpublishFormMutation.mutate(form.id);
  };

  const forms = formsData?.items || [];
  const totalPages = formsData?.totalPages || 1;

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark-900 dark:text-white">
            Formulaires
          </h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">
            Créez et gérez vos formulaires dynamiques
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-300 hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          Nouveau formulaire
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total formulaires"
          value={stats?.total || 0}
          icon={<FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Publiés"
          value={stats?.byStatus.published || 0}
          icon={<Globe className="w-6 h-6 text-green-600 dark:text-green-400" />}
          color="bg-green-500"
        />
        <StatCard
          title="Brouillons"
          value={stats?.byStatus.draft || 0}
          icon={<Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />}
          color="bg-yellow-500"
        />
        <StatCard
          title="Soumissions"
          value={stats?.submissionStats?.total || 0}
          icon={<FileCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
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
            placeholder="Rechercher un formulaire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 text-dark-900 dark:text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            <option value="">Tous les types</option>
            <option value="PARAMETER">Paramètre</option>
            <option value="PROCEDURE">Procédure</option>
            <option value="EVENT">Événement</option>
            <option value="REPORT">Rapport</option>
            <option value="SURVEY">Enquête</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            <option value="">Tous les statuts</option>
            <option value="published">Publiés</option>
            <option value="draft">Brouillons</option>
            <option value="inactive">Inactifs</option>
          </select>

          {/* View Toggle */}
          <div className="flex rounded-xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'text-dark-400 hover:text-dark-600 dark:hover:text-dark-200'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'text-dark-400 hover:text-dark-600 dark:hover:text-dark-200'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Forms List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full"
          />
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-dark-100 dark:bg-dark-800 flex items-center justify-center">
            <FileText className="w-10 h-10 text-dark-400" />
          </div>
          <h3 className="text-xl font-semibold text-dark-900 dark:text-white mb-2">
            Aucun formulaire trouvé
          </h3>
          <p className="text-dark-500 dark:text-dark-400 mb-6">
            Commencez par créer votre premier formulaire
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Créer un formulaire
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {forms.map((form) => (
              <FormCard
                key={form.id}
                form={form}
                onView={() => handleView(form)}
                onEdit={() => handleEdit(form)}
                onDuplicate={() => setFormToDuplicate(form)}
                onDelete={() => setFormToDelete(form)}
                onPublish={() => handlePublish(form)}
                onUnpublish={() => handleUnpublish(form)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 shadow-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-200 dark:border-dark-700">
                <th className="text-left px-6 py-4 text-sm font-semibold text-dark-500 dark:text-dark-400">
                  Formulaire
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-dark-500 dark:text-dark-400">
                  Type
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-dark-500 dark:text-dark-400">
                  Statut
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-dark-500 dark:text-dark-400">
                  Version
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-dark-500 dark:text-dark-400">
                  Mise à jour
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-dark-500 dark:text-dark-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {forms.map((form) => (
                <tr
                  key={form.id}
                  className="border-b border-dark-100 dark:border-dark-700 hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-dark-900 dark:text-white">{form.name}</p>
                      <p className="text-sm text-dark-500 dark:text-dark-400 font-mono">{form.code}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <FormTypeBadge type={(form as { type?: string }).type} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge isPublished={form.isPublished} isActive={form.isActive} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-dark-600 dark:text-dark-300">v{form.version}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-dark-500 dark:text-dark-400">
                      {new Date(form.updatedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleView(form)}
                        className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-600 transition-colors"
                        title="Aperçu"
                      >
                        <Eye className="w-4 h-4 text-dark-400" />
                      </button>
                      <button
                        onClick={() => handleEdit(form)}
                        className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-600 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4 text-dark-400" />
                      </button>
                      <button
                        onClick={() => setFormToDuplicate(form)}
                        className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-600 transition-colors"
                        title="Dupliquer"
                      >
                        <Copy className="w-4 h-4 text-dark-400" />
                      </button>
                      <button
                        onClick={() => setFormToDelete(form)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
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
            onClick={() => handlePageChange(filters.page! - 1)}
            disabled={filters.page === 1}
            className="p-2 rounded-xl bg-white/80 dark:bg-dark-800/80 border border-white/20 dark:border-dark-700/50 text-dark-600 dark:text-dark-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => {
              const current = filters.page!;
              return page === 1 || page === totalPages || (page >= current - 1 && page <= current + 1);
            })
            .map((page, idx, arr) => (
              <React.Fragment key={page}>
                {idx > 0 && arr[idx - 1] !== page - 1 && (
                  <span className="px-2 text-dark-400">...</span>
                )}
                <button
                  onClick={() => handlePageChange(page)}
                  className={`w-10 h-10 rounded-xl font-medium transition-colors ${
                    filters.page === page
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/80 dark:bg-dark-800/80 border border-white/20 dark:border-dark-700/50 text-dark-600 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700'
                  }`}
                >
                  {page}
                </button>
              </React.Fragment>
            ))}

          <button
            onClick={() => handlePageChange(filters.page! + 1)}
            disabled={filters.page === totalPages}
            className="p-2 rounded-xl bg-white/80 dark:bg-dark-800/80 border border-white/20 dark:border-dark-700/50 text-dark-600 dark:text-dark-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {formToDelete && (
          <DeleteModal
            form={formToDelete}
            onClose={() => setFormToDelete(null)}
            onConfirm={handleDelete}
            isDeleting={deleteFormMutation.isPending}
          />
        )}
        {formToDuplicate && (
          <DuplicateModal
            form={formToDuplicate}
            onClose={() => setFormToDuplicate(null)}
            onConfirm={handleDuplicate}
            isDuplicating={duplicateFormMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FormsListPage;
