import React, { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, CheckCircle, Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'glass';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
}

const sizes = {
  sm: 'h-9 text-sm px-3',
  md: 'h-11 text-sm px-4',
  lg: 'h-13 text-base px-5',
};

const labelSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const variants = {
  default: `
    bg-white dark:bg-dark-800
    border border-dark-200 dark:border-dark-600
    focus:border-primary-500 dark:focus:border-primary-500
    focus:ring-2 focus:ring-primary-500/20
  `,
  filled: `
    bg-dark-100 dark:bg-dark-700
    border border-transparent
    focus:bg-white dark:focus:bg-dark-800
    focus:border-primary-500 dark:focus:border-primary-500
    focus:ring-2 focus:ring-primary-500/20
  `,
  glass: `
    bg-white/50 dark:bg-white/5
    backdrop-blur-xl
    border border-white/20 dark:border-white/10
    focus:border-primary-400 dark:focus:border-primary-400
    focus:ring-2 focus:ring-primary-500/20
  `,
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      size = 'md',
      variant = 'default',
      leftIcon,
      rightIcon,
      clearable,
      onClear,
      type = 'text',
      className,
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
    const hasValue = value !== undefined && value !== '';

    return (
      <div className="w-full space-y-1.5">
        {/* Label */}
        {label && (
          <label
            className={cn(
              'block font-medium text-dark-700 dark:text-dark-200',
              labelSizes[size]
            )}
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2',
                'text-dark-400 dark:text-dark-500',
                iconSizes[size]
              )}
            >
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            value={value}
            className={cn(
              // Base
              'w-full rounded-xl outline-none transition-all duration-200',
              'placeholder:text-dark-400 dark:placeholder:text-dark-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              // Size
              sizes[size],
              // Variant
              variants[variant],
              // Error state
              error && 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20',
              // Success state
              success && 'border-emerald-500 dark:border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20',
              // Icon padding
              leftIcon && 'pl-10',
              (rightIcon || isPassword || (clearable && hasValue) || error || success) && 'pr-10',
              className
            )}
            {...props}
          />

          {/* Right side icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {/* Clear button */}
            {clearable && hasValue && !disabled && (
              <button
                type="button"
                onClick={onClear}
                className={cn(
                  'p-0.5 rounded-full text-dark-400 hover:text-dark-600',
                  'dark:text-dark-500 dark:hover:text-dark-300',
                  'transition-colors'
                )}
              >
                <X className={iconSizes[size]} />
              </button>
            )}

            {/* Password toggle */}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={cn(
                  'p-0.5 rounded-full text-dark-400 hover:text-dark-600',
                  'dark:text-dark-500 dark:hover:text-dark-300',
                  'transition-colors'
                )}
              >
                {showPassword ? (
                  <EyeOff className={iconSizes[size]} />
                ) : (
                  <Eye className={iconSizes[size]} />
                )}
              </button>
            )}

            {/* Status icons */}
            {error && !isPassword && (
              <AlertCircle className={cn(iconSizes[size], 'text-red-500')} />
            )}
            {success && !error && !isPassword && (
              <CheckCircle className={cn(iconSizes[size], 'text-emerald-500')} />
            )}

            {/* Custom right icon */}
            {rightIcon && !isPassword && !error && !success && (
              <span className={cn('text-dark-400 dark:text-dark-500', iconSizes[size])}>
                {rightIcon}
              </span>
            )}
          </div>
        </div>

        {/* Helper text / Error */}
        <AnimatePresence mode="wait">
          {(error || helperText) && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={cn(
                'text-xs',
                error ? 'text-red-500' : 'text-dark-500 dark:text-dark-400'
              )}
            >
              {error || helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';

// Search Input variant
export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  onSearch?: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, onClear, placeholder = 'Rechercher...', ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        placeholder={placeholder}
        leftIcon={<Search />}
        clearable
        onClear={onClear}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSearch) {
            onSearch((e.target as HTMLInputElement).value);
          }
        }}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

export default Input;
