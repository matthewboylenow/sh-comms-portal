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
  const baseClasses = 'inline-flex items-center font-semibold rounded-full transition-all duration-200';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
  };

  // Premium badge variants with subtle gradients
  const variantClasses = {
    default: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 dark:from-slate-600 dark:to-slate-700 dark:text-gray-100 border border-gray-200/50 dark:border-slate-500/50',
    primary: 'bg-gradient-to-r from-sh-navy-600 to-sh-navy-700 text-white dark:from-sh-navy-500 dark:to-sh-navy-600 shadow-sm',
    accent: 'bg-gradient-to-r from-sh-rust-500 to-sh-rust-600 text-white dark:from-sh-rust-500 dark:to-sh-rust-600 shadow-sm',
    success: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm',
    warning: 'bg-gradient-to-r from-amber-400 to-amber-500 text-white dark:text-gray-900 shadow-sm',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm',
    info: 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-sm',
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};
