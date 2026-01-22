// app/components/ui/Badge.tsx
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge = ({
  children,
  variant = 'default',
  className = '',
  size = 'md'
}: BadgeProps) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  // High-contrast badge variants
  const variantClasses = {
    default: 'bg-gray-200 text-gray-800 dark:bg-slate-600 dark:text-gray-100',
    primary: 'bg-sh-navy-600 text-white dark:bg-sh-navy-500 dark:text-white',
    accent: 'bg-sh-rust-600 text-white dark:bg-sh-rust-500 dark:text-white',
    success: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white',
    warning: 'bg-amber-500 text-white dark:bg-amber-400 dark:text-gray-900',
    danger: 'bg-red-600 text-white dark:bg-red-500 dark:text-white',
    info: 'bg-sky-600 text-white dark:bg-sky-500 dark:text-white',
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};
