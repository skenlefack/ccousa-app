import React from 'react';
import { Tab } from '@headlessui/react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export interface TabItem {
  key?: string;
  id?: string; // Alias for key for compatibility
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  disabled?: boolean;
  content?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultIndex?: number;
  selectedIndex?: number;
  onChange?: (index: number) => void;
  variant?: 'default' | 'pills' | 'underline' | 'bordered';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

const sizes = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-5 py-2.5',
};

export const Tabs: React.FC<TabsProps> = ({
  items,
  defaultIndex = 0,
  selectedIndex,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className,
}) => {
  return (
    <Tab.Group
      defaultIndex={defaultIndex}
      selectedIndex={selectedIndex}
      onChange={onChange}
    >
      <Tab.List
        className={cn(
          'flex gap-1',
          variant === 'default' && 'bg-dark-100 dark:bg-dark-700 p-1 rounded-xl',
          variant === 'pills' && 'gap-2',
          variant === 'underline' && 'border-b border-dark-200 dark:border-dark-700 gap-0',
          variant === 'bordered' && 'border border-dark-200 dark:border-dark-700 rounded-xl p-1',
          fullWidth && 'w-full',
          className
        )}
      >
        {items.map((item) => (
          <Tab
            key={item.key}
            disabled={item.disabled}
            className={({ selected }) =>
              cn(
                'relative flex items-center justify-center gap-2 font-medium outline-none',
                'transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                sizes[size],
                fullWidth && 'flex-1',
                // Variants
                variant === 'default' && [
                  'rounded-lg',
                  selected
                    ? 'bg-white dark:bg-dark-800 text-dark-900 dark:text-white shadow-sm'
                    : 'text-dark-600 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white',
                ],
                variant === 'pills' && [
                  'rounded-full',
                  selected
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                    : 'text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-700',
                ],
                variant === 'underline' && [
                  'border-b-2 -mb-px',
                  selected
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-dark-600 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white hover:border-dark-300',
                ],
                variant === 'bordered' && [
                  'rounded-lg',
                  selected
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                    : 'text-dark-600 dark:text-dark-400 hover:bg-dark-50 dark:hover:bg-dark-600',
                ]
              )
            }
          >
            {item.icon && <span className="w-4 h-4">{item.icon}</span>}
            {item.label}
            {item.badge !== undefined && item.badge > 0 && (
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-medium rounded-full',
                  'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                )}
              >
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels className="mt-4">
        {items.map((item) => (
          <Tab.Panel
            key={item.key}
            className="outline-none focus:ring-2 focus:ring-primary-500/20 rounded-xl"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {item.content}
            </motion.div>
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
};

// Simple Tab List without Tab.Group (for custom implementations)
export interface TabListProps {
  tabs: Array<{
    key: string;
    label: string;
    icon?: React.ReactNode;
    badge?: number;
    disabled?: boolean;
  }>;
  activeTab: string;
  onTabChange: (key: string) => void;
  variant?: 'default' | 'pills' | 'underline' | 'bordered';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export const TabList: React.FC<TabListProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex gap-1',
        variant === 'default' && 'bg-dark-100 dark:bg-dark-700 p-1 rounded-xl',
        variant === 'pills' && 'gap-2',
        variant === 'underline' && 'border-b border-dark-200 dark:border-dark-700 gap-0',
        variant === 'bordered' && 'border border-dark-200 dark:border-dark-700 rounded-xl p-1',
        fullWidth && 'w-full',
        className
      )}
    >
      {tabs.map((tab) => {
        const selected = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            onClick={() => !tab.disabled && onTabChange(tab.key)}
            disabled={tab.disabled}
            className={cn(
              'relative flex items-center justify-center gap-2 font-medium outline-none',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              sizes[size],
              fullWidth && 'flex-1',
              variant === 'default' && [
                'rounded-lg',
                selected
                  ? 'bg-white dark:bg-dark-800 text-dark-900 dark:text-white shadow-sm'
                  : 'text-dark-600 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white',
              ],
              variant === 'pills' && [
                'rounded-full',
                selected
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-700',
              ],
              variant === 'underline' && [
                'border-b-2 -mb-px',
                selected
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-dark-600 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white',
              ],
              variant === 'bordered' && [
                'rounded-lg',
                selected
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-dark-600 dark:text-dark-400 hover:bg-dark-50 dark:hover:bg-dark-600',
              ]
            )}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-medium rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
