// app/components/admin/RequestList.tsx
// The list view of requests: 44px rows in a white surface, grouped by status
// or by type. Shared by the Inbox, Approvals, Calendar drafts and Done.
'use client';

import { StatusPill } from '../ui/StatusPill';
import { TypeMark } from '../ui/TypeMark';
import { Avatar } from '../ui/Avatar';
import { Platforms, Tag } from '../ui/Tag';
import { REQUEST_TYPES, STATUS_LABEL, relativeTime, type PortalRequest, type RequestStatus, type RequestType } from '../../lib/requests';

export const STATUS_DOT: Record<RequestStatus, string> = {
  new: 'bg-status-review-d',
  review: 'bg-status-review-d',
  approval: 'bg-status-approval-d',
  approved: 'bg-status-approved-d',
  done: 'bg-status-done-d',
};

const TYPE_DOT: Record<RequestType, string> = {
  announcement: 'bg-type-ann',
  website: 'bg-type-web',
  text: 'bg-type-text',
  av: 'bg-type-av',
  design: 'bg-type-design',
  photo: 'bg-type-photo',
};

const GRID = 'grid-cols-[minmax(240px,2fr)_minmax(150px,1.2fr)_140px_90px_80px_70px]';

type Props = {
  items: PortalRequest[];
  selected: string | null;
  onSelect: (id: string) => void;
  groupBy?: 'status' | 'type' | 'none';
  /** Header label for the date column: "Runs" (default) or "Done" */
  dateLabel?: string;
  dateOf?: (r: PortalRequest) => string;
  /** Optional checkbox column for bulk actions */
  checked?: Set<string>;
  onToggle?: (id: string) => void;
};

export default function RequestList({ items, selected, onSelect, groupBy = 'status', dateLabel = 'Runs', dateOf, checked, onToggle }: Props) {
  const groups: Array<{ key: string; label: string; dot: string; items: PortalRequest[] }> = [];
  if (groupBy === 'status') {
    (['new', 'review', 'approval', 'approved', 'done'] as RequestStatus[]).forEach((s) => {
      const l = items.filter((r) => r.status === s);
      if (l.length) groups.push({ key: s, label: STATUS_LABEL[s], dot: STATUS_DOT[s], items: l });
    });
  } else if (groupBy === 'type') {
    (Object.keys(REQUEST_TYPES) as RequestType[]).forEach((t) => {
      const l = items.filter((r) => r.type === t);
      if (l.length) groups.push({ key: t, label: REQUEST_TYPES[t].plural, dot: TYPE_DOT[t], items: l });
    });
  } else {
    groups.push({ key: 'all', label: '', dot: '', items });
  }

  const grid = checked ? `grid-cols-[28px_minmax(240px,2fr)_minmax(150px,1.2fr)_140px_90px_80px_70px]` : GRID;

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="overflow-x-auto">
        <div className={checked ? 'min-w-[860px]' : 'min-w-[820px]'}>
          <div className={`grid ${grid} h-[34px] items-center gap-3 border-b border-line px-3 text-xs text-ink-3`}>
            {checked && <span />}
            <span>Request</span>
            <span>From</span>
            <span>Status</span>
            <span>{dateLabel}</span>
            <span className="text-right">Sent</span>
            <span />
          </div>
          {groups.map((g) => (
            <div key={g.key}>
              {g.label && (
                <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-3 py-2 text-[12.5px] font-semibold text-ink-2">
                  <i className={`h-2 w-2 rounded-full ${g.dot}`} />
                  {g.label}
                  <span className="font-medium text-ink-3">{g.items.length}</span>
                </div>
              )}
              {g.items.map((r) => (
                <div
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(r.id)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(r.id)}
                  className={`grid ${grid} h-11 w-full cursor-pointer items-center gap-3 border-b border-line px-3 text-left ${
                    selected === r.id ? 'bg-navy-soft' : 'hover:bg-surface-2'
                  }`}
                >
                  {checked && (
                    <input
                      type="checkbox"
                      checked={checked.has(r.id)}
                      onChange={() => onToggle?.(r.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${r.title}`}
                      className="h-[15px] w-[15px]"
                    />
                  )}
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 truncate text-[13.5px] font-semibold">
                      <span className="truncate">{r.title}</span>
                      {r.forMsgr && <Tag tone="flag">Msgr. Tom</Tag>}
                    </span>
                    <span className="block truncate text-xs text-ink-3">
                      <TypeMark type={r.type} />
                      {r.page ? ` · ${r.page}` : ''}
                      {r.ministry ? ` · ${r.ministry}` : ''}
                      {r.calendar !== 'none' ? ` · calendar ${r.calendar}` : ''}
                    </span>
                  </span>
                  <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-ink-2">
                    <Avatar name={r.requester} />
                    <span className="truncate">{r.requester}</span>
                  </span>
                  <span>
                    <StatusPill status={r.status} label={STATUS_LABEL[r.status]} />
                  </span>
                  <span className="tnum text-[12.5px] text-ink-2">{dateOf ? dateOf(r) : r.runsLabel}</span>
                  <span className="tnum text-right text-[12.5px] text-ink-2">{relativeTime(r.submittedAt)}</span>
                  <span>
                    <Platforms platforms={r.platforms} />
                  </span>
                </div>
              ))}
            </div>
          ))}
          {!items.length && <p className="px-3 py-8 text-center text-sm text-ink-3">Nothing here.</p>}
        </div>
      </div>
    </div>
  );
}
