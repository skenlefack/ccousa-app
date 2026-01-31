import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button, IconButton } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  totalItems?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showPageSize?: boolean;
  showTotal?: boolean;
  showFirstLast?: boolean;
  siblingCount?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 10,
  totalItems,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSize = true,
  showTotal = true,
  showFirstLast = true,
  siblingCount = 1,
  size = 'md',
  className,
}) => {
  // Generate page numbers to display
  const generatePages = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const totalNumbers = siblingCount * 2 + 3; // siblings + first + last + current
    const totalBlocks = totalNumbers + 2; // + 2 ellipsis

    if (totalPages <= totalBlocks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftEllipsis = leftSiblingIndex > 2;
    const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1;

    if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
      const leftItemCount = 3 + 2 * siblingCount;
      for (let i = 1; i <= leftItemCount; i++) {
        pages.push(i);
      }
      pages.push('ellipsis');
      pages.push(totalPages);
    } else if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
      pages.push(1);
      pages.push('ellipsis');
      const rightItemCount = 3 + 2 * siblingCount;
      for (let i = totalPages - rightItemCount + 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (shouldShowLeftEllipsis && shouldShowRightEllipsis) {
      pages.push(1);
      pages.push('ellipsis');
      for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
        pages.push(i);
      }
      pages.push('ellipsis');
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = generatePages();

  const buttonSizes = {
    sm: 'h-7 min-w-[1.75rem] text-xs',
    md: 'h-9 min-w-[2.25rem] text-sm',
    lg: 'h-11 min-w-[2.75rem] text-base',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4',
        className
      )}
    >
      {/* Left section: Total & Page size */}
      <div className="flex items-center gap-4">
        {showTotal && totalItems !== undefined && (
          <span className="text-sm text-dark-500 dark:text-dark-400">
            Total: <span className="font-medium text-dark-700 dark:text-dark-200">{totalItems}</span> éléments
          </span>
        )}
        {showPageSize && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-dark-500 dark:text-dark-400">Afficher</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className={cn(
                'rounded-lg border border-dark-200 dark:border-dark-600',
                'bg-white dark:bg-dark-800',
                'text-dark-700 dark:text-dark-200',
                'px-2 py-1 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/50'
              )}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="text-sm text-dark-500 dark:text-dark-400">par page</span>
          </div>
        )}
      </div>

      {/* Right section: Pagination controls */}
      <div className="flex items-center gap-1">
        {/* First page */}
        {showFirstLast && (
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className={cn(
              'flex items-center justify-center rounded-lg transition-colors',
              'text-dark-500 dark:text-dark-400',
              'hover:bg-dark-100 dark:hover:bg-dark-700',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
              buttonSizes[size]
            )}
            aria-label="Première page"
          >
            <ChevronsLeft className={iconSizes[size]} />
          </button>
        )}

        {/* Previous page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            'flex items-center justify-center rounded-lg transition-colors',
            'text-dark-500 dark:text-dark-400',
            'hover:bg-dark-100 dark:hover:bg-dark-700',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
            buttonSizes[size]
          )}
          aria-label="Page précédente"
        >
          <ChevronLeft className={iconSizes[size]} />
        </button>

        {/* Page numbers */}
        {pages.map((page, idx) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${idx}`}
              className={cn(
                'flex items-center justify-center text-dark-400',
                buttonSizes[size]
              )}
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                'flex items-center justify-center rounded-lg font-medium transition-all duration-200',
                buttonSizes[size],
                currentPage === page
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'text-dark-600 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700'
              )}
            >
              {page}
            </button>
          )
        )}

        {/* Next page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            'flex items-center justify-center rounded-lg transition-colors',
            'text-dark-500 dark:text-dark-400',
            'hover:bg-dark-100 dark:hover:bg-dark-700',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
            buttonSizes[size]
          )}
          aria-label="Page suivante"
        >
          <ChevronRight className={iconSizes[size]} />
        </button>

        {/* Last page */}
        {showFirstLast && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={cn(
              'flex items-center justify-center rounded-lg transition-colors',
              'text-dark-500 dark:text-dark-400',
              'hover:bg-dark-100 dark:hover:bg-dark-700',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
              buttonSizes[size]
            )}
            aria-label="Dernière page"
          >
            <ChevronsRight className={iconSizes[size]} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Pagination;
