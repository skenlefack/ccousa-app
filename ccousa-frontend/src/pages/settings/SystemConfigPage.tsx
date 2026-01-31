import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server,
  Globe,
  Calendar,
  Upload,
  Mail,
  Bell,
  Shield,
  Save,
  RotateCcw,
  CheckCircle,
  Info,
  Zap,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  Input,
  Select,
  Toggle,
  Button,
  Skeleton,
  toast,
} from '../../components/ui';
import { cn } from '../../utils/cn';
import { useSystemConfigs, useBulkUpdateSystemConfigs, useReferenceData } from '../../hooks/useSettings';

interface ConfigSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
}

const configSections: ConfigSection[] = [
  {
    id: 'general',
    title: 'Général',
    description: 'Paramètres généraux de la plateforme',
    icon: <Server className="w-5 h-5" />,
    iconColor: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    id: 'localization',
    title: 'Localisation',
    description: 'Langue, fuseau horaire et format de date',
    icon: <Globe className="w-5 h-5" />,
    iconColor: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  {
    id: 'files',
    title: 'Fichiers',
    description: "Limites de taille et types de fichiers autorisés",
    icon: <Upload className="w-5 h-5" />,
    iconColor: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Paramètres des notifications système',
    icon: <Bell className="w-5 h-5" />,
    iconColor: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  },
  {
    id: 'security',
    title: 'Sécurité',
    description: 'Sessions, mots de passe et authentification',
    icon: <Shield className="w-5 h-5" />,
    iconColor: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  },
];

interface ConfigFormData {
  // General
  app_name: string;
  app_description: string;
  maintenance_mode: boolean;
  launch_date: string;

  // Localization
  default_language: string;
  default_timezone: string;
  date_format: string;
  time_format: string;

  // Files
  max_file_size: string;
  allowed_file_types: string;
  max_attachments_per_event: string;

  // Notifications
  email_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
  notification_digest_frequency: string;

  // Security
  session_timeout_minutes: string;
  password_min_length: string;
  password_require_special: boolean;
  max_login_attempts: string;
  account_lockout_minutes: string;
}

const defaultConfig: ConfigFormData = {
  app_name: 'CCOUSA',
  app_description: 'Centre de Coordination Une Seule Santé',
  maintenance_mode: false,
  launch_date: '',
  default_language: 'fr',
  default_timezone: 'Africa/Douala',
  date_format: 'DD/MM/YYYY',
  time_format: '24h',
  max_file_size: '104857600',
  allowed_file_types: 'pdf,doc,docx,xls,xlsx,png,jpg,jpeg,gif',
  max_attachments_per_event: '10',
  email_notifications_enabled: true,
  sms_notifications_enabled: false,
  push_notifications_enabled: true,
  notification_digest_frequency: 'daily',
  session_timeout_minutes: '480',
  password_min_length: '8',
  password_require_special: true,
  max_login_attempts: '5',
  account_lockout_minutes: '30',
};

export const SystemConfigPage: React.FC = () => {
  const [formData, setFormData] = useState<ConfigFormData>(defaultConfig);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeSection, setActiveSection] = useState('general');

  const { data: configs, isLoading: configsLoading } = useSystemConfigs();
  const { data: refData, isLoading: refLoading } = useReferenceData();
  const updateConfigs = useBulkUpdateSystemConfigs();

  // Load config data
  useEffect(() => {
    if (configs) {
      const configMap: Record<string, string> = {};
      configs.forEach((c) => {
        configMap[c.key] = c.value;
      });

      setFormData((prev) => ({
        ...prev,
        ...Object.keys(prev).reduce((acc, key) => {
          if (configMap[key] !== undefined) {
            const value = configMap[key];
            // Handle boolean values
            if (key.includes('enabled') || key.includes('require') || key === 'maintenance_mode') {
              (acc as Record<string, unknown>)[key] = value === 'true';
            } else {
              (acc as Record<string, unknown>)[key] = value;
            }
          }
          return acc;
        }, {} as Partial<ConfigFormData>),
      }));
    }
  }, [configs]);

  const handleChange = (key: keyof ConfigFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const configsToUpdate = Object.entries(formData).map(([key, value]) => ({
      key,
      value: String(value),
    }));

    try {
      await updateConfigs.mutateAsync(configsToUpdate);
      setHasChanges(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleReset = () => {
    if (configs) {
      const configMap: Record<string, string> = {};
      configs.forEach((c) => {
        configMap[c.key] = c.value;
      });
      setFormData((prev) => ({
        ...prev,
        ...Object.keys(prev).reduce((acc, key) => {
          if (configMap[key] !== undefined) {
            const value = configMap[key];
            if (key.includes('enabled') || key.includes('require') || key === 'maintenance_mode') {
              (acc as Record<string, unknown>)[key] = value === 'true';
            } else {
              (acc as Record<string, unknown>)[key] = value;
            }
          }
          return acc;
        }, {} as Partial<ConfigFormData>),
      }));
      setHasChanges(false);
    }
  };

  const formatFileSize = (bytes: string) => {
    const num = parseInt(bytes, 10);
    if (num >= 1073741824) return `${(num / 1073741824).toFixed(1)} GB`;
    if (num >= 1048576) return `${(num / 1048576).toFixed(0)} MB`;
    return `${(num / 1024).toFixed(0)} KB`;
  };

  const isLoading = configsLoading || refLoading;

  const languageOptions = refData?.languages?.map((l) => ({
    value: l.code,
    label: l.name,
  })) || [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
  ];

  const timezoneOptions = refData?.timezones?.map((t) => ({
    value: t.id,
    label: `${t.name} (${t.offset})`,
  })) || [
    { value: 'Africa/Douala', label: 'Africa/Douala (UTC+1)' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dark-900 dark:text-white">
            Configuration système
          </h2>
          <p className="text-dark-500 dark:text-dark-400 mt-1">
            Gérez les paramètres généraux de votre plateforme CCOUSA
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {hasChanges && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  isLoading={updateConfigs.isPending}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Enregistrer
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {!hasChanges && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              <span>Tout est sauvegardé</span>
            </div>
          )}
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2">
        {configSections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              activeSection === section.id
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm'
                : 'text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-700'
            )}
          >
            <span className={cn('p-1 rounded-lg', section.iconColor)}>
              {section.icon}
            </span>
            {section.title}
          </button>
        ))}
      </div>

      {/* Config sections */}
      <AnimatePresence mode="wait">
        {activeSection === 'general' && (
          <motion.div
            key="general"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <Card variant="bordered" padding="lg">
              <CardHeader
                title="Informations de la plateforme"
                subtitle="Nom et description de l'application"
                icon={<Zap className="w-5 h-5" />}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Nom de l'application"
                  value={formData.app_name}
                  onChange={(e) => handleChange('app_name', e.target.value)}
                  placeholder="CCOUSA"
                />
                <Input
                  label="Date de lancement"
                  type="date"
                  value={formData.launch_date}
                  onChange={(e) => handleChange('launch_date', e.target.value)}
                />
                <div className="md:col-span-2">
                  <Input
                    label="Description"
                    value={formData.app_description}
                    onChange={(e) => handleChange('app_description', e.target.value)}
                    placeholder="Centre de Coordination Une Seule Santé"
                  />
                </div>
              </div>
            </Card>

            <Card variant="bordered" padding="lg">
              <CardHeader
                title="Mode maintenance"
                subtitle="Activez le mode maintenance pour bloquer l'accès aux utilisateurs"
                icon={<Server className="w-5 h-5" />}
              />
              <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      Mode maintenance
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      Les utilisateurs verront une page de maintenance
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={formData.maintenance_mode}
                  onChange={(checked) => handleChange('maintenance_mode', checked)}
                  variant="success"
                />
              </div>
            </Card>
          </motion.div>
        )}

        {activeSection === 'localization' && (
          <motion.div
            key="localization"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <Card variant="bordered" padding="lg">
              <CardHeader
                title="Langue et région"
                subtitle="Configurez les paramètres régionaux par défaut"
                icon={<Globe className="w-5 h-5" />}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Langue par défaut"
                  options={languageOptions}
                  value={formData.default_language}
                  onChange={(value) => handleChange('default_language', value)}
                />
                <Select
                  label="Fuseau horaire"
                  options={timezoneOptions}
                  value={formData.default_timezone}
                  onChange={(value) => handleChange('default_timezone', value)}
                />
                <Select
                  label="Format de date"
                  options={[
                    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2025)' },
                    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2025)' },
                    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2025-12-31)' },
                  ]}
                  value={formData.date_format}
                  onChange={(value) => handleChange('date_format', value)}
                />
                <Select
                  label="Format d'heure"
                  options={[
                    { value: '24h', label: '24 heures (14:30)' },
                    { value: '12h', label: '12 heures (2:30 PM)' },
                  ]}
                  value={formData.time_format}
                  onChange={(value) => handleChange('time_format', value)}
                />
              </div>
            </Card>
          </motion.div>
        )}

        {activeSection === 'files' && (
          <motion.div
            key="files"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <Card variant="bordered" padding="lg">
              <CardHeader
                title="Limites de fichiers"
                subtitle="Configurez les restrictions sur les fichiers téléchargés"
                icon={<Upload className="w-5 h-5" />}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Select
                    label="Taille maximale des fichiers"
                    options={[
                      { value: '10485760', label: '10 MB' },
                      { value: '26214400', label: '25 MB' },
                      { value: '52428800', label: '50 MB' },
                      { value: '104857600', label: '100 MB' },
                      { value: '209715200', label: '200 MB' },
                    ]}
                    value={formData.max_file_size}
                    onChange={(value) => handleChange('max_file_size', value)}
                  />
                  <p className="mt-1 text-xs text-dark-500">
                    Actuellement: {formatFileSize(formData.max_file_size)}
                  </p>
                </div>
                <Input
                  label="Nombre max de pièces jointes"
                  type="number"
                  value={formData.max_attachments_per_event}
                  onChange={(e) => handleChange('max_attachments_per_event', e.target.value)}
                  helperText="Par événement"
                />
                <div className="md:col-span-2">
                  <Input
                    label="Types de fichiers autorisés"
                    value={formData.allowed_file_types}
                    onChange={(e) => handleChange('allowed_file_types', e.target.value)}
                    helperText="Extensions séparées par des virgules (ex: pdf,doc,png)"
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {activeSection === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <Card variant="bordered" padding="lg">
              <CardHeader
                title="Canaux de notification"
                subtitle="Activez ou désactivez les différents canaux"
                icon={<Bell className="w-5 h-5" />}
              />
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-dark-50 dark:bg-dark-700/50">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary-500" />
                    <div>
                      <p className="font-medium text-dark-900 dark:text-white">
                        Notifications par email
                      </p>
                      <p className="text-sm text-dark-500">
                        Envoi d'emails pour les alertes importantes
                      </p>
                    </div>
                  </div>
                  <Toggle
                    checked={formData.email_notifications_enabled}
                    onChange={(checked) => handleChange('email_notifications_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-dark-50 dark:bg-dark-700/50">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-secondary-500" />
                    <div>
                      <p className="font-medium text-dark-900 dark:text-white">
                        Notifications push
                      </p>
                      <p className="text-sm text-dark-500">
                        Notifications dans le navigateur
                      </p>
                    </div>
                  </div>
                  <Toggle
                    checked={formData.push_notifications_enabled}
                    onChange={(checked) => handleChange('push_notifications_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-dark-50 dark:bg-dark-700/50">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="font-medium text-dark-900 dark:text-white">
                        Notifications SMS
                      </p>
                      <p className="text-sm text-dark-500">
                        Envoi de SMS pour les urgences
                      </p>
                    </div>
                  </div>
                  <Toggle
                    checked={formData.sms_notifications_enabled}
                    onChange={(checked) => handleChange('sms_notifications_enabled', checked)}
                  />
                </div>
              </div>
            </Card>

            <Card variant="bordered" padding="lg">
              <CardHeader
                title="Résumé des notifications"
                subtitle="Fréquence d'envoi des récapitulatifs"
              />
              <Select
                label="Fréquence du résumé"
                options={[
                  { value: 'never', label: 'Jamais' },
                  { value: 'daily', label: 'Quotidien' },
                  { value: 'weekly', label: 'Hebdomadaire' },
                  { value: 'monthly', label: 'Mensuel' },
                ]}
                value={formData.notification_digest_frequency}
                onChange={(value) => handleChange('notification_digest_frequency', value)}
              />
            </Card>
          </motion.div>
        )}

        {activeSection === 'security' && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <Card variant="bordered" padding="lg">
              <CardHeader
                title="Sessions utilisateur"
                subtitle="Paramètres de durée de session et verrouillage"
                icon={<Shield className="w-5 h-5" />}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Délai d'expiration de session (minutes)"
                  type="number"
                  value={formData.session_timeout_minutes}
                  onChange={(e) => handleChange('session_timeout_minutes', e.target.value)}
                  helperText="Déconnexion automatique après inactivité"
                />
                <Input
                  label="Tentatives de connexion max"
                  type="number"
                  value={formData.max_login_attempts}
                  onChange={(e) => handleChange('max_login_attempts', e.target.value)}
                  helperText="Avant verrouillage du compte"
                />
                <Input
                  label="Durée de verrouillage (minutes)"
                  type="number"
                  value={formData.account_lockout_minutes}
                  onChange={(e) => handleChange('account_lockout_minutes', e.target.value)}
                  helperText="Temps avant réactivation automatique"
                />
              </div>
            </Card>

            <Card variant="bordered" padding="lg">
              <CardHeader
                title="Politique de mots de passe"
                subtitle="Règles de complexité des mots de passe"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Longueur minimale"
                  type="number"
                  value={formData.password_min_length}
                  onChange={(e) => handleChange('password_min_length', e.target.value)}
                  helperText="Nombre de caractères minimum"
                />
                <div className="flex items-center justify-between p-4 rounded-xl bg-dark-50 dark:bg-dark-700/50">
                  <div>
                    <p className="font-medium text-dark-900 dark:text-white">
                      Caractères spéciaux requis
                    </p>
                    <p className="text-sm text-dark-500">
                      Ex: !@#$%^&*
                    </p>
                  </div>
                  <Toggle
                    checked={formData.password_require_special}
                    onChange={(checked) => handleChange('password_require_special', checked)}
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SystemConfigPage;
