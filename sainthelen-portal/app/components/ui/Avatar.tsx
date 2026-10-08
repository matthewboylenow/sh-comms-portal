// app/components/ui/Avatar.tsx
// Initials in a tinted circle. The tint comes from the name, so the same
// person always gets the same colour.

const palette = ['#1F346D', '#2E7DA8', '#3C8A4F', '#7A5AB8', '#C8402F', '#B07A2E', '#8A5A9C', '#5E8A3C', '#A2552A', '#2F6F8F'];

export function initialsOf(name: string): string {
  return name
    .replace(/\(.*?\)/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .filter((c) => /[A-Za-z]/.test(c))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function colorOf(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return palette[h % palette.length];
}

export function Avatar({
  name,
  size = 22,
  className = '',
}: {
  name: string;
  size?: 22 | 32;
  className?: string;
}) {
  const ini = initialsOf(name || '?') || '?';
  return (
    <span
      className={`inline-grid flex-none place-items-center rounded-full font-semibold text-white ${size === 32 ? 'h-8 w-8 text-xs' : 'h-[22px] w-[22px] text-[10px]'} ${className}`}
      style={{ background: colorOf(name || '?'), letterSpacing: '0.02em' }}
      title={name}
      aria-hidden="true"
    >
      {ini}
    </span>
  );
}
