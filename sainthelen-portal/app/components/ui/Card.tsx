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
        bg-white dark:bg-slate-800
        rounded-card border border-gray-200 dark:border-slate-700
        shadow-card overflow-hidden
        text-gray-900 dark:text-gray-100
        ${hover ? 'transition-all duration-300 ease-bouncy hover:-translate-y-1.5 hover:shadow-card-hover hover:border-gray-300 dark:hover:border-slate-600' : ''}
        ${gradient ? 'sh-card-gradient relative pt-1' : ''}
        ${className}
      `}
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
    <div className={`px-6 py-4 bg-sh-cream dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 ${className}`}>
      {children}
    </div>
  );
};
