import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'glass';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variants = {
  primary: `
    bg-gradient-to-r from-primary-500 to-primary-600
    hover:from-primary-600 hover:to-primary-700
    text-white shadow-lg shadow-primary-500/25
    hover:shadow-xl hover:shadow-primary-500/30
    border border-primary-400/20
  `,
  secondary: `
    bg-gradient-to-r from-secondary-500 to-secondary-600
    hover:from-secondary-600 hover:to-secondary-700
    text-white shadow-lg shadow-secondary-500/25
    hover:shadow-xl hover:shadow-secondary-500/30
    border border-secondary-400/20
  `,
  outline: `
    bg-transparent border-2 border-primary-500
    text-primary-600 dark:text-primary-400
    hover:bg-primary-50 dark:hover:bg-primary-900/20
    hover:border-primary-600
  `,
  ghost: `
    bg-transparent text-dark-600 dark:text-dark-300
    hover:bg-dark-100 dark:hover:bg-dark-800
    hover:text-dark-900 dark:hover:text-white
  `,
  danger: `
    bg-gradient-to-r from-red-500 to-red-600
    hover:from-red-600 hover:to-red-700
    text-white shadow-lg shadow-red-500/25
    hover:shadow-xl hover:shadow-red-500/30
    border border-red-400/20
  `,
  success: `
    bg-gradient-to-r from-emerald-500 to-emerald-600
    hover:from-emerald-600 hover:to-emerald-700
    text-white shadow-lg shadow-emerald-500/25
    hover:shadow-xl hover:shadow-emerald-500/30
    border border-emerald-400/20
  `,
  glass: `
    bg-white/10 dark:bg-white/5
    backdrop-blur-xl border border-white/20
    text-dark-800 dark:text-white
    hover:bg-white/20 dark:hover:bg-white/10
    shadow-glass hover:shadow-glass-lg
  `,
};

const sizes = {
  xs: 'px-2.5 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
  xl: 'px-6 py-3 text-lg gap-2.5',
};

const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isDisabled = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const disabled = isDisabled || isLoading;

    return (
      <motion.button
        ref={ref}
        whileHover={disabled ? undefined : { scale: 1.02 }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={cn(
          // Base styles
          'relative inline-flex items-center justify-center font-medium',
          'rounded-xl transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2',
          'dark:focus:ring-offset-dark-900',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
          // Variant
          variants[variant],
          // Size
          sizes[size],
          // Full width
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled}
        {...props}
      >
        {/* Shimmer effect on hover */}
        <span className="absolute inset-0 overflow-hidden rounded-xl">
          <span
            className={cn(
              'absolute inset-0 -translate-x-full',
              'bg-gradient-to-r from-transparent via-white/10 to-transparent',
              'group-hover:animate-shimmer'
            )}
          />
        </span>

        {/* Content */}
        <span className="relative flex items-center justify-center gap-inherit">
          {isLoading ? (
            <Loader2 className={cn('animate-spin', iconSizes[size])} />
          ) : (
            leftIcon && <span className={iconSizes[size]}>{leftIcon}</span>
          )}
          {children}
          {!isLoading && rightIcon && (
            <span className={iconSizes[size]}>{rightIcon}</span>
          )}
        </span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

// Icon Button variant
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'md', className, ...props }, ref) => {
    const iconButtonSizes = {
      xs: 'p-1',
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-2.5',
      xl: 'p-3',
    };

    return (
      <Button
        ref={ref}
        size={size}
        className={cn(iconButtonSizes[size], 'aspect-square', className)}
        {...props}
      >
        <span className={iconSizes[size]}>{icon}</span>
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default Button;
