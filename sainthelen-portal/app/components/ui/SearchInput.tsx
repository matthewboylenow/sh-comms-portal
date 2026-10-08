// app/components/ui/SearchInput.tsx
'use client';

import { useEffect, useRef } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
  hotkey = '/',
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** Pressing this key anywhere on the page focuses the box */
  hotkey?: string | null;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (e.key === hotkey && tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [hotkey]);

  return (
    <label
      className={`flex h-[30px] min-w-[200px] items-center gap-1.5 rounded border border-line-2 bg-surface px-2.5 text-ink-3 focus-within:border-navy ${className}`}
    >
      <MagnifyingGlassIcon className="h-3.5 w-3.5 flex-none" />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full border-0 bg-transparent p-0 text-base text-ink outline-none placeholder:text-ink-3"
      />
      {hotkey && !value && (
        <kbd className="rounded-sm border border-line-2 px-1 text-[11px] font-medium leading-4 text-ink-3">{hotkey}</kbd>
      )}
    </label>
  );
}
