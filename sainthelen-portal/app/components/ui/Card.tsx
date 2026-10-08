// app/components/ui/Card.tsx
// A white surface with a 1px border. Shadows are for floating layers only.
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** kept for older call sites; no longer draws anything */
  gradient?: boolean;
  hover?: boolean;
}

export const Card = ({ children, className = '', hover = false }: CardProps) => {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-line bg-surface text-ink ${
        hover ? 'hover:border-line-2' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return <div className={`border-b border-line px-5 py-3 ${className}`}>{children}</div>;
};

export const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return <h3 className={`text-md font-semibold text-ink ${className}`}>{children}</h3>;
};

export const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return <p className={`mt-0.5 text-sm text-ink-2 ${className}`}>{children}</p>;
};

export const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return <div className={`px-5 py-4 text-ink ${className}`}>{children}</div>;
};

export const CardFooter = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return <div className={`border-t border-line bg-surface-2 px-5 py-3 ${className}`}>{children}</div>;
};
