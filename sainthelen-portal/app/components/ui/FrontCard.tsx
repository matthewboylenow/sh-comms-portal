// app/components/ui/FrontCard.tsx
import React from 'react';

interface FrontCardProps {
  children: React.ReactNode;
  className?: string;
}

export const FrontCard = ({ children, className = '' }: FrontCardProps) => {
  return (
    <div className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 dark:border-gray-700/30 overflow-hidden text-gray-900 dark:text-gray-100 hover:shadow-soft-lg transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
};

export const FrontCardHeader = ({ 
  children, 
  className = '' 
}: FrontCardProps) => {
  return (
    <div className={`px-6 py-5 border-b border-gray-100/50 dark:border-gray-700/50 ${className}`}>
      {children}
    </div>
  );
};

export const FrontCardTitle = ({ 
  children, 
  className = '' 
}: FrontCardProps) => {
  return (
    <h3 className={`text-xl font-bold text-gray-900 dark:text-white ${className}`}>
      {children}
    </h3>
  );
};

export const FrontCardContent = ({ 
  children, 
  className = '' 
}: FrontCardProps) => {
  return (
    <div className={`px-6 py-5 text-gray-900 dark:text-gray-100 ${className}`}>
      {children}
    </div>
  );
};

export const FrontCardFooter = ({ 
  children, 
  className = '' 
}: FrontCardProps) => {
  return (
    <div className={`px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100/50 dark:border-gray-700/50 ${className}`}>
      {children}
    </div>
  );
};