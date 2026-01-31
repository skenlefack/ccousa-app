import React from 'react';
import { cn } from '../../utils/cn';

export interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  return (
    <div
      className={cn(
        'bg-dark-200 dark:bg-dark-700',
        variant === 'rectangular' && 'rounded-lg',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded h-4',
        animation === 'pulse' && 'animate-pulse',
        animation === 'wave' && 'animate-shimmer bg-gradient-to-r from-dark-200 via-dark-100 to-dark-200 dark:from-dark-700 dark:via-dark-600 dark:to-dark-700 bg-[length:200%_100%]',
        className
      )}
      style={{
        width: width,
        height: height,
      }}
    />
  );
};

// Skeleton text lines
export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn(
            'h-4',
            i === lines - 1 && 'w-3/4' // Last line shorter
          )}
        />
      ))}
    </div>
  );
};

// Skeleton card
export interface SkeletonCardProps {
  showImage?: boolean;
  showActions?: boolean;
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showImage = true,
  showActions = true,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-4 rounded-xl border border-dark-200 dark:border-dark-700',
        'bg-white dark:bg-dark-800',
        className
      )}
    >
      {showImage && (
        <Skeleton className="w-full h-40 mb-4" />
      )}
      <Skeleton className="h-6 w-3/4 mb-3" />
      <SkeletonText lines={2} />
      {showActions && (
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      )}
    </div>
  );
};

// Skeleton table row
export interface SkeletonTableRowProps {
  columns?: number;
  className?: string;
}

export const SkeletonTableRow: React.FC<SkeletonTableRowProps> = ({
  columns = 5,
  className,
}) => {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4" />
        </td>
      ))}
    </tr>
  );
};

// Skeleton avatar
export interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const avatarSizes = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  size = 'md',
  className,
}) => {
  return (
    <Skeleton
      variant="circular"
      className={cn(avatarSizes[size], className)}
    />
  );
};

// Skeleton list item
export interface SkeletonListItemProps {
  showAvatar?: boolean;
  showSecondaryText?: boolean;
  showAction?: boolean;
  className?: string;
}

export const SkeletonListItem: React.FC<SkeletonListItemProps> = ({
  showAvatar = true,
  showSecondaryText = true,
  showAction = false,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-3 p-3', className)}>
      {showAvatar && <SkeletonAvatar />}
      <div className="flex-1">
        <Skeleton className="h-4 w-1/2 mb-2" />
        {showSecondaryText && <Skeleton className="h-3 w-3/4" />}
      </div>
      {showAction && <Skeleton className="h-8 w-8 rounded-lg" />}
    </div>
  );
};

export default Skeleton;
