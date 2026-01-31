import React from 'react';
import { Switch } from '@headlessui/react';
import { cn } from '../../utils/cn';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success';
  className?: string;
}

const sizes = {
  sm: {
    toggle: 'h-5 w-9',
    dot: 'h-3.5 w-3.5',
    translateOn: 'translate-x-4',
    translateOff: 'translate-x-0.5',
  },
  md: {
    toggle: 'h-6 w-11',
    dot: 'h-4 w-4',
    translateOn: 'translate-x-5',
    translateOff: 'translate-x-0.5',
  },
  lg: {
    toggle: 'h-7 w-14',
    dot: 'h-5 w-5',
    translateOn: 'translate-x-7',
    translateOff: 'translate-x-0.5',
  },
};

const variants = {
  default: 'bg-primary-500',
  primary: 'bg-primary-500',
  success: 'bg-emerald-500',
};

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  variant = 'primary',
  className,
}) => {
  const sizeConfig = sizes[size];

  return (
    <Switch.Group>
      <div className={cn('flex items-center gap-3', className)}>
        <Switch
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            'relative inline-flex shrink-0 cursor-pointer rounded-full',
            'border-2 border-transparent transition-colors duration-200 ease-in-out',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            sizeConfig.toggle,
            checked
              ? variants[variant]
              : 'bg-dark-200 dark:bg-dark-600'
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none inline-block rounded-full',
              'bg-white shadow-lg shadow-dark-900/10',
              'ring-0 transition-transform duration-200 ease-in-out',
              sizeConfig.dot,
              checked ? sizeConfig.translateOn : sizeConfig.translateOff
            )}
          />
        </Switch>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <Switch.Label
                className={cn(
                  'text-sm font-medium text-dark-700 dark:text-dark-200',
                  disabled && 'opacity-50'
                )}
              >
                {label}
              </Switch.Label>
            )}
            {description && (
              <Switch.Description
                className={cn(
                  'text-xs text-dark-500 dark:text-dark-400',
                  disabled && 'opacity-50'
                )}
              >
                {description}
              </Switch.Description>
            )}
          </div>
        )}
      </div>
    </Switch.Group>
  );
};

// Checkbox component
export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  indeterminate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const checkboxSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  indeterminate = false,
  size = 'md',
  className,
}) => {
  return (
    <label
      className={cn(
        'inline-flex items-start gap-3 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="relative flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          ref={(el) => {
            if (el) {
              el.indeterminate = indeterminate;
            }
          }}
          className={cn(
            'appearance-none rounded-md border-2 transition-all duration-200',
            'border-dark-300 dark:border-dark-600',
            'bg-white dark:bg-dark-800',
            'checked:bg-primary-500 checked:border-primary-500',
            'indeterminate:bg-primary-500 indeterminate:border-primary-500',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2',
            'disabled:cursor-not-allowed',
            checkboxSizes[size]
          )}
        />
        <svg
          className={cn(
            'absolute pointer-events-none text-white transition-opacity duration-200',
            checkboxSizes[size],
            checked && !indeterminate ? 'opacity-100' : 'opacity-0'
          )}
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M4 8L7 11L12 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <svg
          className={cn(
            'absolute pointer-events-none text-white transition-opacity duration-200',
            checkboxSizes[size],
            indeterminate ? 'opacity-100' : 'opacity-0'
          )}
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M4 8H12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {(label || description) && (
        <div className="flex flex-col pt-0.5">
          {label && (
            <span className="text-sm font-medium text-dark-700 dark:text-dark-200">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-dark-500 dark:text-dark-400">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
};

// Radio component
export interface RadioProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  name: string;
  value: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Radio: React.FC<RadioProps> = ({
  checked,
  onChange,
  name,
  value,
  label,
  description,
  disabled = false,
  size = 'md',
  className,
}) => {
  return (
    <label
      className={cn(
        'inline-flex items-start gap-3 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="relative flex items-center">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={() => onChange(true)}
          disabled={disabled}
          className={cn(
            'appearance-none rounded-full border-2 transition-all duration-200',
            'border-dark-300 dark:border-dark-600',
            'bg-white dark:bg-dark-800',
            'checked:border-primary-500',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2',
            'disabled:cursor-not-allowed',
            checkboxSizes[size]
          )}
        />
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center pointer-events-none',
            'transition-transform duration-200',
            checked ? 'scale-100' : 'scale-0'
          )}
        >
          <div
            className={cn(
              'rounded-full bg-primary-500',
              size === 'sm' && 'w-2 h-2',
              size === 'md' && 'w-2.5 h-2.5',
              size === 'lg' && 'w-3 h-3'
            )}
          />
        </div>
      </div>
      {(label || description) && (
        <div className="flex flex-col pt-0.5">
          {label && (
            <span className="text-sm font-medium text-dark-700 dark:text-dark-200">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-dark-500 dark:text-dark-400">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
};

export default Toggle;
