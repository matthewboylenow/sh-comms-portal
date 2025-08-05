// app/components/ui/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden text-gray-900 dark:text-gray-100 transition-all duration-200 ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ 
  children, 
  className = '' 
}: CardProps) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
};

export const CardTitle = ({ 
  children, 
  className = '' 
}: CardProps) => {
  return (
    <h3 className={`text-xl font-bold text-gray-900 dark:text-white ${className}`}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ 
  children, 
  className = '' 
}: CardProps) => {
  return (
    <p className={`text-sm text-gray-600 dark:text-gray-300 ${className}`}>
      {children}
    </p>
  );
};

export const CardContent = ({ 
  children, 
  className = '' 
}: CardProps) => {
  return (
    <div className={`px-6 py-4 text-gray-900 dark:text-gray-100 ${className}`}>
      {children}
    </div>
  );
};

export const CardFooter = ({ 
  children, 
  className = '' 
}: CardProps) => {
  return (
    <div className={`px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
};