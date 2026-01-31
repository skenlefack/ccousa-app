import React from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  variant?: 'default' | 'striped' | 'bordered';
  size?: 'sm' | 'md' | 'lg';
  stickyHeader?: boolean;
  className?: string;
}

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const sizePadding = {
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
  lg: 'px-6 py-4',
};

export function Table<T>({
  columns,
  data,
  keyExtractor,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
  isLoading,
  emptyMessage = 'Aucune donnée disponible',
  emptyIcon,
  variant = 'default',
  size = 'md',
  stickyHeader = false,
  className,
}: TableProps<T>) {
  const getValue = (item: T, key: string): unknown => {
    const keys = key.split('.');
    let value: unknown = item;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return undefined;
      }
    }
    return value;
  };

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-xl',
        'border border-dark-200 dark:border-dark-700',
        'bg-white dark:bg-dark-800',
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead
            className={cn(
              'bg-dark-50 dark:bg-dark-800/50',
              'border-b border-dark-200 dark:border-dark-700',
              stickyHeader && 'sticky top-0 z-10'
            )}
          >
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  style={{ width: col.width }}
                  className={cn(
                    sizePadding[size],
                    alignClasses[col.align || 'left'],
                    'text-xs font-semibold uppercase tracking-wider',
                    'text-dark-600 dark:text-dark-300',
                    col.sortable && 'cursor-pointer select-none hover:text-dark-900 dark:hover:text-white'
                  )}
                  onClick={() => col.sortable && onSort?.(String(col.key))}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="flex-shrink-0">
                        {sortBy === col.key ? (
                          sortOrder === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-4 h-4 opacity-50" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-16">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    <p className="text-sm text-dark-500">Chargement...</p>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16">
                  <div className="flex flex-col items-center justify-center gap-3">
                    {emptyIcon || (
                      <div className="p-4 rounded-full bg-dark-100 dark:bg-dark-700">
                        <svg
                          className="w-8 h-8 text-dark-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                      </div>
                    )}
                    <p className="text-sm text-dark-500 dark:text-dark-400">
                      {emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <motion.tr
                  key={keyExtractor(item)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    'transition-colors duration-150',
                    onRowClick && 'cursor-pointer',
                    variant === 'striped' &&
                      index % 2 === 1 &&
                      'bg-dark-50/50 dark:bg-dark-700/30',
                    'hover:bg-primary-50/50 dark:hover:bg-primary-900/10'
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => {
                    const value = getValue(item, String(col.key));
                    return (
                      <td
                        key={String(col.key)}
                        className={cn(
                          sizePadding[size],
                          alignClasses[col.align || 'left'],
                          'text-sm text-dark-700 dark:text-dark-200'
                        )}
                      >
                        {col.render
                          ? col.render(value, item, index)
                          : String(value ?? '-')}
                      </td>
                    );
                  })}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Table Actions Cell helper
export interface TableActionsProps {
  children: React.ReactNode;
}

export const TableActions: React.FC<TableActionsProps> = ({ children }) => {
  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  );
};

export default Table;
