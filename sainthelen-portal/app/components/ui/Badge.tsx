// app/components/ui/Badge.tsx
// Older call sites (reports, ministries) still use this. It now draws the
// same tinted pill as StatusPill so the two never disagree on screen.
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
  size?: 'sm' | 'md';
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-surface-2 text-ink-2 border border-line',
  primary: 'bg-navy-soft text-navy',
  accent: 'bg-status-approval-bg text-status-approval-t',
  success: 'bg-status-approved-bg text-status-approved-t',
  warning: 'bg-status-review-bg text-status-review-t',
  danger: 'bg-status-approval-bg text-status-approval-t',
  info: 'bg-status-scheduled-bg text-status-scheduled-t',
};

export const Badge = ({ children, variant = 'default', className = '', size = 'md' }: BadgeProps) => {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-[5px] font-medium ${
        size === 'sm' ? 'h-5 px-1.5 text-[11.5px]' : 'h-[22px] px-2 text-xs'
      } ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
