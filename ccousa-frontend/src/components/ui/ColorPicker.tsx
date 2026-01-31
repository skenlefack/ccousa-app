import React, { useState, useRef, useEffect } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pipette, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  presetColors?: string[];
  showInput?: boolean;
  disabled?: boolean;
  className?: string;
}

const defaultPresets = [
  // Greens
  '#10b981', '#059669', '#047857', '#065f46',
  // Blues
  '#0ea5e9', '#0284c7', '#0369a1', '#075985',
  // Purples
  '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6',
  // Pinks
  '#ec4899', '#db2777', '#be185d', '#9d174d',
  // Reds
  '#ef4444', '#dc2626', '#b91c1c', '#991b1b',
  // Oranges
  '#f97316', '#ea580c', '#c2410c', '#9a3412',
  // Yellows
  '#eab308', '#ca8a04', '#a16207', '#854d0e',
  // Grays
  '#6b7280', '#4b5563', '#374151', '#1f2937',
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
  presetColors = defaultPresets,
  showInput = true,
  disabled = false,
  className,
}) => {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newValue)) {
      onChange(newValue);
    }
  };

  const handleInputBlur = () => {
    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(inputValue)) {
      setInputValue(value);
    }
  };

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-dark-700 dark:text-dark-200">
          {label}
        </label>
      )}

      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button
              disabled={disabled}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl',
                'bg-white dark:bg-dark-800',
                'border border-dark-200 dark:border-dark-600',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                open && 'ring-2 ring-primary-500/50 border-primary-500'
              )}
            >
              {/* Color preview */}
              <div
                className={cn(
                  'w-8 h-8 rounded-lg shadow-inner',
                  'border border-dark-200 dark:border-dark-600',
                  'transition-colors duration-200'
                )}
                style={{ backgroundColor: value }}
              />

              {/* Color value */}
              {showInput ? (
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    'flex-1 bg-transparent border-none outline-none',
                    'text-sm font-mono text-dark-700 dark:text-dark-200',
                    'placeholder:text-dark-400'
                  )}
                  placeholder="#000000"
                />
              ) : (
                <span className="flex-1 text-sm font-mono text-dark-700 dark:text-dark-200">
                  {value}
                </span>
              )}

              <Pipette className="w-4 h-4 text-dark-400" />
            </Popover.Button>

            <Transition
              as={React.Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel
                className={cn(
                  'absolute z-50 mt-2 w-64 p-4',
                  'bg-white dark:bg-dark-800',
                  'border border-dark-200 dark:border-dark-700',
                  'rounded-xl shadow-xl shadow-dark-900/10 dark:shadow-black/20'
                )}
              >
                {/* Native color picker */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-dark-500 dark:text-dark-400 mb-2">
                    Sélecteur de couleur
                  </label>
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                </div>

                {/* Preset colors */}
                <div>
                  <label className="block text-xs font-medium text-dark-500 dark:text-dark-400 mb-2">
                    Couleurs prédéfinies
                  </label>
                  <div className="grid grid-cols-8 gap-1.5">
                    {presetColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => onChange(color)}
                        className={cn(
                          'w-6 h-6 rounded-md transition-transform duration-150',
                          'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500/50',
                          'border border-dark-200 dark:border-dark-600',
                          value === color && 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-dark-800'
                        )}
                        style={{ backgroundColor: color }}
                        title={color}
                      >
                        {value === color && (
                          <Check className="w-4 h-4 mx-auto text-white drop-shadow" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  );
};

// Simple color swatch for display only
export interface ColorSwatchProps {
  color: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

const swatchSizes = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  color,
  size = 'md',
  showValue = false,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-md border border-dark-200 dark:border-dark-600',
          swatchSizes[size]
        )}
        style={{ backgroundColor: color }}
      />
      {showValue && (
        <span className="text-sm font-mono text-dark-600 dark:text-dark-300">
          {color}
        </span>
      )}
    </div>
  );
};

export default ColorPicker;
