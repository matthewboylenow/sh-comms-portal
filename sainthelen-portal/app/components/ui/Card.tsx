// app/components/ui/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
  hover?: boolean;
}

export const Card = ({ children, className = '', gradient = false, hover = false }: CardProps) => {
  return (
    <div
      className={`
        bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900/50
        rounded-2xl border border-gray-200/80 dark:border-slate-700/80
        overflow-hidden
        text-gray-900 dark:text-gray-100
        ${hover ? 'transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-gray-300/80 dark:hover:border-slate-600/80' : ''}
        ${gradient ? 'sh-card-gradient relative pt-1' : ''}
        ${className}
      `}
      style={{ boxShadow: '0 2px 8px -2px rgba(31, 52, 109, 0.06), 0 4px 16px -4px rgba(31, 52, 109, 0.04)' }}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  children,
  className = ''
}: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-100 dark:border-slate-700 ${className}`}>
      {children}
    </div>
  );
};

export const CardTitle = ({
  children,
  className = ''
}: { children: React.ReactNode; className?: string }) => {
  return (
    <h3 className={`text-xl font-bold text-sh-navy dark:text-white font-serif ${className}`}>
      {children}
    </h3>
  );
};

export const CardDescription = ({
  children,
  className = ''
}: { children: React.ReactNode; className?: string }) => {
  return (
    <p className={`text-sm text-gray-600 dark:text-gray-300 mt-1 ${className}`}>
      {children}
    </p>
  );
};

export const CardContent = ({
  children,
  className = ''
}: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`px-6 py-4 text-gray-700 dark:text-gray-200 ${className}`}>
      {children}
    </div>
  );
};

export const CardFooter = ({
  children,
  className = ''
}: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`px-6 py-4 bg-gradient-to-r from-gray-50/80 via-gray-50 to-gray-50/80 dark:from-slate-900/80 dark:via-slate-900 dark:to-slate-900/80 border-t border-gray-100/80 dark:border-slate-700/80 ${className}`}>
      {children}
    </div>
  );
};
