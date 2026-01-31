import React, { Fragment, forwardRef } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronDown, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'glass';
  searchable?: boolean;
  clearable?: boolean;
  className?: string;
}

const sizes = {
  sm: 'h-9 text-sm',
  md: 'h-11 text-sm',
  lg: 'h-13 text-base',
};

const variants = {
  default: `
    bg-white dark:bg-dark-800
    border border-dark-200 dark:border-dark-600
  `,
  filled: `
    bg-dark-100 dark:bg-dark-700
    border border-transparent
  `,
  glass: `
    bg-white/50 dark:bg-white/5
    backdrop-blur-xl
    border border-white/20 dark:border-white/10
  `,
};

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Sélectionner...',
      label,
      helperText,
      error,
      disabled,
      size = 'md',
      variant = 'default',
      className,
    },
    ref
  ) => {
    const selectedOption = options.find((opt) => opt.value === value);

    return (
      <div ref={ref} className={cn('w-full space-y-1.5', className)}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-dark-700 dark:text-dark-200">
            {label}
          </label>
        )}

        <Listbox value={value} onChange={onChange} disabled={disabled}>
          {({ open }) => (
            <div className="relative">
              {/* Trigger */}
              <Listbox.Button
                className={cn(
                  'relative w-full rounded-xl outline-none transition-all duration-200',
                  'pl-4 pr-10 text-left cursor-pointer',
                  'focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  sizes[size],
                  variants[variant],
                  error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                  open && 'ring-2 ring-primary-500/20 border-primary-500'
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  {selectedOption?.icon && (
                    <span className="w-5 h-5 flex-shrink-0">
                      {selectedOption.icon}
                    </span>
                  )}
                  {selectedOption ? (
                    <span className="text-dark-900 dark:text-white">
                      {selectedOption.label}
                    </span>
                  ) : (
                    <span className="text-dark-400 dark:text-dark-500">
                      {placeholder}
                    </span>
                  )}
                </span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {error ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <ChevronDown
                      className={cn(
                        'w-5 h-5 text-dark-400 transition-transform duration-200',
                        open && 'rotate-180'
                      )}
                    />
                  )}
                </span>
              </Listbox.Button>

              {/* Options */}
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options
                  className={cn(
                    'absolute z-50 mt-2 w-full overflow-auto rounded-xl',
                    'bg-white dark:bg-dark-800',
                    'border border-dark-200 dark:border-dark-600',
                    'shadow-lg shadow-dark-900/10 dark:shadow-black/20',
                    'py-1 max-h-60',
                    'focus:outline-none'
                  )}
                >
                  {options.map((option) => (
                    <Listbox.Option
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      className={({ active, selected }) =>
                        cn(
                          'relative cursor-pointer select-none py-2.5 pl-10 pr-4',
                          'transition-colors duration-100',
                          active && 'bg-primary-50 dark:bg-primary-900/20',
                          selected && 'bg-primary-100 dark:bg-primary-900/30',
                          option.disabled && 'opacity-50 cursor-not-allowed'
                        )
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={cn(
                              'flex items-center gap-2',
                              selected ? 'font-medium' : 'font-normal'
                            )}
                          >
                            {option.icon && (
                              <span className="w-5 h-5 flex-shrink-0">
                                {option.icon}
                              </span>
                            )}
                            <span className="block truncate text-dark-900 dark:text-white">
                              {option.label}
                            </span>
                          </span>
                          {option.description && (
                            <span className="block text-xs text-dark-500 dark:text-dark-400 mt-0.5 ml-7">
                              {option.description}
                            </span>
                          )}
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600 dark:text-primary-400">
                              <Check className="w-5 h-5" />
                            </span>
                          )}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          )}
        </Listbox>

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

Select.displayName = 'Select';

// Multi Select
export interface MultiSelectProps extends Omit<SelectProps, 'value' | 'onChange'> {
  value?: string[];
  onChange?: (value: string[]) => void;
}

export const MultiSelect = forwardRef<HTMLDivElement, MultiSelectProps>(
  (
    {
      options,
      value = [],
      onChange,
      placeholder = 'Sélectionner...',
      label,
      helperText,
      error,
      disabled,
      size = 'md',
      variant = 'default',
      className,
    },
    ref
  ) => {
    const selectedOptions = options.filter((opt) => value.includes(opt.value));

    const toggleOption = (optValue: string) => {
      if (!onChange) return;
      if (value.includes(optValue)) {
        onChange(value.filter((v) => v !== optValue));
      } else {
        onChange([...value, optValue]);
      }
    };

    return (
      <div ref={ref} className={cn('w-full space-y-1.5', className)}>
        {label && (
          <label className="block text-sm font-medium text-dark-700 dark:text-dark-200">
            {label}
          </label>
        )}

        <Listbox value={value} onChange={() => {}} disabled={disabled} multiple>
          {({ open }) => (
            <div className="relative">
              <Listbox.Button
                className={cn(
                  'relative w-full rounded-xl outline-none transition-all duration-200',
                  'px-4 py-2 text-left cursor-pointer min-h-[44px]',
                  'focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  variants[variant],
                  error && 'border-red-500'
                )}
              >
                {selectedOptions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pr-8">
                    {selectedOptions.map((opt) => (
                      <span
                        key={opt.value}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs"
                      >
                        {opt.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-dark-400 dark:text-dark-500">
                    {placeholder}
                  </span>
                )}
                <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <ChevronDown
                    className={cn(
                      'w-5 h-5 text-dark-400 transition-transform',
                      open && 'rotate-180'
                    )}
                  />
                </span>
              </Listbox.Button>

              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options
                  className={cn(
                    'absolute z-50 mt-2 w-full overflow-auto rounded-xl',
                    'bg-white dark:bg-dark-800',
                    'border border-dark-200 dark:border-dark-600',
                    'shadow-lg py-1 max-h-60',
                    'focus:outline-none'
                  )}
                >
                  {options.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => toggleOption(option.value)}
                      className={cn(
                        'relative cursor-pointer select-none py-2.5 pl-10 pr-4',
                        'transition-colors duration-100',
                        'hover:bg-primary-50 dark:hover:bg-primary-900/20',
                        value.includes(option.value) &&
                          'bg-primary-100 dark:bg-primary-900/30'
                      )}
                    >
                      <span className="block truncate text-dark-900 dark:text-white">
                        {option.label}
                      </span>
                      {value.includes(option.value) && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                          <Check className="w-5 h-5" />
                        </span>
                      )}
                    </div>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          )}
        </Listbox>

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

MultiSelect.displayName = 'MultiSelect';

export default Select;
