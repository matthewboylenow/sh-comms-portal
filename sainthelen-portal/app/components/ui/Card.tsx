// app/components/ui/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => {
  return (
    <div className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/30 overflow-hidden text-gray-900 dark:text-gray-100 hover:shadow-soft-lg transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ 
  children, 
  className = '' 
}: CardProps) => {
  return (
    <div className={`px-6 py-5 border-b border-gray-100/50 dark:border-gray-700/50 ${className}`}>
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
    <div className={`px-6 py-5 text-gray-900 dark:text-gray-100 ${className}`}>
      {children}
    </div>
  );
};

export const CardFooter = ({ 
  children, 
  className = '' 
}: CardProps) => {
  return (
    <div className={`px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100/50 dark:border-gray-700/50 ${className}`}>
      {children}
    </div>
  );
};