// app/components/ui/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden text-gray-900 dark:text-gray-100 ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ 
  children, 
  className = '' 
}: CardProps) => {
  return (
    <div className={`px-5 py-4 border-b border-gray-100 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
};

export const CardTitle = ({ 
  children, 
  className = '' 
}: CardProps) => {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ 
  children, 
  className = '' 
}: CardProps) => {
  return (
    <p className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
      {children}
    </p>
  );
};

export const CardContent = ({ 
  children, 
  className = '' 
}: CardProps) => {
  return (
    <div className={`px-5 py-4 text-gray-900 dark:text-gray-100 ${className}`}>
      {children}
    </div>
  );
};

export const CardFooter = ({ 
  children, 
  className = '' 
}: CardProps) => {
  return (
    <div className={`px-5 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
};