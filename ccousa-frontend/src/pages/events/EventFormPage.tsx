import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  MapPin,
  Calendar,
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  Tag,
  Building2,
  FileText,
  Navigation,
  Map,
  Clock,
  CheckCircle2,
  Info,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Textarea,
  Select,
  Badge,
  Toggle,
  Modal,
  ModalBody,
  ModalFooter,
  Skeleton,
  EmptyState,
} from '../../components/ui';
import { cn } from '../../utils/cn';
import { formatDateTime } from '../../utils/format';
import { useEvent, useCreateEvent, useUpdateEvent } from '../../hooks/useEvents';
import { useEventCategories, useOrganizationalUnits } from '../../hooks/useSettings';
import type { Event } from '../../types';
import type { CreateEventData, UpdateEventData } from '../../services/events.service';

// ===========================================
// Types & Constants
// ===========================================

interface EventFormPageProps {
  eventId?: string; // If provided, edit mode
  onBack: () => void;
  onSuccess: (event: Event) => void;
}

interface FormData {
  title: string;
  description: string;
  categoryId: string;
  severity: Event['severity'];
  location: string;
  latitude: string;
  longitude: string;
  organizationalUnitId: string;
  reportedAt: string;
}

interface FormErrors {
  [key: string]: string;
}

const defaultFormData: FormData = {
  title: '',
  description: '',
  categoryId: '',
  severity: 'MEDIUM',
  location: '',
  latitude: '',
  longitude: '',
  organizationalUnitId: '',
  reportedAt: new Date().toISOString().slice(0, 16),
};

const severityOptions = [
  {
    value: 'LOW',
    label: 'Faible',
    description: 'Impact limité, pas de danger immédiat',
    icon: AlertCircle,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  },
  {
    value: 'MEDIUM',
    label: 'Modéré',
    description: 'Nécessite une attention dans les prochaines heures',
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  },
  {
    value: 'HIGH',
    label: 'Élevé',
    description: 'Intervention rapide nécessaire',
    icon: AlertTriangle,
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  },
  {
    value: 'CRITICAL',
    label: 'Critique',
    description: 'Urgence absolue, risque majeur',
    icon: AlertOctagon,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  },
];

// ===========================================
// Helper Components
// ===========================================

const FormSection: React.FC<{
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, icon, children }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
          {icon}
        </div>
      )}
      <div>
        <h3 className="font-semibold text-dark-900 dark:text-white">{title}</h3>
        {description && (
          <p className="text-sm text-dark-500 dark:text-dark-400">{description}</p>
        )}
      </div>
    </div>
    <div className="pl-0 lg:pl-[52px]">{children}</div>
  </div>
);

const SeveritySelector: React.FC<{
  value: Event['severity'];
  onChange: (value: Event['severity']) => void;
}> = ({ value, onChange }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {severityOptions.map((option) => {
      const Icon = option.icon;
      const isSelected = value === option.value;

      return (
        <motion.button
          key={option.value}
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange(option.value as Event['severity'])}
          className={cn(
            'relative flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left',
            isSelected
              ? option.bg
              : 'bg-white dark:bg-dark-800 border-dark-200 dark:border-dark-700 hover:border-dark-300 dark:hover:border-dark-600'
          )}
        >
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
              isSelected ? 'bg-white dark:bg-dark-800' : 'bg-dark-100 dark:bg-dark-700'
            )}
          >
            <Icon className={cn('w-5 h-5', option.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              'font-semibold',
              isSelected ? option.color : 'text-dark-900 dark:text-white'
            )}>
              {option.label}
            </p>
            <p className="text-sm text-dark-500 dark:text-dark-400 mt-0.5">
              {option.description}
            </p>
          </div>
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                'absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center',
                option.color.replace('text-', 'bg-')
              )}
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
            </motion.div>
          )}
        </motion.button>
      );
    })}
  </div>
);

const CategorySelector: React.FC<{
  value: string;
  onChange: (value: string) => void;
  categories: Array<{ id: string; name: string; color: string; description?: string }>;
  error?: string;
}> = ({ value, onChange, categories, error }) => (
  <div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {categories.map((category) => {
        const isSelected = value === category.id;

        return (
          <motion.button
            key={category.id}
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(category.id)}
            className={cn(
              'relative flex flex-col items-center p-4 rounded-xl border-2 transition-all',
              isSelected
                ? 'bg-white dark:bg-dark-800'
                : 'bg-white dark:bg-dark-800 border-dark-200 dark:border-dark-700 hover:border-dark-300 dark:hover:border-dark-600'
            )}
            style={{
              borderColor: isSelected ? category.color : undefined,
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-2"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <Tag className="w-6 h-6" style={{ color: category.color }} />
            </div>
            <p className="font-medium text-dark-900 dark:text-white text-sm text-center">
              {category.name}
            </p>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: category.color }}
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
    {error && (
      <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {error}
      </p>
    )}
  </div>
);

// ===========================================
// Main Component
// ===========================================

export const EventFormPage: React.FC<EventFormPageProps> = ({ eventId, onBack, onSuccess }) => {
  const isEditMode = !!eventId;

  // State
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Queries
  const { data: event, isLoading: isLoadingEvent } = useEvent(eventId || '', { enabled: isEditMode });
  const { data: categories, isLoading: isLoadingCategories } = useEventCategories();
  const { data: units, isLoading: isLoadingUnits } = useOrganizationalUnits(false);
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  // Populate form in edit mode
  useEffect(() => {
    if (event && isEditMode) {
      setFormData({
        title: event.title,
        description: event.description || '',
        categoryId: event.categoryId,
        severity: event.severity,
        location: event.location,
        latitude: event.latitude?.toString() || '',
        longitude: event.longitude?.toString() || '',
        organizationalUnitId: event.organizationalUnitId || '',
        reportedAt: event.reportedAt.slice(0, 16),
      });
    }
  }, [event, isEditMode]);

  // Handlers
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const getMyLocation = () => {
    if (!navigator.geolocation) {
      setErrors((prev) => ({ ...prev, location: 'Géolocalisation non supportée par ce navigateur' }));
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setErrors((prev) => ({ ...prev, location: 'Impossible d\'obtenir la position' }));
        setIsGettingLocation(false);
      }
    );
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Le titre doit contenir au moins 5 caractères';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'La catégorie est requise';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'La localisation est requise';
    }

    if (formData.latitude && isNaN(parseFloat(formData.latitude))) {
      newErrors.latitude = 'Latitude invalide';
    }

    if (formData.longitude && isNaN(parseFloat(formData.longitude))) {
      newErrors.longitude = 'Longitude invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const data: CreateEventData | UpdateEventData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      categoryId: formData.categoryId,
      severity: formData.severity,
      location: formData.location.trim(),
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      organizationalUnitId: formData.organizationalUnitId || undefined,
      reportedAt: formData.reportedAt ? new Date(formData.reportedAt).toISOString() : undefined,
    };

    try {
      let result: Event;
      if (isEditMode && eventId) {
        result = await updateEvent.mutateAsync({ id: eventId, data });
      } else {
        result = await createEvent.mutateAsync(data as CreateEventData);
      }
      onSuccess(result);
    } catch {
      // Error handled by hook
    }
  };

  // Unit options for select
  const unitOptions = useMemo(() => {
    return (units || [])
      .filter((u) => u.isActive)
      .map((u) => ({
        value: u.id,
        label: u.name,
        description: u.type,
      }));
  }, [units]);

  // Selected category for preview
  const selectedCategory = useMemo(() => {
    return categories?.find((c) => c.id === formData.categoryId);
  }, [categories, formData.categoryId]);

  const selectedSeverity = severityOptions.find((s) => s.value === formData.severity);
  const isSubmitting = createEvent.isPending || updateEvent.isPending;
  const isLoading = isLoadingEvent || isLoadingCategories || isLoadingUnits;

  if (isLoading && isEditMode) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48 rounded-xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (isEditMode && !event && !isLoadingEvent) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Événement non trouvé"
        description="L'événement demandé n'existe pas ou a été supprimé."
        action={{
          label: 'Retour à la liste',
          onClick: onBack,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
              {isEditMode ? 'Modifier l\'événement' : 'Nouvel événement'}
            </h1>
            <p className="text-dark-500 dark:text-dark-400">
              {isEditMode ? `Modification de ${event?.code}` : 'Créez un nouvel événement sanitaire'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
            disabled={!formData.title || !formData.categoryId}
          >
            Aperçu
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            {isEditMode ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Info */}
          <Card>
            <CardBody>
              <FormSection
                title="Informations générales"
                description="Décrivez l'événement de manière claire et concise"
                icon={<FileText className="w-5 h-5" />}
              >
                <div className="space-y-4">
                  <Input
                    label="Titre de l'événement"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Ex: Suspicion de cas de choléra à Libreville"
                    error={errors.title}
                    maxLength={200}
                  />
                  <Textarea
                    label="Description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Décrivez les circonstances, les symptômes observés, le nombre de personnes affectées..."
                    rows={4}
                    helperText="Fournissez autant de détails que possible pour faciliter l'investigation"
                  />
                </div>
              </FormSection>
            </CardBody>
          </Card>

          {/* Category */}
          <Card>
            <CardBody>
              <FormSection
                title="Catégorie"
                description="Sélectionnez le type d'événement sanitaire"
                icon={<Tag className="w-5 h-5" />}
              >
                {isLoadingCategories ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <CategorySelector
                    value={formData.categoryId}
                    onChange={(value) => handleChange('categoryId', value)}
                    categories={categories?.filter((c) => c.isActive) || []}
                    error={errors.categoryId}
                  />
                )}
              </FormSection>
            </CardBody>
          </Card>

          {/* Severity */}
          <Card>
            <CardBody>
              <FormSection
                title="Niveau de sévérité"
                description="Évaluez l'urgence et l'impact potentiel de l'événement"
                icon={<AlertTriangle className="w-5 h-5" />}
              >
                <SeveritySelector
                  value={formData.severity}
                  onChange={(value) => handleChange('severity', value)}
                />
              </FormSection>
            </CardBody>
          </Card>

          {/* Location */}
          <Card>
            <CardBody>
              <FormSection
                title="Localisation"
                description="Indiquez précisément où l'événement s'est produit"
                icon={<MapPin className="w-5 h-5" />}
              >
                <div className="space-y-4">
                  <Input
                    label="Adresse / Lieu"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="Ex: Quartier Glass, Libreville, Estuaire"
                    error={errors.location}
                    leftIcon={<MapPin className="w-4 h-4" />}
                  />

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Select
                        label="Unité organisationnelle"
                        value={formData.organizationalUnitId}
                        onChange={(value) => handleChange('organizationalUnitId', value)}
                        options={[
                          { value: '', label: 'Non spécifiée' },
                          ...unitOptions,
                        ]}
                        placeholder="Sélectionner une unité"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-dark-50 dark:bg-dark-700/50 border border-dark-200 dark:border-dark-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-dark-700 dark:text-dark-300">
                        <Navigation className="w-4 h-4" />
                        Coordonnées GPS (optionnel)
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={getMyLocation}
                        disabled={isGettingLocation}
                        isLoading={isGettingLocation}
                      >
                        <Map className="w-4 h-4 mr-1.5" />
                        Ma position
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Latitude"
                        value={formData.latitude}
                        onChange={(e) => handleChange('latitude', e.target.value)}
                        placeholder="Ex: 0.416667"
                        error={errors.latitude}
                        size="sm"
                      />
                      <Input
                        label="Longitude"
                        value={formData.longitude}
                        onChange={(e) => handleChange('longitude', e.target.value)}
                        placeholder="Ex: 9.450000"
                        error={errors.longitude}
                        size="sm"
                      />
                    </div>
                    {formData.latitude && formData.longitude && (
                      <a
                        href={`https://maps.google.com/?q=${formData.latitude},${formData.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        <Map className="w-4 h-4" />
                        Voir sur la carte
                      </a>
                    )}
                  </div>
                </div>
              </FormSection>
            </CardBody>
          </Card>

          {/* Date/Time */}
          <Card>
            <CardBody>
              <FormSection
                title="Date et heure"
                description="Quand l'événement a-t-il été signalé ?"
                icon={<Calendar className="w-5 h-5" />}
              >
                <Input
                  type="datetime-local"
                  label="Date de signalement"
                  value={formData.reportedAt}
                  onChange={(e) => handleChange('reportedAt', e.target.value)}
                  max={new Date().toISOString().slice(0, 16)}
                />
              </FormSection>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar - Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            {/* Quick Preview Card */}
            <Card variant="glass">
              <CardHeader>
                <h3 className="font-semibold text-dark-900 dark:text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary-500" />
                  Aperçu
                </h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {/* Severity */}
                  <div>
                    <p className="text-xs text-dark-500 mb-1">Sévérité</p>
                    <Badge
                      className={cn(
                        'flex items-center gap-1.5 w-fit',
                        selectedSeverity?.color
                      )}
                    >
                      {selectedSeverity && <selectedSeverity.icon className="w-3.5 h-3.5" />}
                      {selectedSeverity?.label || 'Non défini'}
                    </Badge>
                  </div>

                  {/* Category */}
                  <div>
                    <p className="text-xs text-dark-500 mb-1">Catégorie</p>
                    {selectedCategory ? (
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: `${selectedCategory.color}15`,
                          borderColor: selectedCategory.color,
                          color: selectedCategory.color,
                        }}
                      >
                        {selectedCategory.name}
                      </Badge>
                    ) : (
                      <span className="text-sm text-dark-400">Non sélectionnée</span>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <p className="text-xs text-dark-500 mb-1">Titre</p>
                    <p className="font-medium text-dark-900 dark:text-white">
                      {formData.title || 'Non défini'}
                    </p>
                  </div>

                  {/* Location */}
                  <div>
                    <p className="text-xs text-dark-500 mb-1">Localisation</p>
                    <div className="flex items-center gap-1.5 text-dark-700 dark:text-dark-300">
                      <MapPin className="w-4 h-4 text-dark-400" />
                      <span className="text-sm">{formData.location || 'Non définie'}</span>
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <p className="text-xs text-dark-500 mb-1">Date</p>
                    <div className="flex items-center gap-1.5 text-dark-700 dark:text-dark-300">
                      <Calendar className="w-4 h-4 text-dark-400" />
                      <span className="text-sm">
                        {formData.reportedAt
                          ? formatDateTime(formData.reportedAt)
                          : 'Non définie'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Tips */}
            <Card className="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
              <CardBody>
                <h4 className="font-medium text-primary-900 dark:text-primary-100 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Conseils
                </h4>
                <ul className="space-y-2 text-sm text-primary-700 dark:text-primary-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Soyez précis dans la description pour faciliter l'investigation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Ajoutez les coordonnées GPS si possible</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Évaluez correctement la sévérité pour prioriser les interventions</span>
                  </li>
                </ul>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Aperçu de l'événement"
        size="lg"
      >
        <ModalBody>
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Badge
                className={cn(
                  'flex items-center gap-1.5',
                  selectedSeverity?.color
                )}
              >
                {selectedSeverity && <selectedSeverity.icon className="w-3.5 h-3.5" />}
                {selectedSeverity?.label}
              </Badge>
              {selectedCategory && (
                <Badge
                  variant="outline"
                  style={{
                    backgroundColor: `${selectedCategory.color}15`,
                    borderColor: selectedCategory.color,
                    color: selectedCategory.color,
                  }}
                >
                  {selectedCategory.name}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-dark-900 dark:text-white">
              {formData.title || 'Sans titre'}
            </h2>

            {/* Description */}
            {formData.description && (
              <p className="text-dark-600 dark:text-dark-300 whitespace-pre-wrap">
                {formData.description}
              </p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-dark-500">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{formData.location || 'Localisation non définie'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>
                  {formData.reportedAt
                    ? formatDateTime(formData.reportedAt)
                    : 'Date non définie'}
                </span>
              </div>
            </div>

            {/* Coordinates */}
            {formData.latitude && formData.longitude && (
              <div className="p-3 rounded-lg bg-dark-50 dark:bg-dark-700/50">
                <p className="text-sm text-dark-500 flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  GPS: {formData.latitude}, {formData.longitude}
                </p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowPreview(false)}>
            Fermer
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            {isEditMode ? 'Enregistrer' : 'Créer l\'événement'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default EventFormPage;
