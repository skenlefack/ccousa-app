import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  FileCheck,
  FileWarning,
  GripVertical,
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
  Select,
  Table,
  Column,
  TableActions,
  Skeleton,
  NoDataEmpty,
} from '../../components/ui';
import { cn } from '../../utils/cn';
import {
  useDocumentTypes,
  useCreateDocumentType,
  useUpdateDocumentType,
  useDeleteDocumentType,
} from '../../hooks/useSettings';
import type { DocumentType } from '../../types';
import { formatFileSize } from '../../utils/format';

// Document type icons based on extensions
const getDocumentIcon = (extensions?: string[]) => {
  if (!extensions || extensions.length === 0) return <File className="w-5 h-5" />;

  const ext = extensions[0].toLowerCase();
  if (['pdf'].includes(ext)) {
    return <FileText className="w-5 h-5 text-red-500" />;
  }
  if (['doc', 'docx'].includes(ext)) {
    return <FileText className="w-5 h-5 text-blue-500" />;
  }
  if (['xls', 'xlsx'].includes(ext)) {
    return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
    return <FileImage className="w-5 h-5 text-purple-500" />;
  }
  return <File className="w-5 h-5 text-dark-500" />;
};

interface DocumentTypeFormData {
  code: string;
  name: string;
  description: string;
  allowedExtensions: string;
  maxSizeBytes: string;
  isRequired: boolean;
  isActive: boolean;
}

const defaultFormData: DocumentTypeFormData = {
  code: '',
  name: '',
  description: '',
  allowedExtensions: 'pdf,doc,docx',
  maxSizeBytes: '10485760', // 10MB
  isRequired: false,
  isActive: true,
};

const fileSizeOptions = [
  { value: '1048576', label: '1 MB' },
  { value: '5242880', label: '5 MB' },
  { value: '10485760', label: '10 MB' },
  { value: '26214400', label: '25 MB' },
  { value: '52428800', label: '50 MB' },
  { value: '104857600', label: '100 MB' },
];

export const DocumentTypesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [formData, setFormData] = useState<DocumentTypeFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Queries and mutations
  const { data: documentTypes, isLoading } = useDocumentTypes(showInactive);
  const createType = useCreateDocumentType();
  const updateType = useUpdateDocumentType();
  const deleteType = useDeleteDocumentType();

  // Filter document types
  const filteredTypes = documentTypes?.filter((type) => {
    if (!showInactive && !type.isActive) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        type.name.toLowerCase().includes(search) ||
        type.code.toLowerCase().includes(search) ||
        type.description?.toLowerCase().includes(search)
      );
    }
    return true;
  }) || [];

  // Handle form changes
  const handleChange = (field: keyof DocumentTypeFormData, value: string | boolean) => {
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
    setSelectedType(null);
    setFormData(defaultFormData);
    setFormErrors({});
    setModalOpen(true);
  };

  // Open modal for edit
  const handleEdit = (type: DocumentType) => {
    setSelectedType(type);
    setFormData({
      code: type.code,
      name: type.name,
      description: type.description || '',
      allowedExtensions: type.allowedExtensions?.join(',') || '',
      maxSizeBytes: String(type.maxSizeBytes || 10485760),
      isRequired: type.isRequired,
      isActive: type.isActive,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  // Open delete confirmation
  const handleDeleteClick = (type: DocumentType) => {
    setSelectedType(type);
    setDeleteModalOpen(true);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.code.trim()) {
      errors.code = 'Le code est requis';
    } else if (!/^[A-Z][A-Z0-9_]{2,29}$/.test(formData.code)) {
      errors.code = 'Code invalide (majuscules, 3-30 caractères)';
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

    const data = {
      code: formData.code,
      name: formData.name,
      description: formData.description || undefined,
      allowedExtensions: formData.allowedExtensions
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
      maxSizeBytes: parseInt(formData.maxSizeBytes, 10),
      isRequired: formData.isRequired,
      isActive: formData.isActive,
      sortOrder: selectedType?.sortOrder || (documentTypes?.length || 0) + 1,
    };

    try {
      if (selectedType) {
        await updateType.mutateAsync({
          id: selectedType.id,
          data,
        });
      } else {
        await createType.mutateAsync(data as DocumentType);
      }
      setModalOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Delete document type
  const handleDelete = async () => {
    if (!selectedType) return;

    try {
      await deleteType.mutateAsync(selectedType.id);
      setDeleteModalOpen(false);
      setSelectedType(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const isSubmitting = createType.isPending || updateType.isPending;

  // Table columns
  const columns: Column<DocumentType>[] = [
    {
      key: 'name',
      header: 'Type de document',
      render: (_, type) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-dark-100 dark:bg-dark-700">
            {getDocumentIcon(type.allowedExtensions)}
          </div>
          <div>
            <p className="font-medium text-dark-900 dark:text-white">
              {type.name}
            </p>
            <p className="text-xs text-dark-500 font-mono">{type.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'allowedExtensions',
      header: 'Extensions',
      render: (_, type) => (
        <div className="flex flex-wrap gap-1">
          {type.allowedExtensions?.slice(0, 4).map((ext) => (
            <Badge key={ext} variant="outline" size="xs">
              .{ext}
            </Badge>
          ))}
          {type.allowedExtensions && type.allowedExtensions.length > 4 && (
            <Badge variant="default" size="xs">
              +{type.allowedExtensions.length - 4}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'maxSizeBytes',
      header: 'Taille max',
      render: (value) => (
        <span className="text-dark-600 dark:text-dark-300">
          {formatFileSize(value as number)}
        </span>
      ),
    },
    {
      key: 'isRequired',
      header: 'Requis',
      align: 'center',
      render: (value) =>
        value ? (
          <FileCheck className="w-5 h-5 text-emerald-500 mx-auto" />
        ) : (
          <span className="text-dark-400">-</span>
        ),
    },
    {
      key: 'isActive',
      header: 'Statut',
      render: (value) => (
        <Badge
          variant={value ? 'success' : 'default'}
          size="sm"
          dot
        >
          {value ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      align: 'right',
      render: (_, type) => (
        <TableActions>
          <IconButton
            variant="ghost"
            size="sm"
            icon={<Pencil className="w-4 h-4" />}
            onClick={() => handleEdit(type)}
            aria-label="Modifier"
          />
          <IconButton
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-4 h-4 text-red-500" />}
            onClick={() => handleDeleteClick(type)}
            aria-label="Supprimer"
          />
        </TableActions>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dark-900 dark:text-white">
            Types de documents
          </h2>
          <p className="text-dark-500 dark:text-dark-400 mt-1">
            Configurez les types de documents acceptés dans le système
          </p>
        </div>
        <Button
          onClick={handleCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Nouveau type
        </Button>
      </div>

      {/* Filters */}
      <Card variant="glass" padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher un type de document..."
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

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : filteredTypes.length === 0 ? (
        <NoDataEmpty
          onAdd={handleCreate}
          addLabel="Créer un type de document"
        />
      ) : (
        <Table
          columns={columns}
          data={filteredTypes}
          keyExtractor={(item) => item.id}
          variant="striped"
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedType ? 'Modifier le type' : 'Nouveau type de document'}
        size="lg"
      >
        <ModalBody>
          <div className="space-y-6">
            {/* Preview */}
            <div className="p-4 rounded-xl bg-dark-50 dark:bg-dark-700/50 border border-dark-100 dark:border-dark-600">
              <p className="text-xs text-dark-500 mb-2">Aperçu</p>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white dark:bg-dark-600">
                  {getDocumentIcon(formData.allowedExtensions.split(',').filter(Boolean))}
                </div>
                <div>
                  <h4 className="font-semibold text-dark-900 dark:text-white">
                    {formData.name || 'Nom du type'}
                  </h4>
                  <p className="text-xs text-dark-500">
                    {formData.allowedExtensions || 'Extensions...'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Code"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                placeholder="REPORT_FORM"
                error={formErrors.code}
                helperText="Identifiant unique"
              />
              <Input
                label="Nom"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Rapport d'investigation"
                error={formErrors.name}
              />
            </div>

            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description du type de document..."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Extensions autorisées"
                value={formData.allowedExtensions}
                onChange={(e) => handleChange('allowedExtensions', e.target.value)}
                placeholder="pdf,doc,docx"
                helperText="Séparées par des virgules"
              />
              <Select
                label="Taille maximale"
                value={formData.maxSizeBytes}
                onChange={(value) => handleChange('maxSizeBytes', value)}
                options={fileSizeOptions}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-dark-50 dark:bg-dark-700/50">
                <div>
                  <p className="font-medium text-dark-900 dark:text-white">
                    Document requis
                  </p>
                  <p className="text-sm text-dark-500">
                    Obligatoire pour certaines procédures
                  </p>
                </div>
                <Toggle
                  checked={formData.isRequired}
                  onChange={(checked) => handleChange('isRequired', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-dark-50 dark:bg-dark-700/50">
                <div>
                  <p className="font-medium text-dark-900 dark:text-white">
                    Type actif
                  </p>
                  <p className="text-sm text-dark-500">
                    Visible dans les sélections
                  </p>
                </div>
                <Toggle
                  checked={formData.isActive}
                  onChange={(checked) => handleChange('isActive', checked)}
                />
              </div>
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
            {selectedType ? 'Enregistrer' : 'Créer'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer le type de document"
        message={`Êtes-vous sûr de vouloir supprimer le type "${selectedType?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
        isLoading={deleteType.isPending}
      />
    </div>
  );
};

export default DocumentTypesPage;
