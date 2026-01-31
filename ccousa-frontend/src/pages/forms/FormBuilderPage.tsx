import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Save,
  Eye,
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Settings,
  Type,
  Hash,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckSquare,
  Circle,
  List,
  FileText,
  Upload,
  Image,
  MapPin,
  ToggleLeft,
  AlignLeft,
  Layers,
  X,
  Edit2,
  Check,
} from 'lucide-react';
import {
  useForm,
  useCreateForm,
  useUpdateForm,
  useFieldTypes,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
  useReorderSections,
  useCreateField,
  useUpdateField,
  useDeleteField,
  useReorderFields,
  usePublishForm,
} from '../../hooks';
import type { Form, FormSection, FormField, FieldType } from '../../types';
import type { CreateSectionData, CreateFieldData } from '../../services/forms.service';

// ===========================================
// Field Type Icons
// ===========================================

const fieldTypeIcons: Record<string, React.ReactNode> = {
  text: <Type className="w-4 h-4" />,
  textarea: <AlignLeft className="w-4 h-4" />,
  number: <Hash className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  date: <Calendar className="w-4 h-4" />,
  datetime: <Calendar className="w-4 h-4" />,
  time: <Clock className="w-4 h-4" />,
  select: <List className="w-4 h-4" />,
  multiselect: <List className="w-4 h-4" />,
  checkbox: <CheckSquare className="w-4 h-4" />,
  radio: <Circle className="w-4 h-4" />,
  file: <Upload className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />,
  toggle: <ToggleLeft className="w-4 h-4" />,
  gps: <MapPin className="w-4 h-4" />,
};

// ===========================================
// Field Type Palette
// ===========================================

interface FieldTypePaletteProps {
  fieldTypes: FieldType[];
  onAddField: (fieldType: FieldType, sectionId: string) => void;
  activeSectionId: string | null;
}

const FieldTypePalette: React.FC<FieldTypePaletteProps> = ({
  fieldTypes,
  onAddField,
  activeSectionId,
}) => {
  const categories = useMemo(() => {
    const cats: Record<string, FieldType[]> = {};
    fieldTypes.forEach(ft => {
      const cat = (ft as { category?: string }).category || 'OTHER';
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(ft);
    });
    return cats;
  }, [fieldTypes]);

  const categoryLabels: Record<string, string> = {
    TEXT: 'Texte',
    DATE: 'Date & Heure',
    SELECTION: 'Sélection',
    FILE: 'Fichiers',
    LOCATION: 'Localisation',
    OTHER: 'Autres',
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      <h3 className="text-sm font-semibold text-dark-900 dark:text-white uppercase tracking-wider">
        Types de champs
      </h3>

      {Object.entries(categories).map(([category, types]) => (
        <div key={category}>
          <h4 className="text-xs font-medium text-dark-500 dark:text-dark-400 mb-2">
            {categoryLabels[category] || category}
          </h4>
          <div className="space-y-1">
            {types.map((ft) => (
              <button
                key={ft.id}
                disabled={!activeSectionId}
                onClick={() => activeSectionId && onAddField(ft, activeSectionId)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-dark-700 dark:text-dark-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="w-8 h-8 rounded-lg bg-dark-100 dark:bg-dark-700 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
                  {fieldTypeIcons[ft.code] || <FileText className="w-4 h-4" />}
                </div>
                <span>{ft.name}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {!activeSectionId && (
        <p className="text-xs text-dark-400 text-center py-4 border border-dashed border-dark-300 dark:border-dark-600 rounded-xl">
          Sélectionnez une section pour ajouter des champs
        </p>
      )}
    </div>
  );
};

// ===========================================
// Field Card Component
// ===========================================

interface FieldCardProps {
  field: FormField;
  fieldTypes: FieldType[];
  onUpdate: (data: Partial<CreateFieldData>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const FieldCard: React.FC<FieldCardProps> = ({
  field,
  fieldTypes,
  onUpdate,
  onDelete,
  onDuplicate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(field.label);

  const fieldType = fieldTypes.find(ft => ft.id === field.fieldTypeId);

  const handleSaveLabel = () => {
    onUpdate({ label: editLabel });
    setIsEditing(false);
  };

  return (
    <Reorder.Item
      value={field}
      className="group"
    >
      <div className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
        <div className="cursor-grab active:cursor-grabbing pt-1">
          <GripVertical className="w-4 h-4 text-dark-300 group-hover:text-dark-500" />
        </div>

        <div className="w-10 h-10 rounded-lg bg-dark-100 dark:bg-dark-700 flex items-center justify-center flex-shrink-0">
          {fieldTypeIcons[fieldType?.code || 'text'] || <FileText className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-900 text-dark-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveLabel();
                  if (e.key === 'Escape') {
                    setEditLabel(field.label);
                    setIsEditing(false);
                  }
                }}
              />
              <button
                onClick={handleSaveLabel}
                className="p-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setEditLabel(field.label);
                  setIsEditing(false);
                }}
                className="p-1.5 rounded-lg bg-dark-100 dark:bg-dark-700 text-dark-500 hover:bg-dark-200 dark:hover:bg-dark-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-medium text-dark-900 dark:text-white">
                {field.label}
              </span>
              {field.isRequired && (
                <span className="text-red-500 text-sm">*</span>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-dark-100 dark:hover:bg-dark-700 transition-all"
              >
                <Edit2 className="w-3.5 h-3.5 text-dark-400" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-dark-400 font-mono">{field.code}</span>
            <span className="text-xs text-dark-400">
              {fieldType?.name || 'Texte'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onUpdate({ isRequired: !field.isRequired })}
            className={`p-1.5 rounded-lg transition-colors ${
              field.isRequired
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : 'bg-dark-100 dark:bg-dark-700 text-dark-400 hover:text-dark-600 dark:hover:text-dark-200'
            }`}
            title={field.isRequired ? 'Rendre optionnel' : 'Rendre obligatoire'}
          >
            <span className="text-xs font-bold">*</span>
          </button>
          <button
            onClick={onDuplicate}
            className="p-1.5 rounded-lg bg-dark-100 dark:bg-dark-700 text-dark-400 hover:text-dark-600 dark:hover:text-dark-200 transition-colors"
            title="Dupliquer"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg bg-dark-100 dark:bg-dark-700 text-dark-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Reorder.Item>
  );
};

// ===========================================
// Section Component
// ===========================================

interface SectionCardProps {
  section: FormSection;
  fieldTypes: FieldType[];
  isActive: boolean;
  onActivate: () => void;
  onUpdate: (data: Partial<CreateSectionData>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddField: (fieldType: FieldType) => void;
  onUpdateField: (fieldId: string, data: Partial<CreateFieldData>) => void;
  onDeleteField: (fieldId: string) => void;
  onDuplicateField: (fieldId: string) => void;
  onReorderFields: (fieldIds: string[]) => void;
}

const SectionCard: React.FC<SectionCardProps> = ({
  section,
  fieldTypes,
  isActive,
  onActivate,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddField,
  onUpdateField,
  onDeleteField,
  onDuplicateField,
  onReorderFields,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);

  const handleSaveTitle = () => {
    onUpdate({ title: editTitle });
    setIsEditingTitle(false);
  };

  const fields = section.fields || [];

  return (
    <Reorder.Item
      value={section}
      className="group"
    >
      <div
        className={`rounded-2xl border-2 transition-all ${
          isActive
            ? 'border-primary-400 dark:border-primary-500 shadow-lg shadow-primary-500/10'
            : 'border-dark-200 dark:border-dark-700 hover:border-dark-300 dark:hover:border-dark-600'
        }`}
      >
        {/* Section Header */}
        <div
          className={`flex items-center gap-3 p-4 cursor-pointer ${
            isActive ? 'bg-primary-50/50 dark:bg-primary-900/10' : 'bg-white dark:bg-dark-800'
          } rounded-t-2xl ${!isExpanded ? 'rounded-b-2xl' : ''}`}
          onClick={onActivate}
        >
          <div className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-5 h-5 text-dark-300 group-hover:text-dark-500" />
          </div>

          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>

          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-900 text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') {
                      setEditTitle(section.title);
                      setIsEditingTitle(false);
                    }
                  }}
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-dark-900 dark:text-white">
                  {section.title}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingTitle(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-dark-100 dark:hover:bg-dark-700 transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5 text-dark-400" />
                </button>
              </div>
            )}
            <p className="text-sm text-dark-500 dark:text-dark-400">
              {fields.length} champ{fields.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-400 transition-colors opacity-0 group-hover:opacity-100"
              title="Dupliquer"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-dark-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-400 transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Section Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0 bg-dark-50 dark:bg-dark-900/50 rounded-b-2xl">
                {fields.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-dark-200 dark:border-dark-700 rounded-xl">
                    <p className="text-dark-400 text-sm">
                      Glissez un type de champ ici ou cliquez sur un type dans la palette
                    </p>
                  </div>
                ) : (
                  <Reorder.Group
                    axis="y"
                    values={fields}
                    onReorder={(newFields) => onReorderFields(newFields.map(f => f.id))}
                    className="space-y-2"
                  >
                    {fields.map((field) => (
                      <FieldCard
                        key={field.id}
                        field={field}
                        fieldTypes={fieldTypes}
                        onUpdate={(data) => onUpdateField(field.id, data)}
                        onDelete={() => onDeleteField(field.id)}
                        onDuplicate={() => onDuplicateField(field.id)}
                      />
                    ))}
                  </Reorder.Group>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reorder.Item>
  );
};

// ===========================================
// Form Builder Page
// ===========================================

interface FormBuilderPageProps {
  formId?: string;
  onBack: () => void;
  onSuccess: (form: Form) => void;
}

export const FormBuilderPage: React.FC<FormBuilderPageProps> = ({
  formId,
  onBack,
  onSuccess,
}) => {
  const isEditMode = !!formId;

  // State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'PARAMETER',
    layoutColumns: 2 as 1 | 2 | 3,
  });
  const [sections, setSections] = useState<FormSection[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Queries
  const { data: existingForm, isLoading: isLoadingForm } = useForm(formId || '');
  const { data: fieldTypes = [] } = useFieldTypes();

  // Mutations
  const createFormMutation = useCreateForm();
  const updateFormMutation = useUpdateForm();
  const publishFormMutation = usePublishForm();

  // Load existing form data
  React.useEffect(() => {
    if (existingForm && isEditMode) {
      setFormData({
        code: existingForm.code,
        name: existingForm.name,
        description: existingForm.description || '',
        type: (existingForm as { type?: string }).type || 'PARAMETER',
        layoutColumns: 2,
      });
      setSections(existingForm.sections || []);
      if (existingForm.sections?.length) {
        setActiveSectionId(existingForm.sections[0].id);
      }
    }
  }, [existingForm, isEditMode]);

  // Handlers
  const handleAddSection = () => {
    const newSection: FormSection = {
      id: `temp-${Date.now()}`,
      formId: formId || '',
      title: `Section ${sections.length + 1}`,
      sortOrder: sections.length + 1,
      columns: 1,
      isCollapsible: false,
      fields: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSections([...sections, newSection]);
    setActiveSectionId(newSection.id);
  };

  const handleUpdateSection = (sectionId: string, data: Partial<CreateSectionData>) => {
    setSections(sections.map(s =>
      s.id === sectionId ? { ...s, ...data } : s
    ));
  };

  const handleDeleteSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId));
    if (activeSectionId === sectionId) {
      setActiveSectionId(sections.length > 1 ? sections[0].id : null);
    }
  };

  const handleDuplicateSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      const newSection: FormSection = {
        ...section,
        id: `temp-${Date.now()}`,
        title: `${section.title} (copie)`,
        sortOrder: sections.length + 1,
        fields: section.fields?.map(f => ({
          ...f,
          id: `temp-${Date.now()}-${f.id}`,
        })),
      };
      setSections([...sections, newSection]);
    }
  };

  const handleReorderSections = (newSections: FormSection[]) => {
    setSections(newSections.map((s, i) => ({ ...s, sortOrder: i + 1 })));
  };

  const handleAddField = (fieldType: FieldType, sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const existingFields = section.fields || [];
    const newField: FormField = {
      id: `temp-field-${Date.now()}`,
      sectionId,
      fieldTypeId: fieldType.id,
      fieldType,
      code: `field_${existingFields.length + 1}`,
      label: `Nouveau ${fieldType.name.toLowerCase()}`,
      isRequired: false,
      isReadonly: false,
      isHidden: false,
      sortOrder: existingFields.length + 1,
      columnSpan: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSections(sections.map(s =>
      s.id === sectionId
        ? { ...s, fields: [...(s.fields || []), newField] }
        : s
    ));
  };

  const handleUpdateField = (sectionId: string, fieldId: string, data: Partial<CreateFieldData>) => {
    setSections(sections.map(s =>
      s.id === sectionId
        ? {
            ...s,
            fields: s.fields?.map(f =>
              f.id === fieldId ? { ...f, ...data } : f
            ),
          }
        : s
    ));
  };

  const handleDeleteField = (sectionId: string, fieldId: string) => {
    setSections(sections.map(s =>
      s.id === sectionId
        ? { ...s, fields: s.fields?.filter(f => f.id !== fieldId) }
        : s
    ));
  };

  const handleDuplicateField = (sectionId: string, fieldId: string) => {
    const section = sections.find(s => s.id === sectionId);
    const field = section?.fields?.find(f => f.id === fieldId);
    if (!field) return;

    const newField: FormField = {
      ...field,
      id: `temp-field-${Date.now()}`,
      code: `${field.code}_copy`,
      label: `${field.label} (copie)`,
      sortOrder: (section?.fields?.length || 0) + 1,
    };

    setSections(sections.map(s =>
      s.id === sectionId
        ? { ...s, fields: [...(s.fields || []), newField] }
        : s
    ));
  };

  const handleReorderFields = (sectionId: string, fieldIds: string[]) => {
    setSections(sections.map(s =>
      s.id === sectionId
        ? {
            ...s,
            fields: fieldIds.map((id, i) => {
              const field = s.fields?.find(f => f.id === id);
              return field ? { ...field, sortOrder: i + 1 } : null;
            }).filter(Boolean) as FormField[],
          }
        : s
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // For now, just log the data
      // In a real implementation, this would save to the backend
      console.log('Saving form:', { formData, sections });

      // Simulate save success
      setTimeout(() => {
        setIsSaving(false);
        // onSuccess(savedForm);
      }, 1000);
    } catch (error) {
      setIsSaving(false);
    }
  };

  if (isLoadingForm) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-dark-50 to-dark-100 dark:from-dark-950 dark:to-dark-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border-b border-dark-200 dark:border-dark-700">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-dark-600 dark:text-dark-300" />
            </button>
            <div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nom du formulaire"
                className="text-xl font-bold text-dark-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-0 placeholder-dark-300"
              />
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="CODE_FORMULAIRE"
                className="text-sm text-dark-500 dark:text-dark-400 font-mono bg-transparent border-none focus:outline-none focus:ring-0 placeholder-dark-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Aperçu
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-300 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Field Types Palette */}
        <div className="w-64 flex-shrink-0 border-r border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 overflow-hidden">
          <FieldTypePalette
            fieldTypes={fieldTypes}
            onAddField={(ft, sectionId) => handleAddField(ft, sectionId)}
            activeSectionId={activeSectionId}
          />
        </div>

        {/* Center - Form Builder Canvas */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Form Description */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50">
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du formulaire (optionnel)"
                rows={2}
                className="w-full bg-transparent border-none resize-none text-dark-600 dark:text-dark-300 placeholder-dark-400 focus:outline-none focus:ring-0"
              />
            </div>

            {/* Sections */}
            {sections.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-dark-300 dark:border-dark-600 rounded-2xl">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-100 dark:bg-dark-800 flex items-center justify-center">
                  <Layers className="w-8 h-8 text-dark-400" />
                </div>
                <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">
                  Aucune section
                </h3>
                <p className="text-dark-500 dark:text-dark-400 mb-6">
                  Ajoutez une section pour commencer à construire votre formulaire
                </p>
                <button
                  onClick={handleAddSection}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter une section
                </button>
              </div>
            ) : (
              <Reorder.Group
                axis="y"
                values={sections}
                onReorder={handleReorderSections}
                className="space-y-4"
              >
                {sections.map((section) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    fieldTypes={fieldTypes}
                    isActive={activeSectionId === section.id}
                    onActivate={() => setActiveSectionId(section.id)}
                    onUpdate={(data) => handleUpdateSection(section.id, data)}
                    onDelete={() => handleDeleteSection(section.id)}
                    onDuplicate={() => handleDuplicateSection(section.id)}
                    onAddField={(ft) => handleAddField(ft, section.id)}
                    onUpdateField={(fieldId, data) => handleUpdateField(section.id, fieldId, data)}
                    onDeleteField={(fieldId) => handleDeleteField(section.id, fieldId)}
                    onDuplicateField={(fieldId) => handleDuplicateField(section.id, fieldId)}
                    onReorderFields={(fieldIds) => handleReorderFields(section.id, fieldIds)}
                  />
                ))}
              </Reorder.Group>
            )}

            {/* Add Section Button */}
            {sections.length > 0 && (
              <button
                onClick={handleAddSection}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-dark-300 dark:border-dark-600 text-dark-500 hover:text-primary-600 hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Ajouter une section
              </button>
            )}
          </div>
        </div>

        {/* Right Sidebar - Settings Panel */}
        <div className="w-80 flex-shrink-0 border-l border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 overflow-y-auto p-4">
          <h3 className="text-sm font-semibold text-dark-900 dark:text-white uppercase tracking-wider mb-4">
            Paramètres du formulaire
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="PARAMETER">Paramètre</option>
                <option value="PROCEDURE">Procédure</option>
                <option value="EVENT">Événement</option>
                <option value="REPORT">Rapport</option>
                <option value="SURVEY">Enquête</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-200 mb-1">
                Colonnes
              </label>
              <div className="flex gap-2">
                {[1, 2, 3].map((cols) => (
                  <button
                    key={cols}
                    onClick={() => setFormData({ ...formData, layoutColumns: cols as 1 | 2 | 3 })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      formData.layoutColumns === cols
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-2 border-primary-400'
                        : 'bg-dark-50 dark:bg-dark-700 text-dark-600 dark:text-dark-300 border-2 border-transparent hover:border-dark-300'
                    }`}
                  >
                    {cols} col
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilderPage;
