// app/components/ui/FileDrop.tsx
// The upload area every form shares: a dashed drop zone, the list of files
// already attached, and a remove control on each.
'use client';

import React, { useId, useRef, useState } from 'react';
import { PaperClipIcon, DocumentIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

export function FileDrop({
  files,
  onFiles,
  onRemove,
  accept = 'image/*,.heic,.heif,.pdf,application/pdf,.doc,.docx',
  multiple = true,
  disabled = false,
  hint = 'PDF, Word, or images',
  label = 'Add a file or drop it here',
}: {
  files: string[];
  onFiles: (files: File[]) => void;
  onRemove?: (index: number) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  hint?: string;
  label?: string;
}) {
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const pick = (list: FileList | null) => {
    if (!list || !list.length) return;
    onFiles(Array.from(list));
    if (ref.current) ref.current.value = '';
  };

  return (
    <div>
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!disabled) pick(e.dataTransfer.files);
        }}
        className={`flex min-h-[64px] cursor-pointer items-center justify-center gap-2 rounded border border-dashed px-3 py-3 text-sm ${
          over ? 'border-navy bg-navy-soft text-ink' : 'border-line-2 bg-surface-2 text-ink-2 hover:border-ink-3'
        } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
      >
        <PaperClipIcon className="h-4 w-4 flex-none" />
        <span>
          {label}
          <span className="text-ink-3"> · {hint}</span>
        </span>
        <input
          ref={ref}
          id={id}
          type="file"
          className="sr-only"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => pick(e.target.files)}
        />
      </label>

      {files.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {files.map((url, i) => {
            const name = decodeURIComponent(url.split('/').pop() || `File ${i + 1}`);
            const isImg = /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(name);
            return (
              <li key={url + i} className="flex items-center gap-2 rounded border border-line bg-surface px-2.5 py-1.5 text-sm">
                {isImg ? <PhotoIcon className="h-4 w-4 flex-none text-ink-3" /> : <DocumentIcon className="h-4 w-4 flex-none text-ink-3" />}
                <a href={url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate hover:underline">
                  {name}
                </a>
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(i)}
                    aria-label={`Remove ${name}`}
                    className="grid h-6 w-6 flex-none place-items-center rounded text-ink-3 hover:bg-surface-2 hover:text-ink"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** "Add another …" link-style button used under repeating rows. */
export function AddRow({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="mt-2 inline-flex h-7 items-center gap-1 text-sm font-medium text-navy hover:underline">
      <span aria-hidden="true">+</span> {children}
    </button>
  );
}

export function RemoveRow({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="h-10 flex-none px-2 text-sm text-ink-3 hover:text-status-approval-t">
      Remove
    </button>
  );
}
