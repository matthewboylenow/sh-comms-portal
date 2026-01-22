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
    inline-flex items-center justify-center font-semibold
    transition-all duration-200 ease-out
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:pointer-events-none disabled:transform-none
    active:scale-[0.98]
  `;

  // Premium button variants with subtle gradients
  const variantStyles = {
    primary: `
      bg-gradient-to-r from-sh-navy-600 to-sh-navy-700 text-white hover:text-white
      hover:from-sh-navy-700 hover:to-sh-navy-800 hover:shadow-lg hover:-translate-y-0.5
      focus-visible:ring-sh-navy-500
      active:from-sh-navy-800 active:to-sh-navy-900
    `,
    accent: `
      bg-gradient-to-r from-sh-rust-500 to-sh-rust-600 text-white hover:text-white
      hover:from-sh-rust-600 hover:to-sh-rust-700 hover:shadow-lg hover:-translate-y-0.5
      focus-visible:ring-sh-rust-500
      active:from-sh-rust-700 active:to-sh-rust-800
    `,
    secondary: `
      bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300/80
      hover:from-gray-200 hover:to-gray-300 hover:border-gray-400/80 hover:text-gray-900
      focus-visible:ring-gray-400
      dark:from-slate-700 dark:to-slate-800 dark:text-white dark:border-slate-600/80 dark:hover:from-slate-600 dark:hover:to-slate-700 dark:hover:text-white
    `,
    outline: `
      border-2 border-sh-navy-500 text-sh-navy-700 bg-transparent
      hover:bg-sh-navy-50 hover:text-sh-navy-800 hover:border-sh-navy-600 hover:-translate-y-0.5
      focus-visible:ring-sh-navy-500
      dark:border-sh-navy-400 dark:text-sh-navy-300 dark:hover:bg-sh-navy-900/30 dark:hover:text-sh-navy-200
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-red-600 text-white hover:text-white
      hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:-translate-y-0.5
      focus-visible:ring-red-500
      active:from-red-700 active:to-red-800
    `,
    success: `
      bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:text-white
      hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg hover:-translate-y-0.5
      focus-visible:ring-emerald-500
      active:from-emerald-700 active:to-emerald-800
    `,
    ghost: `
      text-gray-700 bg-transparent
      hover:bg-gray-100/80 hover:text-gray-900
      focus-visible:ring-gray-400
      dark:text-gray-300 dark:hover:bg-slate-700/80 dark:hover:text-white
    `,
  };

  const sizeStyles = {
    sm: 'text-sm px-3.5 py-1.5 rounded-lg',
    md: 'text-sm px-5 py-2.5 rounded-xl',
    lg: 'text-base px-7 py-3 rounded-xl',
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
