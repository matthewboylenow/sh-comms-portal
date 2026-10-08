// app/components/ui/Mark.tsx
// The Saint Helen logo tile, redrawn as an SVG so it can sit in any colour.
// `bg` is the colour behind the tile (the cut-out corners and centre show it).

type MarkProps = {
  size?: number;
  className?: string;
  bg?: string;
};

export function Mark({ size = 24, className = '', bg = 'var(--surface)' }: MarkProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      style={{ color: 'currentColor', flex: 'none' }}
    >
      <rect x="2" y="2" width="96" height="96" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <rect x="8" y="8" width="84" height="84" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <clipPath id="sh-mark-clip">
        <rect x="11" y="11" width="78" height="78" />
      </clipPath>
      <g clipPath="url(#sh-mark-clip)">
        <rect x="11" y="11" width="78" height="78" fill="currentColor" />
        <g fill={bg}>
          <circle cx="11" cy="11" r="26" />
          <circle cx="89" cy="11" r="26" />
          <circle cx="11" cy="89" r="26" />
          <circle cx="89" cy="89" r="26" />
        </g>
        <g fill="currentColor">
          <rect x="17" y="17" width="8" height="8" />
          <rect x="75" y="17" width="8" height="8" />
          <rect x="17" y="75" width="8" height="8" />
          <rect x="75" y="75" width="8" height="8" />
        </g>
        <g stroke={bg} strokeWidth="1.6" strokeLinecap="round">
          <path d="M50 15v17M45 16l3 16M55 16l-3 16M50 68v17M45 84l3-16M55 84l-3-16M15 50h17M16 45l16 3M16 55l16-3M68 50h17M84 45l-16 3M84 55l-16-3" />
        </g>
        <rect x="37" y="37" width="26" height="26" fill={bg} />
        <rect x="40.5" y="40.5" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </g>
    </svg>
  );
}

/** The mark plus the wordmark, as it appears in the sidebar and top bar. */
export function Wordmark({ sub, markBg }: { sub?: string; markBg?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-ink">
      <Mark size={24} bg={markBg} />
      <span className="leading-none">
        <span className="block font-serif text-[17px]">Saint Helen</span>
        {sub && <span className="mt-0.5 block text-[11px] text-ink-3">{sub}</span>}
      </span>
    </span>
  );
}
