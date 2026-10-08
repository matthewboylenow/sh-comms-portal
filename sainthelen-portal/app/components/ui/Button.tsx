// app/components/ui/Button.tsx
import React from 'react';

// Same props the old button took, so existing pages keep compiling. The look
// is the product one: 32px, 6px radius, one filled navy variant, flat
// otherwise. "accent" and "success" map onto primary/secondary; nothing in the
// UI needs a second filled colour.
interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  icon?: React.ReactNode;
  arrow?: boolean;
  pill?: boolean;
  title?: string;
  'aria-label'?: string;
}

const variantClass: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-navy text-on-navy hover:bg-navy-hover border-transparent',
  accent: 'bg-navy text-on-navy hover:bg-navy-hover border-transparent',
  success: 'bg-navy text-on-navy hover:bg-navy-hover border-transparent',
  secondary: 'bg-surface text-ink border-line-2 hover:bg-surface-2',
  outline: 'bg-surface text-ink border-line-2 hover:bg-surface-2',
  danger: 'bg-surface text-status-approval-t border-line-2 hover:bg-status-approval-bg',
  ghost: 'bg-transparent text-ink-2 border-transparent hover:bg-surface-2 hover:text-ink',
};

const sizeClass: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  md: 'h-8 px-3 text-sm gap-1.5',
  lg: 'h-10 px-4 text-base gap-2',
};

export const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  disabled = false,
  icon,
  arrow = false,
  pill = false,
  title,
  'aria-label': ariaLabel,
}: ButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className={[
        'inline-flex items-center justify-center whitespace-nowrap border font-medium',
        'disabled:opacity-50 disabled:pointer-events-none',
        pill ? 'rounded-full' : 'rounded',
        variantClass[variant],
        sizeClass[size],
        className,
      ].join(' ')}
    >
      {icon && <span className="inline-flex [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
      {children}
      {arrow && <span aria-hidden="true">→</span>}
    </button>
  );
};

export default Button;
