// app/components/ui/FrontCard.tsx
// Kept for pages not yet moved to FormCard. Same flat surface as Card.
import React from 'react';

interface FrontCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export const FrontCard = ({ children, className = '' }: FrontCardProps) => (
  <div className={`overflow-hidden rounded-lg border border-line bg-surface text-ink ${className}`}>{children}</div>
);

export const FrontCardHeader = ({ children, className = '' }: FrontCardProps) => (
  <div className={`border-b border-line px-5 py-4 sm:px-6 ${className}`}>{children}</div>
);

export const FrontCardTitle = ({ children, className = '' }: FrontCardProps) => (
  <h2 className={`text-xl font-semibold text-ink ${className}`}>{children}</h2>
);

export const FrontCardDescription = ({ children, className = '' }: FrontCardProps) => (
  <p className={`mt-0.5 text-sm text-ink-2 ${className}`}>{children}</p>
);

export const FrontCardContent = ({ children, className = '' }: FrontCardProps) => (
  <div className={`px-5 py-4 sm:px-6 ${className}`}>{children}</div>
);

export const FrontCardFooter = ({ children, className = '' }: FrontCardProps) => (
  <div className={`border-t border-line bg-surface-2 px-5 py-3 sm:px-6 ${className}`}>{children}</div>
);
