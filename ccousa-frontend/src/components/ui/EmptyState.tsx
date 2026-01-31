import React from 'react';
import { motion } from 'framer-motion';
import {
  Inbox,
  Search,
  FileX,
  Users,
  AlertCircle,
  FolderOpen,
  Database,
  Settings
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'illustrated';
  className?: string;
}

const sizes = {
  sm: {
    icon: 'w-12 h-12',
    iconWrapper: 'p-3',
    title: 'text-base',
    description: 'text-sm',
  },
  md: {
    icon: 'w-16 h-16',
    iconWrapper: 'p-4',
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    icon: 'w-20 h-20',
    iconWrapper: 'p-5',
    title: 'text-xl',
    description: 'text-base',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  variant = 'default',
  className,
}) => {
  const sizeConfig = sizes[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'py-12 px-6',
        className
      )}
    >
      {/* Icon */}
      {variant !== 'minimal' && (
        <div
          className={cn(
            'rounded-full mb-6',
            variant === 'default' && 'bg-dark-100 dark:bg-dark-700',
            variant === 'illustrated' && 'bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30',
            sizeConfig.iconWrapper
          )}
        >
          <div
            className={cn(
              'text-dark-400 dark:text-dark-500',
              variant === 'illustrated' && 'text-primary-500 dark:text-primary-400',
              sizeConfig.icon
            )}
          >
            {icon || <Inbox className="w-full h-full" />}
          </div>
        </div>
      )}

      {/* Title */}
      <h3
        className={cn(
          'font-semibold text-dark-900 dark:text-white mb-2',
          sizeConfig.title
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            'text-dark-500 dark:text-dark-400 max-w-sm mb-6',
            sizeConfig.description
          )}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              leftIcon={action.icon}
              size={size === 'lg' ? 'lg' : 'md'}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              onClick={secondaryAction.onClick}
              size={size === 'lg' ? 'lg' : 'md'}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
};

// Preset empty states for common scenarios
export const NoResultsEmpty: React.FC<{
  searchTerm?: string;
  onClear?: () => void;
}> = ({ searchTerm, onClear }) => (
  <EmptyState
    icon={<Search className="w-full h-full" />}
    title="Aucun résultat trouvé"
    description={
      searchTerm
        ? `Aucun résultat pour "${searchTerm}". Essayez avec d'autres termes.`
        : "Aucun élément ne correspond à vos critères de recherche."
    }
    action={
      onClear
        ? {
            label: 'Effacer la recherche',
            onClick: onClear,
          }
        : undefined
    }
    variant="illustrated"
  />
);

export const NoDataEmpty: React.FC<{
  onAdd?: () => void;
  addLabel?: string;
}> = ({ onAdd, addLabel = 'Ajouter' }) => (
  <EmptyState
    icon={<Database className="w-full h-full" />}
    title="Aucune donnée"
    description="Il n'y a pas encore de données à afficher. Commencez par en ajouter."
    action={
      onAdd
        ? {
            label: addLabel,
            onClick: onAdd,
          }
        : undefined
    }
    variant="illustrated"
  />
);

export const ErrorEmpty: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => (
  <EmptyState
    icon={<AlertCircle className="w-full h-full text-red-500" />}
    title="Une erreur est survenue"
    description={message || "Impossible de charger les données. Veuillez réessayer."}
    action={
      onRetry
        ? {
            label: 'Réessayer',
            onClick: onRetry,
          }
        : undefined
    }
  />
);

export const NoAccessEmpty: React.FC = () => (
  <EmptyState
    icon={<FileX className="w-full h-full text-amber-500" />}
    title="Accès non autorisé"
    description="Vous n'avez pas les permissions nécessaires pour accéder à cette ressource."
  />
);

export const ConfigurationNeededEmpty: React.FC<{
  onConfigure?: () => void;
}> = ({ onConfigure }) => (
  <EmptyState
    icon={<Settings className="w-full h-full" />}
    title="Configuration requise"
    description="Cette fonctionnalité nécessite une configuration préalable."
    action={
      onConfigure
        ? {
            label: 'Configurer',
            onClick: onConfigure,
          }
        : undefined
    }
    variant="illustrated"
  />
);

export default EmptyState;
