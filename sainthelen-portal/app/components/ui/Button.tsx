// app/components/ui/Button.tsx
import React from 'react';

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
}

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
}: ButtonProps) => {
  const baseStyles = `
    inline-flex items-center justify-center font-medium
    transition-all duration-200
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:pointer-events-none disabled:transform-none
  `;

  // High-contrast color combinations - text stays white on hover
  const variantStyles = {
    primary: `
      bg-sh-navy-700 text-white hover:text-white
      hover:bg-sh-navy-800 hover:shadow-lg
      focus-visible:ring-sh-navy-500
      active:bg-sh-navy-900
    `,
    accent: `
      bg-sh-rust-600 text-white hover:text-white
      hover:bg-sh-rust-700 hover:shadow-lg
      focus-visible:ring-sh-rust-500
      active:bg-sh-rust-800
    `,
    secondary: `
      bg-gray-100 text-gray-800 border border-gray-300
      hover:bg-gray-200 hover:border-gray-400 hover:text-gray-800
      focus-visible:ring-gray-400
      dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600 dark:hover:text-white
    `,
    outline: `
      border-2 border-sh-navy-600 text-sh-navy-700 bg-transparent
      hover:bg-sh-navy-50 hover:text-sh-navy-800 hover:border-sh-navy-700
      focus-visible:ring-sh-navy-500
      dark:border-sh-navy-400 dark:text-sh-navy-300 dark:hover:bg-sh-navy-900/30 dark:hover:text-sh-navy-200
    `,
    danger: `
      bg-red-600 text-white hover:text-white
      hover:bg-red-700 hover:shadow-lg
      focus-visible:ring-red-500
      active:bg-red-800
    `,
    success: `
      bg-emerald-600 text-white hover:text-white
      hover:bg-emerald-700 hover:shadow-lg
      focus-visible:ring-emerald-500
      active:bg-emerald-800
    `,
    ghost: `
      text-gray-700 bg-transparent
      hover:bg-gray-100 hover:text-gray-900
      focus-visible:ring-gray-400
      dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white
    `,
  };

  const sizeStyles = {
    sm: 'text-sm px-3 py-1.5 rounded-lg',
    md: 'text-sm px-4 py-2 rounded-lg',
    lg: 'text-base px-6 py-3 rounded-xl',
  };

  const radiusStyles = pill ? 'rounded-full' : '';

  return (
    <button
      type={type}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${radiusStyles}
        ${arrow ? 'group' : ''}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="mr-2 flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {arrow && (
        <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      )}
    </button>
  );
};
