import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Save,
  Check,
  AlertCircle,
  Upload,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react';
import { useForm, useFormPreview, useCreateSubmission, useValidateFormData } from '../../hooks';
import type { Form, FormSection, FormField, FieldType } from '../../types';
import type { CreateSubmissionData, FieldValidation } from '../../services/forms.service';

// ===========================================
// Field Components
// ===========================================

interface FieldProps {
  field: FormField;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

const TextField: React.FC<FieldProps> = ({ field, value, error, onChange, disabled }) => (
  <input
    type="text"
    value={(value as string) || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={field.placeholder}
    disabled={disabled}
    className={`w-full px-4 py-3 rounded-xl border ${
      error
        ? 'border-red-500 focus:ring-red-500'
        : 'border-dark-200 dark:border-dark-700 focus:ring-primary-500'
    } bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
  />
);

const TextAreaField: React.FC<FieldProps> = ({ field, value, error, onChange, disabled }) => (
  <textarea
    value={(value as string) || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={field.placeholder}
    disabled={disabled}
    rows={4}
    className={`w-full px-4 py-3 rounded-xl border ${
      error
        ? 'border-red-500 focus:ring-red-500'
        : 'border-dark-200 dark:border-dark-700 focus:ring-primary-500'
    } bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed`}
  />
);

const NumberField: React.FC<FieldProps> = ({ field, value, error, onChange, disabled }) => (
  <input
    type="number"
    value={(value as number) || ''}
    onChange={(e) => onChange(e.target.valueAsNumber || e.target.value)}
    placeholder={field.placeholder}
    disabled={disabled}
    className={`w-full px-4 py-3 rounded-xl border ${
      error
        ? 'border-red-500 focus:ring-red-500'
        : 'border-dark-200 dark:border-dark-700 focus:ring-primary-500'
    } bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
  />
);

const EmailField: React.FC<FieldProps> = ({ field, value, error, onChange, disabled }) => (
  <input
    type="email"
    value={(value as string) || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={field.placeholder || 'exemple@email.com'}
    disabled={disabled}
    className={`w-full px-4 py-3 rounded-xl border ${
      error
        ? 'border-red-500 focus:ring-red-500'
        : 'border-dark-200 dark:border-dark-700 focus:ring-primary-500'
    } bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
  />
);

const PhoneField: React.FC<FieldProps> = ({ field, value, error, onChange, disabled }) => (
  <input
    type="tel"
    value={(value as string) || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={field.placeholder || '+237 6XX XXX XXX'}
    disabled={disabled}
    className={`w-full px-4 py-3 rounded-xl border ${
      error
        ? 'border-red-500 focus:ring-red-500'
        : 'border-dark-200 dark:border-dark-700 focus:ring-primary-500'
    } bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
  />
);

const DateField: React.FC<FieldProps> = ({ field, value, error, onChange, disabled }) => (
  <div className="relative">
    <input
      type="date"
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full px-4 py-3 rounded-xl border ${
        error
          ? 'border-red-500 focus:ring-red-500'
          : 'border-dark-200 dark:border-dark-700 focus:ring-primary-500'
      } bg-white dark:bg-dark-900 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
    />
    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
  </div>
);

const TimeField: React.FC<FieldProps> = ({ field, value, error, onChange, disabled }) => (
  <div className="relative">
    <input
      type="time"
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full px-4 py-3 rounded-xl border ${
        error
          ? 'border-red-500 focus:ring-red-500'
          : 'border-dark-200 dark:border-dark-700 focus:ring-primary-500'
      } bg-white dark:bg-dark-900 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
    />
    <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
  </div>
);

const SelectField: React.FC<FieldProps> = ({ field, value, error, onChange, disabled }) => {
  const options = field.options || [];

  return (
    <div className="relative">
      <select
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-4 py-3 rounded-xl border appearance-none ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-dark-200 dark:border-dark-700 focus:ring-primary-500'
        } bg-white dark:bg-dark-900 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <option value="">{field.placeholder || 'Sélectionner...'}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
    </div>
  );
};

const MultiSelectField: React.FC<FieldProps> = ({ field, value, error, onChange, disabled }) => {
  const options = field.options || [];
  const selectedValues = (value as string[]) || [];

  const toggleOption = (optValue: string) => {
    if (selectedValues.includes(optValue)) {
      onChange(selectedValues.filter(v => v !== optValue));
    } else {
      onChange([...selectedValues, optValue]);
    }
  };

  return (
    <div className={`p-4 rounded-xl border ${
      error
        ? 'border-red-500'
        : 'border-dark-200 dark:border-dark-700'
    } bg-white dark:bg-dark-900`}>
      <div className="space-y-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-3 cursor-pointer hover:bg-dark-50 dark:hover:bg-dark-800 p-2 rounded-lg transition-colors"
          >
            <input
              type="checkbox"
              checked={selectedValues.includes(opt.value)}
              onChange={() => toggleOption(opt.value)}
              disabled={disabled}
              className="w-5 h-5 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-dark-700 dark:text-dark-200">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

const RadioField: React.FC<FieldProps> = ({ field, value, error, onChange, disabled }) => {
  const options = field.options || [];

  return (
    <div className={`p-4 rounded-xl border ${
      error
        ? 'border-red-500'
        : 'border-dark-200 dark:border-dark-700'
    } bg-white dark:bg-dark-900`}>
      <div className="space-y-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-3 cursor-pointer hover:bg-dark-50 dark:hover:bg-dark-800 p-2 rounded-lg transition-colors"
          >
            <input
              type="radio"
              name={field.code}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              disabled={disabled}
              className="w-5 h-5 border-dark-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-dark-700 dark:text-dark-200">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

const CheckboxField: React.FC<FieldProps> = ({ field, value, error, onChange, disabled }) => (
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={!!value}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className="w-5 h-5 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
    />
    <span className="text-dark-700 dark:text-dark-200">{field.label}</span>
  </label>
);

const FileField: React.FC<FieldProps> = ({ field, value, error, onChange, disabled }) => {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onChange(file);
    }
  };

  return (
    <div className={`relative p-6 rounded-xl border-2 border-dashed ${
      error
        ? 'border-red-500'
        : 'border-dark-300 dark:border-dark-600 hover:border-primary-400'
    } bg-dark-50 dark:bg-dark-900 transition-colors`}>
      <input
        type="file"
        onChange={handleFileChange}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      <div className="text-center">
        <Upload className="w-10 h-10 mx-auto mb-3 text-dark-400" />
        {fileName ? (
          <div className="flex items-center justify-center gap-2">
            <FileText className="w-4 h-4 text-primary-600" />
            <span className="text-dark-700 dark:text-dark-200">{fileName}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFileName(null);
                onChange(null);
              }}
              className="p-1 rounded-full hover:bg-dark-200 dark:hover:bg-dark-700"
            >
              <X className="w-4 h-4 text-dark-400" />
            </button>
          </div>
        ) : (
          <>
            <p className="text-dark-700 dark:text-dark-200 font-medium">
              Glissez un fichier ou cliquez pour sélectionner
            </p>
            <p className="text-xs text-dark-400 mt-1">
              {field.helpText || 'Formats acceptés: tous'}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

// ===========================================
// Field Renderer
// ===========================================

const renderField = (field: FormField, value: unknown, error: string | undefined, onChange: (value: unknown) => void, disabled?: boolean) => {
  const fieldType = field.fieldType?.code || 'text';
  const props: FieldProps = { field, value, error, onChange, disabled };

  switch (fieldType) {
    case 'text':
      return <TextField {...props} />;
    case 'textarea':
      return <TextAreaField {...props} />;
    case 'number':
      return <NumberField {...props} />;
    case 'email':
      return <EmailField {...props} />;
    case 'phone':
      return <PhoneField {...props} />;
    case 'date':
    case 'datetime':
      return <DateField {...props} />;
    case 'time':
      return <TimeField {...props} />;
    case 'select':
      return <SelectField {...props} />;
    case 'multiselect':
      return <MultiSelectField {...props} />;
    case 'radio':
      return <RadioField {...props} />;
    case 'checkbox':
      return <CheckboxField {...props} />;
    case 'file':
    case 'image':
      return <FileField {...props} />;
    default:
      return <TextField {...props} />;
  }
};

// ===========================================
// Section Component
// ===========================================

interface FormSectionRendererProps {
  section: FormSection;
  formData: Record<string, unknown>;
  errors: Record<string, string>;
  onChange: (fieldCode: string, value: unknown) => void;
  disabled?: boolean;
}

const FormSectionRenderer: React.FC<FormSectionRendererProps> = ({
  section,
  formData,
  errors,
  onChange,
  disabled,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const fields = section.fields || [];
  const columns = section.columns || 1;

  return (
    <div className="rounded-2xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-white/20 dark:border-dark-700/50 shadow-lg overflow-hidden">
      {/* Section Header */}
      <div
        className={`flex items-center justify-between px-6 py-4 bg-dark-50 dark:bg-dark-900/50 ${
          section.isCollapsible ? 'cursor-pointer' : ''
        }`}
        onClick={() => section.isCollapsible && setIsExpanded(!isExpanded)}
      >
        <div>
          <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
            {section.title}
          </h3>
          {section.description && (
            <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
              {section.description}
            </p>
          )}
        </div>
        {section.isCollapsible && (
          <button className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-dark-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-dark-400" />
            )}
          </button>
        )}
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
            <div className={`p-6 grid gap-6 ${
              columns === 1 ? 'grid-cols-1' :
              columns === 2 ? 'grid-cols-1 md:grid-cols-2' :
              'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {fields.map((field) => {
                // Skip hidden fields
                if (field.isHidden) return null;

                // Calculate column span
                const colSpan = field.columnSpan || 1;
                const spanClass =
                  colSpan === 3 ? 'md:col-span-2 lg:col-span-3' :
                  colSpan === 2 ? 'md:col-span-2' : '';

                return (
                  <div key={field.id} className={spanClass}>
                    <label className="block mb-2">
                      <span className="text-sm font-medium text-dark-700 dark:text-dark-200">
                        {field.label}
                        {field.isRequired && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </span>
                      {field.helpText && (
                        <span className="block text-xs text-dark-400 mt-0.5">
                          {field.helpText}
                        </span>
                      )}
                    </label>
                    {renderField(
                      field,
                      formData[field.code],
                      errors[field.code],
                      (value) => onChange(field.code, value),
                      disabled || field.isReadonly
                    )}
                    {errors[field.code] && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors[field.code]}
                      </p>
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
// Form Preview Page
// ===========================================

interface FormPreviewPageProps {
  formId: string;
  eventId?: string;
  procedureExecutionId?: string;
  stepExecutionId?: string;
  onBack: () => void;
  onSuccess?: () => void;
}

export const FormPreviewPage: React.FC<FormPreviewPageProps> = ({
  formId,
  eventId,
  procedureExecutionId,
  stepExecutionId,
  onBack,
  onSuccess,
}) => {
  // State
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Queries
  const { data: form, isLoading } = useForm(formId);

  // Mutations
  const createSubmissionMutation = useCreateSubmission();
  const validateFormDataMutation = useValidateFormData();

  // Initialize form data with default values
  React.useEffect(() => {
    if (form?.sections) {
      const defaults: Record<string, unknown> = {};
      form.sections.forEach((section) => {
        section.fields?.forEach((field) => {
          if (field.defaultValue) {
            defaults[field.code] = field.defaultValue;
          }
        });
      });
      setFormData(defaults);
    }
  }, [form]);

  // Handlers
  const handleFieldChange = (fieldCode: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [fieldCode]: value }));
    // Clear error when field is changed
    if (errors[fieldCode]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldCode];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    form?.sections?.forEach((section) => {
      section.fields?.forEach((field) => {
        const value = formData[field.code];

        // Required validation
        if (field.isRequired && (value === undefined || value === null || value === '')) {
          newErrors[field.code] = 'Ce champ est obligatoire';
          return;
        }

        // Type-specific validation
        if (value) {
          const rules = field.validationRules as FieldValidation;
          if (rules) {
            if (rules.minLength && String(value).length < rules.minLength) {
              newErrors[field.code] = `Minimum ${rules.minLength} caractères`;
            }
            if (rules.maxLength && String(value).length > rules.maxLength) {
              newErrors[field.code] = `Maximum ${rules.maxLength} caractères`;
            }
            if (rules.min && Number(value) < rules.min) {
              newErrors[field.code] = `Minimum ${rules.min}`;
            }
            if (rules.max && Number(value) > rules.max) {
              newErrors[field.code] = `Maximum ${rules.max}`;
            }
            if (rules.pattern && !new RegExp(rules.pattern).test(String(value))) {
              newErrors[field.code] = rules.patternMessage || 'Format invalide';
            }
          }

          // Email validation
          if (field.fieldType?.code === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(String(value))) {
              newErrors[field.code] = 'Adresse email invalide';
            }
          }
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (asDraft = false) => {
    if (!asDraft && !validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionData: CreateSubmissionData = {
        formId,
        eventId,
        procedureExecutionId,
        stepExecutionId,
        data: formData,
        status: asDraft ? 'DRAFT' : 'SUBMITTED',
      };

      await createSubmissionMutation.mutateAsync(submissionData);
      setIsSubmitted(true);
      onSuccess?.();
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
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

  if (!form) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-dark-900 dark:text-white">
            Formulaire non trouvé
          </h2>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">
            Formulaire soumis
          </h2>
          <p className="text-dark-500 dark:text-dark-400 mb-6">
            Vos réponses ont été enregistrées avec succès.
          </p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        </motion.div>
      </div>
    );
  }

  const sections = form.sections || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 to-dark-100 dark:from-dark-950 dark:to-dark-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border-b border-dark-200 dark:border-dark-700">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-dark-600 dark:text-dark-300" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-dark-900 dark:text-white">
                {form.name}
              </h1>
              <p className="text-sm text-dark-500 dark:text-dark-400">
                {form.description || 'Remplissez le formulaire ci-dessous'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Enregistrer
            </button>
            <button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-300 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Soumettre
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Form Content */}
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {sections.map((section) => (
          <FormSectionRenderer
            key={section.id}
            section={section}
            formData={formData}
            errors={errors}
            onChange={handleFieldChange}
            disabled={isSubmitting}
          />
        ))}

        {/* Required Fields Notice */}
        <p className="text-sm text-dark-500 dark:text-dark-400 text-center">
          <span className="text-red-500">*</span> Champs obligatoires
        </p>
      </main>
    </div>
  );
};

export default FormPreviewPage;
