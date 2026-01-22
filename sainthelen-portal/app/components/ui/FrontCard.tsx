// app/components/ui/FrontCard.tsx
import React from 'react';

interface FrontCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export const FrontCard = ({ children, className = '', gradient = false }: FrontCardProps) => {
  return (
    <div
      className={`
        bg-white dark:bg-slate-800
        rounded-card-lg border border-gray-200 dark:border-slate-700
        shadow-card overflow-hidden
        text-gray-900 dark:text-gray-100
        transition-all duration-300 ease-bouncy
        hover:-translate-y-2 hover:shadow-card-hover hover:border-gray-300 dark:hover:border-slate-600
        ${gradient ? 'sh-card-gradient relative' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export const FrontCardHeader = ({
  children,
  className = ''
}: FrontCardProps) => {
  return (
    <div className={`px-6 py-5 border-b border-gray-100 dark:border-slate-700 ${className}`}>
      {children}
    </div>
  );
};

export const FrontCardTitle = ({
  children,
  className = ''
}: FrontCardProps) => {
  return (
    <h3 className={`text-xl font-bold text-sh-navy dark:text-white font-serif ${className}`}>
      {children}
    </h3>
  );
};

export const FrontCardContent = ({
  children,
  className = ''
}: FrontCardProps) => {
  return (
    <div className={`px-6 py-5 text-gray-700 dark:text-gray-200 ${className}`}>
      {children}
    </div>
  );
};

export const FrontCardFooter = ({
  children,
  className = ''
}: FrontCardProps) => {
  return (
    <div className={`px-6 py-4 bg-sh-cream dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 ${className}`}>
      {children}
    </div>
  );
};

// Icon card for homepage feature sections
export const IconCard = ({
  icon,
  title,
  description,
  className = ''
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}) => {
  return (
    <div
      className={`
        bg-white dark:bg-slate-800
        rounded-card-lg border border-gray-200 dark:border-slate-700
        p-6 text-center
        shadow-card
        transition-all duration-300 ease-bouncy
        hover:-translate-y-2 hover:shadow-card-hover
        ${className}
      `}
    >
      <div className="sh-icon-circle mx-auto mb-4 bg-sh-navy-50 dark:bg-sh-navy-900/30">
        <span className="text-sh-navy dark:text-sh-navy-300">{icon}</span>
      </div>
      <h3 className="text-lg font-bold text-sh-navy dark:text-white font-serif mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm">{description}</p>
    </div>
  );
};
