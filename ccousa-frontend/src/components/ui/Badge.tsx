import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
}

const variants = {
  default: 'bg-dark-100 text-dark-700 dark:bg-dark-700 dark:text-dark-200',
  primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  secondary: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  outline: 'bg-transparent border border-dark-300 text-dark-600 dark:border-dark-600 dark:text-dark-300',
};

const dotColors = {
  default: 'bg-dark-500',
  primary: 'bg-primary-500',
  secondary: 'bg-secondary-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  outline: 'bg-dark-500',
};

const sizes = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

const iconSizes = {
  xs: 'w-2.5 h-2.5',
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  dot,
  pulse,
  icon,
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full whitespace-nowrap',
        'transition-colors duration-200',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span
              className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                dotColors[variant]
              )}
            />
          )}
          <span
            className={cn(
              'relative inline-flex rounded-full h-2 w-2',
              dotColors[variant]
            )}
          />
        </span>
      )}
      {icon && <span className={iconSizes[size]}>{icon}</span>}
      {children}
    </span>
  );
};

// Status Badge for common statuses
export interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'success' | 'error' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

const statusConfig = {
  active: { variant: 'success' as const, label: 'Actif' },
  inactive: { variant: 'default' as const, label: 'Inactif' },
  pending: { variant: 'warning' as const, label: 'En attente' },
  success: { variant: 'success' as const, label: 'Succès' },
  error: { variant: 'danger' as const, label: 'Erreur' },
  warning: { variant: 'warning' as const, label: 'Attention' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  showDot = true,
}) => {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} size={size} dot={showDot} pulse={status === 'pending'}>
      {config.label}
    </Badge>
  );
};

// Count Badge (for notification counts, etc.)
export interface CountBadgeProps {
  count: number;
  max?: number;
  variant?: 'primary' | 'danger' | 'default';
  size?: 'xs' | 'sm' | 'md';
}

export const CountBadge: React.FC<CountBadgeProps> = ({
  count,
  max = 99,
  variant = 'primary',
  size = 'sm',
}) => {
  const displayCount = count > max ? `${max}+` : count;

  if (count <= 0) return null;

  return (
    <Badge
      variant={variant}
      size={size}
      className={cn(
        'min-w-[1.25rem] justify-center',
        size === 'xs' && 'min-w-[1rem] px-1'
      )}
    >
      {displayCount}
    </Badge>
  );
};

export default Badge;
