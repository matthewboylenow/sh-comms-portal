// app/components/ui/Tag.tsx
// Low-priority metadata (a category, an attached-file count). Never status;
// status is StatusPill.

export function Tag({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'warn';
  className?: string;
}) {
  const cls =
    tone === 'warn'
      ? 'bg-status-approval-bg text-status-approval-t border-transparent'
      : 'bg-surface-2 text-ink-2 border-line';
  return (
    <span className={`inline-flex h-5 items-center whitespace-nowrap rounded-sm border px-[7px] text-[11.5px] font-medium ${cls} ${className}`}>
      {children}
    </span>
  );
}

/** Platform letters: B(ulletin) E(mail) S(creens). */
export function Platforms({ platforms }: { platforms: string[] | null | undefined }) {
  if (!platforms || !platforms.length) return null;
  const has = (k: string) => platforms.some((p) => p.toLowerCase().includes(k));
  const cells: Array<[string, boolean, string]> = [
    ['B', has('bulletin'), 'Bulletin'],
    ['E', has('email'), 'Email blast'],
    ['S', has('screen'), 'Church screens'],
  ];
  return (
    <span className="inline-flex gap-[3px]" title={platforms.join(', ')}>
      {cells.map(([c, on, name]) => (
        <span
          key={c}
          aria-label={name + (on ? '' : ' (no)')}
          className={`inline-grid h-[18px] w-[18px] place-items-center rounded-sm border text-[10px] font-semibold ${
            on ? 'border-ink bg-ink text-surface' : 'border-line-2 text-ink-3'
          }`}
        >
          {c}
        </span>
      ))}
    </span>
  );
}
