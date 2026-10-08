// app/components/ui/Field.tsx
// Form primitives: label above, optional help line, 40px controls, 6px radius.

import React from 'react';

export const inputClass =
  'block w-full h-10 rounded border border-line-2 bg-surface px-[11px] text-md text-ink placeholder:text-ink-3 ' +
  'focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/25 disabled:opacity-60';

export const textareaClass =
  'block w-full rounded border border-line-2 bg-surface px-[11px] py-[9px] text-md leading-relaxed text-ink placeholder:text-ink-3 ' +
  'focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/25 disabled:opacity-60 resize-y';

export function Field({
  label,
  htmlFor,
  required,
  help,
  error,
  children,
  className = '',
}: {
  label?: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  help?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`py-3 ${className}`}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-md font-medium text-ink">
          {label}
          {required && <span className="text-status-approval-d"> *</span>}
        </label>
      )}
      {help && <p className="-mt-0.5 mb-2 text-sm text-ink-3">{help}</p>}
      {children}
      {error && <p className="mt-1.5 text-sm font-medium text-status-approval-t">{error}</p>}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', ...props }, ref) {
    return <input ref={ref} className={`${inputClass} ${className}`} {...props} />;
  }
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = '', rows = 6, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={`${textareaClass} ${className}`} {...props} />;
  }
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = '', children, ...props }, ref) {
    return (
      <select ref={ref} className={`${inputClass} pr-8 ${className}`} {...props}>
        {children}
      </select>
    );
  }
);

export function Checkbox({
  label,
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label className={`flex items-center gap-2.5 py-1.5 text-md text-ink ${className}`}>
      <input type="checkbox" className="m-0 h-[17px] w-[17px] flex-none" {...props} />
      <span>{label}</span>
    </label>
  );
}

/** A tinted section heading inside a form card. */
export function Band({ children, note }: { children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div className="border-y border-line bg-surface-2 px-5 py-[7px] text-sm font-semibold text-ink-2 sm:px-6">
      {children}
      {note && <span className="font-normal text-ink-3"> · {note}</span>}
    </div>
  );
}

/** A notice inside a form or page: one left rule, tinted ground. */
export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warn' | 'error' | 'success';
  children: React.ReactNode;
}) {
  const cls = {
    info: 'border-status-scheduled-d bg-status-scheduled-bg text-status-scheduled-t',
    warn: 'border-status-review-d bg-status-review-bg text-status-review-t',
    error: 'border-status-approval-d bg-status-approval-bg text-status-approval-t',
    success: 'border-status-approved-d bg-status-approved-bg text-status-approved-t',
  }[tone];
  return <div className={`rounded-r border-l-[3px] px-3.5 py-2.5 text-sm ${cls}`}>{children}</div>;
}
