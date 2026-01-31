import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  FolderTree,
  Folder,
  FolderOpen,
  Workflow,
  Tag,
} from 'lucide-react';
import {
  Card,
  Button,
  IconButton,
  Input,
  Toggle,
  Badge,
  Modal,
  ModalBody,
  ModalFooter,
  ConfirmModal,
  ColorPicker,
  ColorSwatch,
  Select,
  Skeleton,
  NoDataEmpty,
} from '../../components/ui';
import { cn } from '../../utils/cn';
import {
  useProcedureGroups,
  useCreateProcedureGroup,
  useUpdateProcedureGroup,
  useDeleteProcedureGroup,
} from '../../hooks/useProcedures';
import type { ProcedureGroup } from '../../types';

// Available icons for groups
const availableIcons = [
  { value: 'folder', label: 'Dossier', icon: Folder },
  { value: 'folder-open', label: 'Dossier ouvert', icon: FolderOpen },
  { value: 'folder-tree', label: 'Arborescence', icon: FolderTree },
  { value: 'workflow', label: 'Workflow', icon: Workflow },
  { value: 'tag', label: 'Tag', icon: Tag },
];

const getIconComponent = (iconName?: string) => {
  const iconConfig = availableIcons.find((i) => i.value === iconName);
  if (iconConfig) {
    const IconComponent = iconConfig.icon;
    return <IconComponent className="w-5 h-5" />;
  }
  return <Folder className="w-5 h-5" />;
};

interface GroupFormData {
  code: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
}

const defaultFormData: GroupFormData = {
  code: '',
  name: '',
  description: '',
  color: '#6366f1',
  icon: 'folder',
  isActive: true,
};

export const ProcedureGroupsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ProcedureGroup | null>(null);
  const [formData, setFormData] = useState<GroupFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Queries and mutations
  const { data: groups, isLoading } = useProcedureGroups();
  const createGroup = useCreateProcedureGroup();
  const updateGroup = useUpdateProcedureGroup();
  const deleteGroup = useDeleteProcedureGroup();

  // Filter groups
  const filteredGroups = groups?.filter((group) => {
    if (!showInactive && !group.isActive) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        group.name.toLowerCase().includes(search) ||
        group.code.toLowerCase().includes(search) ||
        group.description?.toLowerCase().includes(search)
      );
    }
    return true;
  }) || [];

  // Handle form changes
  const handleChange = (field: keyof GroupFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Open modal for create
  const handleCreate = () => {
    setSelectedGroup(null);
    setFormData(defaultFormData);
    setFormErrors({});
    setModalOpen(true);
  };

  // Open modal for edit
  const handleEdit = (group: ProcedureGroup) => {
    setSelectedGroup(group);
    setFormData({
      code: group.code,
      name: group.name,
      description: group.description || '',
      color: (group as ProcedureGroup & { color?: string }).color || '#6366f1',
      icon: (group as ProcedureGroup & { icon?: string }).icon || 'folder',
      isActive: group.isActive,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  // Open delete confirmation
  const handleDeleteClick = (group: ProcedureGroup) => {
    setSelectedGroup(group);
    setDeleteModalOpen(true);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.code.trim()) {
      errors.code = 'Le code est requis';
    } else if (!/^[A-Z][A-Z0-9_]{2,19}$/.test(formData.code)) {
      errors.code = 'Code invalide (majuscules, 3-20 caractères)';
    }

    if (!formData.name.trim()) {
      errors.name = 'Le nom est requis';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (selectedGroup) {
        await updateGroup.mutateAsync({
          id: selectedGroup.id,
          data: {
            name: formData.name,
            description: formData.description || undefined,
            isActive: formData.isActive,
          },
        });
      } else {
        await createGroup.mutateAsync({
          code: formData.code,
          name: formData.name,
          description: formData.description || undefined,
          isActive: formData.isActive,
        });
      }
      setModalOpen(false);
    } catch {
      // Error handled by hook
    }
  };

  // Delete group
  const handleDelete = async () => {
    if (!selectedGroup) return;

    try {
      await deleteGroup.mutateAsync(selectedGroup.id);
      setDeleteModalOpen(false);
      setSelectedGroup(null);
    } catch {
      // Error handled by hook
    }
  };

  // Toggle group status
  const handleToggleStatus = async (group: ProcedureGroup) => {
    try {
      await updateGroup.mutateAsync({
        id: group.id,
        data: { isActive: !group.isActive },
      });
    } catch {
      // Error handled by hook
    }
  };

  const isSubmitting = createGroup.isPending || updateGroup.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dark-900 dark:text-white">
            Groupes de procédures
          </h2>
          <p className="text-dark-500 dark:text-dark-400 mt-1">
            Organisez vos procédures en groupes logiques
          </p>
        </div>
        <Button
          onClick={handleCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Nouveau groupe
        </Button>
      </div>

      {/* Filters */}
      <Card variant="glass" padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher un groupe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              clearable
              onClear={() => setSearchTerm('')}
            />
          </div>
          <div className="flex items-center gap-4">
            <Toggle
              checked={showInactive}
              onChange={setShowInactive}
              label="Afficher inactifs"
              size="sm"
            />
          </div>
        </div>
      </Card>

      {/* Groups grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <NoDataEmpty
          onAdd={handleCreate}
          addLabel="Créer un groupe"
        />
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          layout
        >
          <AnimatePresence>
            {filteredGroups.map((group, index) => {
              const groupWithExtras = group as ProcedureGroup & { color?: string; icon?: string };
              const color = groupWithExtras.color || '#6366f1';

              return (
                <motion.div
                  key={group.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    variant="glass"
                    padding="none"
                    hover
                    className={cn(
                      'group overflow-hidden',
                      !group.isActive && 'opacity-60'
                    )}
                  >
                    {/* Color bar */}
                    <div
                      className="h-2"
                      style={{ backgroundColor: color }}
                    />

                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2.5 rounded-xl"
                            style={{
                              backgroundColor: `${color}20`,
                              color: color,
                            }}
                          >
                            {getIconComponent(groupWithExtras.icon)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-dark-900 dark:text-white">
                              {group.name}
                            </h3>
                            <p className="text-xs text-dark-500 font-mono">
                              {group.code}
                            </p>
                          </div>
                        </div>

                        {/* Status badge */}
                        <Badge
                          variant={group.isActive ? 'success' : 'default'}
                          size="xs"
                          dot
                        >
                          {group.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>

                      {/* Description */}
                      {group.description && (
                        <p className="text-sm text-dark-500 dark:text-dark-400 mb-4 line-clamp-2">
                          {group.description}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-dark-100 dark:border-dark-700">
                        <ColorSwatch color={color} size="sm" showValue />

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <IconButton
                            variant="ghost"
                            size="sm"
                            icon={<Pencil className="w-4 h-4" />}
                            onClick={() => handleEdit(group)}
                            aria-label="Modifier"
                          />
                          <IconButton
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 className="w-4 h-4 text-red-500" />}
                            onClick={() => handleDeleteClick(group)}
                            aria-label="Supprimer"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedGroup ? 'Modifier le groupe' : 'Nouveau groupe'}
        description="Remplissez les informations du groupe"
        size="lg"
      >
        <ModalBody>
          <div className="space-y-6">
            {/* Preview */}
            <div className="p-4 rounded-xl bg-dark-50 dark:bg-dark-700/50 border border-dark-100 dark:border-dark-600">
              <p className="text-xs text-dark-500 mb-2">Aperçu</p>
              <div className="flex items-center gap-3">
                <div
                  className="p-2.5 rounded-xl"
                  style={{
                    backgroundColor: `${formData.color}20`,
                    color: formData.color,
                  }}
                >
                  {getIconComponent(formData.icon)}
                </div>
                <div>
                  <h4 className="font-semibold text-dark-900 dark:text-white">
                    {formData.name || 'Nom du groupe'}
                  </h4>
                  <p className="text-xs text-dark-500 font-mono">
                    {formData.code || 'CODE'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Code"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                placeholder="INVEST_GRP"
                error={formErrors.code}
                helperText="Identifiant unique (majuscules)"
                disabled={!!selectedGroup}
              />
              <Input
                label="Nom"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Investigations"
                error={formErrors.name}
              />
            </div>

            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description du groupe..."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ColorPicker
                label="Couleur"
                value={formData.color}
                onChange={(color) => handleChange('color', color)}
              />
              <Select
                label="Icône"
                value={formData.icon}
                onChange={(value) => handleChange('icon', value)}
                options={availableIcons.map((icon) => ({
                  value: icon.value,
                  label: icon.label,
                  icon: <icon.icon className="w-4 h-4" />,
                }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-dark-50 dark:bg-dark-700/50">
              <div>
                <p className="font-medium text-dark-900 dark:text-white">
                  Groupe actif
                </p>
                <p className="text-sm text-dark-500">
                  Les groupes inactifs ne sont pas disponibles
                </p>
              </div>
              <Toggle
                checked={formData.isActive}
                onChange={(checked) => handleChange('isActive', checked)}
              />
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => setModalOpen(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            {selectedGroup ? 'Enregistrer' : 'Créer'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer le groupe"
        message={`Êtes-vous sûr de vouloir supprimer le groupe "${selectedGroup?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
        isLoading={deleteGroup.isPending}
      />
    </div>
  );
};

export default ProcedureGroupsPage;
