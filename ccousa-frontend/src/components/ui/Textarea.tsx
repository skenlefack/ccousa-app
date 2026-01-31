import React, { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: boolean;
  variant?: 'default' | 'filled' | 'glass';
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  showCount?: boolean;
  maxLength?: number;
}

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

const resizeClasses = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize',
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      variant = 'default',
      resize = 'vertical',
      showCount,
      maxLength,
      className,
      disabled,
      value,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const charCount = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full space-y-1.5">
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-dark-700 dark:text-dark-200">
            {label}
          </label>
        )}

        {/* Textarea wrapper */}
        <div className="relative">
          <textarea
            ref={ref}
            disabled={disabled}
            value={value}
            rows={rows}
            maxLength={maxLength}
            className={cn(
              // Base
              'w-full rounded-xl outline-none transition-all duration-200',
              'placeholder:text-dark-400 dark:placeholder:text-dark-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'py-3 px-4 text-sm',
              // Variant
              variants[variant],
              // Resize
              resizeClasses[resize],
              // Error state
              error && 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20',
              // Success state
              success && 'border-emerald-500 dark:border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20',
              className
            )}
            {...props}
          />

          {/* Status icons */}
          <div className="absolute right-3 top-3">
            {error && <AlertCircle className="w-5 h-5 text-red-500" />}
            {success && !error && <CheckCircle className="w-5 h-5 text-emerald-500" />}
          </div>
        </div>

        {/* Footer: Helper text / Error / Character count */}
        <div className="flex items-center justify-between gap-2">
          <AnimatePresence mode="wait">
            {(error || helperText) && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className={cn(
                  'text-xs flex-1',
                  error ? 'text-red-500' : 'text-dark-500 dark:text-dark-400'
                )}
              >
                {error || helperText}
              </motion.p>
            )}
          </AnimatePresence>

          {showCount && maxLength && (
            <span
              className={cn(
                'text-xs',
                charCount >= maxLength
                  ? 'text-red-500'
                  : 'text-dark-400 dark:text-dark-500'
              )}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
