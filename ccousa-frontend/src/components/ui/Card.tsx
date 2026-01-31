import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

export interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'glass' | 'gradient' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  glow?: boolean;
}

const variants = {
  default: `
    bg-white dark:bg-dark-800
    border border-dark-200 dark:border-dark-700
    shadow-card
  `,
  glass: `
    bg-white/70 dark:bg-dark-800/70
    backdrop-blur-xl
    border border-white/20 dark:border-white/10
    shadow-glass
  `,
  gradient: `
    bg-gradient-to-br from-white via-white to-primary-50
    dark:from-dark-800 dark:via-dark-800 dark:to-primary-900/20
    border border-primary-100 dark:border-primary-800/30
    shadow-card
  `,
  bordered: `
    bg-white dark:bg-dark-800
    border-2 border-primary-200 dark:border-primary-700/50
    shadow-sm
  `,
  elevated: `
    bg-white dark:bg-dark-800
    border border-dark-100 dark:border-dark-700
    shadow-xl shadow-dark-900/5 dark:shadow-black/20
  `,
};

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hover = false,
      glow = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={
          hover
            ? {
                y: -4,
                transition: { duration: 0.2 },
              }
            : undefined
        }
        className={cn(
          'relative rounded-2xl overflow-hidden',
          'transition-all duration-300',
          variants[variant],
          paddings[padding],
          hover && 'cursor-pointer hover:shadow-card-hover',
          glow && 'hover:shadow-neon',
          className
        )}
        {...props}
      >
        {/* Subtle gradient overlay for glass variant */}
        {variant === 'glass' && (
          <div className="absolute inset-0 bg-glass-gradient pointer-events-none" />
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>

        {/* Glow effect */}
        {glow && (
          <div
            className={cn(
              'absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300',
              'bg-gradient-to-r from-primary-500/20 via-secondary-500/20 to-accent-500/20',
              'group-hover:opacity-100 blur-sm'
            )}
          />
        )}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

// Card Header
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4',
        'pb-4 mb-4 border-b border-dark-100 dark:border-dark-700',
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex-shrink-0 p-2 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
            {icon}
          </div>
        )}
        <div>
          {title && (
            <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-dark-500 dark:text-dark-400 mt-0.5">
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

// Card Body
export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardBody: React.FC<CardBodyProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
};

// Card Footer
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  justify?: 'start' | 'center' | 'end' | 'between';
}

export const CardFooter: React.FC<CardFooterProps> = ({
  justify = 'end',
  className,
  children,
  ...props
}) => {
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3',
        'pt-4 mt-4 border-t border-dark-100 dark:border-dark-700',
        justifyClasses[justify],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Stat Card - For dashboard statistics
export interface StatCardProps extends CardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  changeLabel,
  icon,
  iconColor = 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
  className,
  ...props
}) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card variant="glass" hover className={cn('group', className)} {...props}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-dark-500 dark:text-dark-400">
            {label}
          </p>
          <p className="text-3xl font-bold text-dark-900 dark:text-white">
            {value}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'text-sm font-medium',
                  isPositive && 'text-emerald-600 dark:text-emerald-400',
                  isNegative && 'text-red-600 dark:text-red-400',
                  !isPositive && !isNegative && 'text-dark-500'
                )}
              >
                {isPositive && '+'}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-dark-400 dark:text-dark-500">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              'p-3 rounded-xl transition-transform duration-300',
              'group-hover:scale-110 group-hover:rotate-3',
              iconColor
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default Card;
