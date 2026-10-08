// app/components/ui/StatusPill.tsx
// One status encoding for the whole portal: a tinted pill, a dot, and a plain
// sentence-case word. Five states. The volunteer-facing pages use the same
// component, so "Being reviewed" means the same thing on both sides.

import type { RequestStatus } from '../../lib/requests';

const look: Record<RequestStatus, { cls: string; dot: string }> = {
  new: { cls: 'bg-status-review-bg text-status-review-t', dot: 'bg-status-review-d' },
  review: { cls: 'bg-status-review-bg text-status-review-t', dot: 'bg-status-review-d' },
  approval: { cls: 'bg-status-approval-bg text-status-approval-t', dot: 'bg-status-approval-d' },
  approved: { cls: 'bg-status-approved-bg text-status-approved-t', dot: 'bg-status-approved-d' },
  scheduled: { cls: 'bg-status-scheduled-bg text-status-scheduled-t', dot: 'bg-status-scheduled-d' },
  done: { cls: 'bg-status-done-bg text-status-done-t', dot: 'bg-status-done-d' },
};

export function StatusPill({
  status,
  label,
  className = '',
}: {
  status: RequestStatus;
  /** Override the word (the public side says "Being reviewed" where the office says "Needs review") */
  label: string;
  className?: string;
}) {
  const l = look[status];
  return (
    <span
      className={`inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-[5px] pl-[7px] pr-2 text-xs font-medium ${l.cls} ${className}`}
    >
      <i className={`h-[7px] w-[7px] flex-none rounded-full ${l.dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}
