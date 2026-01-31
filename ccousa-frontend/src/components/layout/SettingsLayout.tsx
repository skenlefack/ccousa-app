import React from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Server,
  Layers,
  FileText,
  Building2,
  Clock,
  Bell,
  Shield,
  Palette,
  Database,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SettingsLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

const navItems: NavItem[] = [
  {
    id: 'system',
    label: 'Configuration système',
    icon: <Server className="w-5 h-5" />,
    description: 'Paramètres généraux de la plateforme',
  },
  {
    id: 'categories',
    label: "Catégories d'événements",
    icon: <Layers className="w-5 h-5" />,
    description: 'Types et catégories des événements',
  },
  {
    id: 'document-types',
    label: 'Types de documents',
    icon: <FileText className="w-5 h-5" />,
    description: 'Gestion des types de documents',
  },
  {
    id: 'organizational-units',
    label: 'Unités organisationnelles',
    icon: <Building2 className="w-5 h-5" />,
    description: 'Structure hiérarchique',
  },
  {
    id: 'work-schedules',
    label: 'Horaires de travail',
    icon: <Clock className="w-5 h-5" />,
    description: 'Plannings et horaires',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <Bell className="w-5 h-5" />,
    description: 'Préférences de notifications',
  },
  {
    id: 'security',
    label: 'Sécurité',
    icon: <Shield className="w-5 h-5" />,
    description: 'Paramètres de sécurité',
  },
  {
    id: 'appearance',
    label: 'Apparence',
    icon: <Palette className="w-5 h-5" />,
    description: 'Thème et personnalisation',
  },
];

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  children,
  activeSection = 'system',
  onSectionChange,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-white to-primary-50/30 dark:from-dark-950 dark:via-dark-900 dark:to-primary-950/20">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-secondary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/25">
              <Settings className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-dark-900 dark:text-white">
              Paramètres
            </h1>
          </div>
          <p className="text-dark-500 dark:text-dark-400 ml-14">
            Configurez et personnalisez votre plateforme CCOUSA
          </p>
        </motion.div>

        {/* Main content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:w-80 flex-shrink-0"
          >
            <nav className="sticky top-8">
              <div className="p-2 rounded-2xl bg-white/70 dark:bg-dark-800/70 backdrop-blur-xl border border-white/20 dark:border-dark-700 shadow-glass">
                {navItems.map((item, index) => {
                  const isActive = activeSection === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      onClick={() => onSectionChange?.(item.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl',
                        'text-left transition-all duration-200',
                        'group relative overflow-hidden',
                        isActive
                          ? 'bg-gradient-to-r from-primary-500/10 to-secondary-500/10 text-primary-700 dark:text-primary-300'
                          : 'text-dark-600 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700/50'
                      )}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeSettingsIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-gradient-to-b from-primary-500 to-secondary-500"
                        />
                      )}

                      {/* Icon */}
                      <div
                        className={cn(
                          'flex-shrink-0 p-2 rounded-lg transition-colors',
                          isActive
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                            : 'bg-dark-100 dark:bg-dark-700 text-dark-500 group-hover:bg-primary-100 group-hover:text-primary-600 dark:group-hover:bg-primary-900/30'
                        )}
                      >
                        {item.icon}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'font-medium text-sm truncate',
                            isActive && 'text-primary-700 dark:text-primary-300'
                          )}
                        >
                          {item.label}
                        </p>
                        {item.description && (
                          <p className="text-xs text-dark-400 dark:text-dark-500 truncate">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Arrow */}
                      <ChevronRight
                        className={cn(
                          'w-4 h-4 flex-shrink-0 transition-transform',
                          isActive
                            ? 'text-primary-500 translate-x-0'
                            : 'text-dark-300 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                        )}
                      />
                    </motion.button>
                  );
                })}
              </div>

              {/* Quick info card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border border-primary-200/50 dark:border-primary-800/30"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Database className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium text-dark-700 dark:text-dark-200">
                    Base de données
                  </span>
                </div>
                <p className="text-xs text-dark-500 dark:text-dark-400">
                  Toutes les modifications sont sauvegardées automatiquement et synchronisées avec le serveur.
                </p>
              </motion.div>
            </nav>
          </motion.aside>

          {/* Main Content Area */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 min-w-0"
          >
            <div className="p-6 rounded-2xl bg-white/70 dark:bg-dark-800/70 backdrop-blur-xl border border-white/20 dark:border-dark-700 shadow-glass">
              {children}
            </div>
          </motion.main>
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;
