import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronRight,
  ChevronDown,
  Building2,
  MapPin,
  Globe,
  Map,
  Building,
  Home,
  FolderTree,
  List,
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
  Select,
  Skeleton,
  NoDataEmpty,
  TabList,
} from '../../components/ui';
import { cn } from '../../utils/cn';
import {
  useOrganizationalUnits,
  useCreateOrganizationalUnit,
  useUpdateOrganizationalUnit,
  useDeleteOrganizationalUnit,
} from '../../hooks/useSettings';
import type { OrganizationalUnit } from '../../types';

// Unit type icons and colors
const unitTypeConfig: Record<string, { icon: React.FC<{ className?: string }>; color: string; label: string }> = {
  NATIONAL: { icon: Globe, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30', label: 'National' },
  REGIONAL: { icon: Map, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30', label: 'Régional' },
  DEPARTMENTAL: { icon: Building2, color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30', label: 'Départemental' },
  ARRONDISSEMENT: { icon: Building, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30', label: 'Arrondissement' },
  DISTRICT: { icon: Home, color: 'text-red-500 bg-red-100 dark:bg-red-900/30', label: 'District' },
};

interface FormData {
  code: string;
  name: string;
  type: OrganizationalUnit['type'];
  parentId: string;
  latitude: string;
  longitude: string;
  isActive: boolean;
}

const defaultFormData: FormData = {
  code: '',
  name: '',
  type: 'REGIONAL',
  parentId: '',
  latitude: '',
  longitude: '',
  isActive: true,
};

// Tree Node component
interface TreeNodeProps {
  unit: OrganizationalUnit & { children?: OrganizationalUnit[] };
  level: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (unit: OrganizationalUnit) => void;
  onDelete: (unit: OrganizationalUnit) => void;
  onAddChild: (parent: OrganizationalUnit) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  unit,
  level,
  expandedIds,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
}) => {
  const isExpanded = expandedIds.has(unit.id);
  const hasChildren = unit.children && unit.children.length > 0;
  const config = unitTypeConfig[unit.type] || unitTypeConfig.REGIONAL;
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="select-none"
    >
      <div
        className={cn(
          'group flex items-center gap-2 py-2 px-3 rounded-xl transition-all duration-200',
          'hover:bg-primary-50 dark:hover:bg-primary-900/10',
          !unit.isActive && 'opacity-50'
        )}
        style={{ paddingLeft: `${level * 24 + 12}px` }}
      >
        {/* Expand/collapse button */}
        <button
          onClick={() => hasChildren && onToggle(unit.id)}
          className={cn(
            'w-6 h-6 flex items-center justify-center rounded-md transition-colors',
            hasChildren
              ? 'hover:bg-dark-100 dark:hover:bg-dark-700 cursor-pointer'
              : 'cursor-default'
          )}
        >
          {hasChildren && (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4 text-dark-400" />
            </motion.div>
          )}
        </button>

        {/* Icon */}
        <div className={cn('p-1.5 rounded-lg', config.color)}>
          <IconComponent className="w-4 h-4" />
        </div>

        {/* Name and code */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-dark-900 dark:text-white truncate">
              {unit.name}
            </span>
            <Badge variant="outline" size="xs" className="font-mono">
              {unit.code}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-dark-500">
            <span>{config.label}</span>
            {unit.latitude && unit.longitude && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {unit.latitude.toFixed(4)}, {unit.longitude.toFixed(4)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Status */}
        <Badge
          variant={unit.isActive ? 'success' : 'default'}
          size="xs"
          dot
        >
          {unit.isActive ? 'Actif' : 'Inactif'}
        </Badge>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconButton
            variant="ghost"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => onAddChild(unit)}
            aria-label="Ajouter sous-unité"
          />
          <IconButton
            variant="ghost"
            size="sm"
            icon={<Pencil className="w-3.5 h-3.5" />}
            onClick={() => onEdit(unit)}
            aria-label="Modifier"
          />
          <IconButton
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
            onClick={() => onDelete(unit)}
            aria-label="Supprimer"
          />
        </div>
      </div>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {unit.children!.map((child) => (
              <TreeNode
                key={child.id}
                unit={child as OrganizationalUnit & { children?: OrganizationalUnit[] }}
                level={level + 1}
                expandedIds={expandedIds}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const OrganizationalUnitsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<OrganizationalUnit | null>(null);
  const [parentUnit, setParentUnit] = useState<OrganizationalUnit | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Queries and mutations
  const { data: units, isLoading } = useOrganizationalUnits(viewMode === 'tree');
  const { data: flatUnits } = useOrganizationalUnits(false);
  const createUnit = useCreateOrganizationalUnit();
  const updateUnit = useUpdateOrganizationalUnit();
  const deleteUnit = useDeleteOrganizationalUnit();

  // Build tree structure for display
  const treeData = useMemo(() => {
    if (!units) return [];
    if (viewMode === 'tree') return units;

    // Build tree from flat list
    const map = new Map<string, OrganizationalUnit & { children?: OrganizationalUnit[] }>();
    const roots: (OrganizationalUnit & { children?: OrganizationalUnit[] })[] = [];

    units.forEach((unit) => {
      map.set(unit.id, { ...unit, children: [] });
    });

    units.forEach((unit) => {
      const node = map.get(unit.id)!;
      if (unit.parentId && map.has(unit.parentId)) {
        map.get(unit.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [units, viewMode]);

  // Filter units based on search
  const filteredUnits = useMemo(() => {
    if (!searchTerm) return treeData;

    const search = searchTerm.toLowerCase();
    const matchingIds = new Set<string>();

    // Find all matching units and their ancestors
    const findMatches = (unit: OrganizationalUnit & { children?: OrganizationalUnit[] }, ancestorIds: string[]) => {
      const matches = unit.name.toLowerCase().includes(search) || unit.code.toLowerCase().includes(search);

      if (matches) {
        matchingIds.add(unit.id);
        ancestorIds.forEach((id) => matchingIds.add(id));
      }

      unit.children?.forEach((child) => {
        findMatches(child as OrganizationalUnit & { children?: OrganizationalUnit[] }, [...ancestorIds, unit.id]);
      });
    };

    treeData.forEach((unit) => findMatches(unit, []));

    // Expand matching branches
    if (matchingIds.size > 0) {
      setExpandedIds((prev) => new Set([...prev, ...matchingIds]));
    }

    return treeData;
  }, [treeData, searchTerm]);

  // Toggle expand/collapse
  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Expand all
  const handleExpandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (unit: OrganizationalUnit & { children?: OrganizationalUnit[] }) => {
      allIds.add(unit.id);
      unit.children?.forEach(collectIds);
    };
    treeData.forEach(collectIds);
    setExpandedIds(allIds);
  };

  // Collapse all
  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  // Handle form changes
  const handleChange = (field: keyof FormData, value: string | boolean) => {
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
    setSelectedUnit(null);
    setParentUnit(null);
    setFormData(defaultFormData);
    setFormErrors({});
    setModalOpen(true);
  };

  // Open modal for create child
  const handleAddChild = (parent: OrganizationalUnit) => {
    setSelectedUnit(null);
    setParentUnit(parent);

    // Determine child type
    const typeHierarchy = ['NATIONAL', 'REGIONAL', 'DEPARTMENTAL', 'ARRONDISSEMENT', 'DISTRICT'];
    const parentIndex = typeHierarchy.indexOf(parent.type);
    const childType = typeHierarchy[Math.min(parentIndex + 1, typeHierarchy.length - 1)] as OrganizationalUnit['type'];

    setFormData({
      ...defaultFormData,
      parentId: parent.id,
      type: childType,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  // Open modal for edit
  const handleEdit = (unit: OrganizationalUnit) => {
    setSelectedUnit(unit);
    setParentUnit(null);
    setFormData({
      code: unit.code,
      name: unit.name,
      type: unit.type,
      parentId: unit.parentId || '',
      latitude: unit.latitude?.toString() || '',
      longitude: unit.longitude?.toString() || '',
      isActive: unit.isActive,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  // Open delete confirmation
  const handleDeleteClick = (unit: OrganizationalUnit) => {
    setSelectedUnit(unit);
    setDeleteModalOpen(true);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.code.trim()) {
      errors.code = 'Le code est requis';
    }

    if (!formData.name.trim()) {
      errors.name = 'Le nom est requis';
    }

    if (formData.latitude && isNaN(parseFloat(formData.latitude))) {
      errors.latitude = 'Latitude invalide';
    }

    if (formData.longitude && isNaN(parseFloat(formData.longitude))) {
      errors.longitude = 'Longitude invalide';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;

    const data = {
      code: formData.code,
      name: formData.name,
      type: formData.type,
      parentId: formData.parentId || undefined,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      isActive: formData.isActive,
    };

    try {
      if (selectedUnit) {
        await updateUnit.mutateAsync({
          id: selectedUnit.id,
          data,
        });
      } else {
        await createUnit.mutateAsync(data as OrganizationalUnit);
      }
      setModalOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Delete unit
  const handleDelete = async () => {
    if (!selectedUnit) return;

    try {
      await deleteUnit.mutateAsync(selectedUnit.id);
      setDeleteModalOpen(false);
      setSelectedUnit(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const isSubmitting = createUnit.isPending || updateUnit.isPending;

  // Parent options for select
  const parentOptions = [
    { value: '', label: 'Aucun (niveau racine)' },
    ...(flatUnits
      ?.filter((u) => u.id !== selectedUnit?.id)
      .map((u) => ({
        value: u.id,
        label: `${u.name} (${unitTypeConfig[u.type]?.label || u.type})`,
      })) || []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dark-900 dark:text-white">
            Unités organisationnelles
          </h2>
          <p className="text-dark-500 dark:text-dark-400 mt-1">
            Gérez la structure hiérarchique des unités administratives
          </p>
        </div>
        <Button
          onClick={handleCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Nouvelle unité
        </Button>
      </div>

      {/* Filters and controls */}
      <Card variant="glass" padding="md">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher une unité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              clearable
              onClear={() => setSearchTerm('')}
            />
          </div>

          <div className="flex items-center gap-4">
            <TabList
              tabs={[
                { key: 'tree', label: 'Arborescence', icon: <FolderTree className="w-4 h-4" /> },
                { key: 'list', label: 'Liste', icon: <List className="w-4 h-4" /> },
              ]}
              activeTab={viewMode}
              onTabChange={(key) => setViewMode(key as 'tree' | 'list')}
              variant="bordered"
              size="sm"
            />

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExpandAll}
              >
                Tout déplier
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCollapseAll}
              >
                Tout replier
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tree view */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : filteredUnits.length === 0 ? (
        <NoDataEmpty
          onAdd={handleCreate}
          addLabel="Créer une unité"
        />
      ) : (
        <Card variant="bordered" padding="sm">
          <div className="divide-y divide-dark-100 dark:divide-dark-700">
            {filteredUnits.map((unit) => (
              <TreeNode
                key={unit.id}
                unit={unit as OrganizationalUnit & { children?: OrganizationalUnit[] }}
                level={0}
                expandedIds={expandedIds}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onAddChild={handleAddChild}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          selectedUnit
            ? 'Modifier l\'unité'
            : parentUnit
            ? `Nouvelle sous-unité de ${parentUnit.name}`
            : 'Nouvelle unité organisationnelle'
        }
        size="lg"
      >
        <ModalBody>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Code"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                placeholder="CMR-CE-MF"
                error={formErrors.code}
                helperText="Identifiant unique"
              />
              <Input
                label="Nom"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Mfoundi"
                error={formErrors.name}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Type d'unité"
                value={formData.type}
                onChange={(value) => handleChange('type', value)}
                options={Object.entries(unitTypeConfig).map(([key, config]) => ({
                  value: key,
                  label: config.label,
                  icon: <config.icon className="w-4 h-4" />,
                }))}
              />
              <Select
                label="Unité parente"
                value={formData.parentId}
                onChange={(value) => handleChange('parentId', value)}
                options={parentOptions}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => handleChange('latitude', e.target.value)}
                placeholder="3.8480"
                error={formErrors.latitude}
                leftIcon={<MapPin className="w-4 h-4" />}
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => handleChange('longitude', e.target.value)}
                placeholder="11.5021"
                error={formErrors.longitude}
                leftIcon={<MapPin className="w-4 h-4" />}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-dark-50 dark:bg-dark-700/50">
              <div>
                <p className="font-medium text-dark-900 dark:text-white">
                  Unité active
                </p>
                <p className="text-sm text-dark-500">
                  Les unités inactives ne sont pas disponibles
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
            {selectedUnit ? 'Enregistrer' : 'Créer'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer l'unité"
        message={`Êtes-vous sûr de vouloir supprimer l'unité "${selectedUnit?.name}" ? Cette action supprimera également toutes les sous-unités.`}
        confirmText="Supprimer"
        variant="danger"
        isLoading={deleteUnit.isPending}
      />
    </div>
  );
};

export default OrganizationalUnitsPage;
