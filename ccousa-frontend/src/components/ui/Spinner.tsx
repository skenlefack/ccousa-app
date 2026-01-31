import React from 'react';
import { cn } from '../../utils/cn';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'dark';
  className?: string;
}

const sizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const colors = {
  primary: 'border-primary-600 border-t-transparent',
  white: 'border-white border-t-transparent',
  dark: 'border-dark-600 border-t-transparent',
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
}) => {
  return (
    <div
      className={cn(
        'rounded-full border-2 animate-spin',
        sizes[size],
        colors[color],
        className
      )}
    />
  );
};

export default Spinner;
