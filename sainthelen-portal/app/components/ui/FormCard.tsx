// app/components/ui/FormCard.tsx
// The volunteer-facing form shell: one white card, 640 wide, a header with the
// mark, section bands, and a footer that holds the submit button and the
// deadline that matters.

import React from 'react';
import { Mark } from './Mark';

export function FormCard({
  title,
  intro,
  children,
  footer,
  onSubmit,
  className = '',
}: {
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
}) {
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={`mx-auto my-6 w-full max-w-[640px] rounded-lg border border-line bg-surface shadow-card ${className}`}
    >
      <div className="flex items-center gap-3.5 border-b border-line px-5 py-[18px] sm:px-6">
        <Mark size={36} className="text-ink" />
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">{title}</h1>
          {intro && <p className="mt-0.5 text-sm text-ink-2">{intro}</p>}
        </div>
      </div>
      {children}
      {footer && (
        <div className="flex flex-wrap items-center gap-2.5 border-t border-line px-5 py-4 sm:px-6">{footer}</div>
      )}
    </form>
  );
}

/** The padded area between two bands. */
export function FormSection({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-1.5 sm:px-6">{children}</div>;
}

/** Right-aligned note in the footer, for the deadline. */
export function FooterNote({ children }: { children: React.ReactNode }) {
  return <span className="ml-auto text-sm text-ink-3">{children}</span>;
}
