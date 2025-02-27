// app/components/ui/FrontCard.tsx
import React from 'react';

interface FrontCardProps {
  children: React.ReactNode;
  className?: string;
}

export const FrontCard = ({ children, className = '' }: FrontCardProps) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden text-gray-900 dark:text-gray-100 ${className}`}>
      {children}
    </div>
  );
};

export const FrontCardHeader = ({ 
  children, 
  className = '' 
}: FrontCardProps) => {
  return (
    <div className={`px-5 py-4 border-b border-gray-100 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
};

export const FrontCardTitle = ({ 
  children, 
  className = '' 
}: FrontCardProps) => {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}>
      {children}
    </h3>
  );
};

export const FrontCardContent = ({ 
  children, 
  className = '' 
}: FrontCardProps) => {
  return (
    <div className={`px-5 py-4 text-gray-900 dark:text-gray-100 ${className}`}>
      {children}
    </div>
  );
};

export const FrontCardFooter = ({ 
  children, 
  className = '' 
}: FrontCardProps) => {
  return (
    <div className={`px-5 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
};