// app/components/ui/Button.tsx
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  icon?: React.ReactNode;
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
}: ButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variantStyles = {
    primary: 'bg-gradient-to-r from-sh-primary to-sh-primary-light hover:from-sh-primary-light hover:to-sh-primary text-white shadow-soft hover:shadow-soft-lg transform hover:-translate-y-0.5 transition-all duration-300',
    secondary: 'bg-gradient-to-r from-sh-sage to-sh-sage-dark hover:from-sh-sage-dark hover:to-sh-sage text-white shadow-soft hover:shadow-soft-lg transform hover:-translate-y-0.5 transition-all duration-300',
    outline: 'border-2 border-sh-primary/20 text-sh-primary hover:bg-sh-primary/5 hover:border-sh-primary/40 dark:border-sh-primary-light/30 dark:text-sh-primary-light dark:hover:bg-sh-primary-light/10 backdrop-blur-sm',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-soft hover:shadow-soft-lg transform hover:-translate-y-0.5 transition-all duration-300',
    success: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-soft hover:shadow-soft-lg transform hover:-translate-y-0.5 transition-all duration-300',
    glass: 'bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 text-gray-800 dark:text-white shadow-soft hover:shadow-soft-lg hover:bg-white/80 dark:hover:bg-gray-800/80'
  };
  
  const sizeStyles = {
    sm: 'text-sm px-4 py-2',
    md: 'text-base px-6 py-3',
    lg: 'text-lg px-8 py-4',
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};