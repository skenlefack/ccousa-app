import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Search,
  AlertTriangle,
  Bug,
  Microscope,
  Shield,
  Syringe,
  Eye,
  Activity,
  Building,
  Tag,
} from 'lucide-react';
import {
  Card,
  CardHeader,
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
  toast,
} from '../../components/ui';
import { cn } from '../../utils/cn';
import {
  useEventCategories,
  useCreateEventCategory,
  useUpdateEventCategory,
  useDeleteEventCategory,
} from '../../hooks/useSettings';
import type { EventCategory } from '../../types';

// Available icons for categories
const availableIcons = [
  { value: 'alert-triangle', label: 'Alerte', icon: AlertTriangle },
  { value: 'bug', label: 'Bug', icon: Bug },
  { value: 'microscope', label: 'Laboratoire', icon: Microscope },
  { value: 'shield', label: 'Biosécurité', icon: Shield },
  { value: 'syringe', label: 'Vaccination', icon: Syringe },
  { value: 'eye', label: 'Surveillance', icon: Eye },
  { value: 'activity', label: 'Activité', icon: Activity },
  { value: 'building', label: 'Administration', icon: Building },
  { value: 'tag', label: 'Autre', icon: Tag },
];

const getIconComponent = (iconName?: string) => {
  const iconConfig = availableIcons.find((i) => i.value === iconName);
  if (iconConfig) {
    const IconComponent = iconConfig.icon;
    return <IconComponent className="w-5 h-5" />;
  }
  return <Tag className="w-5 h-5" />;
};

interface CategoryFormData {
  code: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
}

const defaultFormData: CategoryFormData = {
  code: '',
  name: '',
  description: '',
  color: '#10b981',
  icon: 'tag',
  isActive: true,
};

export const EventCategoriesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Queries and mutations
  const { data: categories, isLoading } = useEventCategories(showInactive);
  const createCategory = useCreateEventCategory();
  const updateCategory = useUpdateEventCategory();
  const deleteCategory = useDeleteEventCategory();

  // Filter categories
  const filteredCategories = categories?.filter((cat) => {
    if (!showInactive && !cat.isActive) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        cat.name.toLowerCase().includes(search) ||
        cat.code.toLowerCase().includes(search) ||
        cat.description?.toLowerCase().includes(search)
      );
    }
    return true;
  }) || [];

  // Handle form changes
  const handleChange = (field: keyof CategoryFormData, value: string | boolean) => {
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
    setSelectedCategory(null);
    setFormData(defaultFormData);
    setFormErrors({});
    setModalOpen(true);
  };

  // Open modal for edit
  const handleEdit = (category: EventCategory) => {
    setSelectedCategory(category);
    setFormData({
      code: category.code,
      name: category.name,
      description: category.description || '',
      color: category.color,
      icon: category.icon || 'tag',
      isActive: category.isActive,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  // Open delete confirmation
  const handleDeleteClick = (category: EventCategory) => {
    setSelectedCategory(category);
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
      if (selectedCategory) {
        await updateCategory.mutateAsync({
          id: selectedCategory.id,
          data: formData,
        });
      } else {
        await createCategory.mutateAsync({
          ...formData,
          sortOrder: (categories?.length || 0) + 1,
        } as EventCategory);
      }
      setModalOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Delete category
  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      await deleteCategory.mutateAsync(selectedCategory.id);
      setDeleteModalOpen(false);
      setSelectedCategory(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Toggle category status
  const handleToggleStatus = async (category: EventCategory) => {
    try {
      await updateCategory.mutateAsync({
        id: category.id,
        data: { isActive: !category.isActive },
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const isSubmitting = createCategory.isPending || updateCategory.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dark-900 dark:text-white">
            Catégories d'événements
          </h2>
          <p className="text-dark-500 dark:text-dark-400 mt-1">
            Gérez les types d'événements sanitaires
          </p>
        </div>
        <Button
          onClick={handleCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Nouvelle catégorie
        </Button>
      </div>

      {/* Filters */}
      <Card variant="glass" padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher une catégorie..."
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

      {/* Categories grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <NoDataEmpty
          onAdd={handleCreate}
          addLabel="Créer une catégorie"
        />
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          layout
        >
          <AnimatePresence>
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category.id}
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
                    !category.isActive && 'opacity-60'
                  )}
                >
                  {/* Color bar */}
                  <div
                    className="h-2"
                    style={{ backgroundColor: category.color }}
                  />

                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2.5 rounded-xl"
                          style={{
                            backgroundColor: `${category.color}20`,
                            color: category.color,
                          }}
                        >
                          {getIconComponent(category.icon)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-dark-900 dark:text-white">
                            {category.name}
                          </h3>
                          <p className="text-xs text-dark-500 font-mono">
                            {category.code}
                          </p>
                        </div>
                      </div>

                      {/* Status badge */}
                      <Badge
                        variant={category.isActive ? 'success' : 'default'}
                        size="xs"
                        dot
                      >
                        {category.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>

                    {/* Description */}
                    {category.description && (
                      <p className="text-sm text-dark-500 dark:text-dark-400 mb-4 line-clamp-2">
                        {category.description}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-dark-100 dark:border-dark-700">
                      <ColorSwatch color={category.color} size="sm" showValue />

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <IconButton
                          variant="ghost"
                          size="sm"
                          icon={<Pencil className="w-4 h-4" />}
                          onClick={() => handleEdit(category)}
                          aria-label="Modifier"
                        />
                        <IconButton
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-4 h-4 text-red-500" />}
                          onClick={() => handleDeleteClick(category)}
                          aria-label="Supprimer"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        description="Remplissez les informations de la catégorie"
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
                    {formData.name || 'Nom de la catégorie'}
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
                placeholder="OUTBREAK"
                error={formErrors.code}
                helperText="Identifiant unique (majuscules)"
              />
              <Input
                label="Nom"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Foyer épidémique"
                error={formErrors.name}
              />
            </div>

            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description de la catégorie..."
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
                  Catégorie active
                </p>
                <p className="text-sm text-dark-500">
                  Les catégories inactives ne sont pas disponibles
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
            {selectedCategory ? 'Enregistrer' : 'Créer'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer la catégorie"
        message={`Êtes-vous sûr de vouloir supprimer la catégorie "${selectedCategory?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
        isLoading={deleteCategory.isPending}
      />
    </div>
  );
};

export default EventCategoriesPage;
