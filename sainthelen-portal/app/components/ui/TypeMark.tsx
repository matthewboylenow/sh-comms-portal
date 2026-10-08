// app/components/ui/TypeMark.tsx
// A small coloured square and the request type's name. The square alone is
// the marker in the sidebar and on list rows.

import { REQUEST_TYPES, type RequestType } from '../../lib/requests';

const square: Record<RequestType, string> = {
  announcement: 'bg-type-ann',
  website: 'bg-type-web',
  text: 'bg-type-text',
  av: 'bg-type-av',
  design: 'bg-type-design',
  photo: 'bg-type-photo',
};

export function TypeSquare({ type, className = '' }: { type: RequestType; className?: string }) {
  return <i className={`inline-block h-[9px] w-[9px] flex-none rounded-[2px] ${square[type]} ${className}`} aria-hidden="true" />;
}

export function TypeMark({ type, className = '' }: { type: RequestType; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-ink-2 ${className}`}>
      <TypeSquare type={type} />
      {REQUEST_TYPES[type].label}
    </span>
  );
}
