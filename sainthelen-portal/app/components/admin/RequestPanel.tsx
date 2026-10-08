// app/components/admin/RequestPanel.tsx
// The right-hand detail for one request: header with type, status and
// actions; tabs for details, the style check's suggested edit, and activity
// (comments). Actions call the routes the old cards already used.
'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon, ArrowTopRightOnSquareIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import { StatusPill } from '../ui/StatusPill';
import { TypeMark } from '../ui/TypeMark';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Tag, Platforms } from '../ui/Tag';
import { Notice } from '../ui/Field';
import CopyReviewPanel from './CopyReviewPanel';
import CommentsSection from './CommentsSection';
import { useRequests } from '../../context/RequestsContext';
import { usePermissions } from '../../hooks/usePermissions';
import { STATUS_LABEL, relativeTime, shortDate, type PortalRequest } from '../../lib/requests';

type Tab = 'details' | 'edit' | 'activity';

export default function RequestPanel({
  request: r,
  onClose,
  onChanged,
}: {
  request: PortalRequest;
  onClose: () => void;
  /** Called after a successful write, for pages that keep their own copy of the data */
  onChanged?: () => void;
}) {
  const [tab, setTab] = useState<Tab>('details');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const { patch, refresh } = useRequests();
  const { permissions } = usePermissions();

  useEffect(() => {
    setTab('details');
    setError(null);
    setRejecting(false);
    setReason('');
  }, [r.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function call(label: string, fn: () => Promise<void>) {
    setBusy(label);
    setError(null);
    try {
      await fn();
      onChanged?.();
    } catch (e: any) {
      setError(e?.message || 'That did not go through.');
      refresh();
    } finally {
      setBusy(null);
    }
  }

  const markCompleted = (completed: boolean) =>
    call(completed ? 'done' : 'reopen', async () => {
      patch(r.id, { Completed: completed });
      const res = await fetch('/api/admin/markCompleted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: r.table, recordId: r.id, completed }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Could not update (${res.status})`);
    });

  const approve = () =>
    call('approve', async () => {
      patch(r.id, { 'Approval Status': 'approved' });
      const res = await fetch('/api/admin/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId: r.id, action: 'approve' }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Could not approve');
    });

  const reject = () =>
    call('reject', async () => {
      patch(r.id, { 'Approval Status': 'rejected' });
      const res = await fetch('/api/admin/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId: r.id, action: 'reject', rejectionReason: reason.trim() }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Could not send that back');
      setRejecting(false);
    });

  const reviewCalendar = () =>
    call('calendar', async () => {
      const res = await fetch('/api/admin/calendar-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId: r.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) throw new Error(data.error || 'Could not open the calendar draft');
      window.open(`/calendar-review/${data.token}`, '_blank', 'noopener');
    });

  const setDesignStatus = (status: string) =>
    call('design', async () => {
      patch(r.id, { Status: status });
      const res = await fetch('/api/admin/updateDesignStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId: r.id, status }),
      });
      if (!res.ok) throw new Error('Could not update the design status');
    });

  const copyText = () => navigator.clipboard?.writeText(r.body).catch(() => {});

  const canApprove = permissions?.canAccessApprovals && r.type === 'announcement';
  const canCalendar = r.type === 'announcement' && r.calendar !== 'none';

  const actions = (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {r.status === 'approval' && canApprove && (
        <>
          <Button onClick={approve} disabled={!!busy}>
            {busy === 'approve' ? 'Approving…' : 'Approve'}
          </Button>
          <Button variant="danger" onClick={() => setRejecting((v) => !v)} disabled={!!busy}>
            Request changes
          </Button>
        </>
      )}
      {r.status !== 'done' && r.status !== 'approval' && (
        <Button onClick={() => markCompleted(true)} disabled={!!busy}>
          {busy === 'done' ? 'Saving…' : r.type === 'announcement' || r.type === 'text' ? 'Mark published' : 'Mark done'}
        </Button>
      )}
      {r.status === 'done' && (
        <Button variant="secondary" onClick={() => markCompleted(false)} disabled={!!busy}>
          {busy === 'reopen' ? 'Saving…' : 'Reopen'}
        </Button>
      )}
      {canCalendar && r.calendar !== 'published' && (
        <Button variant="secondary" onClick={reviewCalendar} disabled={!!busy}>
          {busy === 'calendar' ? 'Opening…' : 'Review calendar draft'}
        </Button>
      )}
      {r.wordpressEventUrl && (
        <a
          href={r.wordpressEventUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 items-center gap-1.5 rounded border border-line-2 bg-surface px-3 text-sm font-medium text-ink hover:bg-surface-2"
        >
          Calendar event <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
        </a>
      )}
      {r.body && (
        <Button variant="ghost" onClick={copyText}>
          Copy text
        </Button>
      )}
    </div>
  );

  return (
    <>
      <div className="border-b border-line px-4 pt-3.5">
        <div className="flex items-center gap-2">
          <TypeMark type={r.type} />
          <StatusPill status={r.status} label={STATUS_LABEL[r.status]} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto grid h-7 w-7 place-items-center rounded text-ink-3 hover:bg-surface-2"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        <h2 className="mb-0.5 mt-2 text-[17px] font-semibold leading-snug">{r.title}</h2>
        <p className="mb-2.5 text-[12.5px] text-ink-3">
          {r.requester}
          {r.ministry ? ` · ${r.ministry}` : ''} · sent {relativeTime(r.submittedAt)}
        </p>

        {actions}

        {rejecting && (
          <div className="mb-3 rounded border border-line bg-surface-2 p-3">
            <label className="mb-1 block text-sm font-medium">What needs to change?</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="block w-full rounded border border-line-2 bg-surface px-2.5 py-2 text-sm"
              placeholder="Goes to the submitter by email."
            />
            <div className="mt-2 flex gap-1.5">
              <Button size="sm" variant="danger" onClick={reject} disabled={!reason.trim() || !!busy}>
                {busy === 'reject' ? 'Sending…' : 'Send back'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-3">
            <Notice tone="error">{error}</Notice>
          </div>
        )}

        <div className="flex gap-0.5">
          {(['details', 'edit', 'activity'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`-mb-px h-8 border-b-2 px-2.5 text-[13px] font-medium ${
                tab === t ? 'border-ink text-ink' : 'border-transparent text-ink-2 hover:text-ink'
              }`}
            >
              {t === 'details' ? 'Details' : t === 'edit' ? 'Suggested edit' : 'Activity'}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-3.5 text-[13.5px]">
        {tab === 'details' && <Details r={r} onDesignStatus={setDesignStatus} />}
        {tab === 'edit' &&
          (r.type === 'announcement' || r.type === 'website' ? (
            <CopyReviewPanel type={r.type === 'announcement' ? 'announcement' : 'website_update'} sourceId={r.id} />
          ) : (
            <p className="text-ink-3">The style check runs on announcements and website updates.</p>
          ))}
        {tab === 'activity' && (
          <CommentsSection recordId={r.id} tableName={r.table} requesterEmail={r.email} requesterName={r.requester} />
        )}
      </div>
    </>
  );
}

function Details({ r, onDesignStatus }: { r: PortalRequest; onDesignStatus: (s: string) => void }) {
  const f = r.raw.fields;
  const rows: Array<[string, React.ReactNode]> = [];
  rows.push([
    'From',
    <span key="from" className="inline-flex items-center gap-1.5">
      <Avatar name={r.requester} /> {r.requester}
      {r.ministry && <span className="text-ink-3">· {r.ministry}</span>}
    </span>,
  ]);
  if (r.email) rows.push(['Email', <a key="e" href={`mailto:${r.email}`} className="text-navy hover:underline">{r.email}</a>]);
  if (r.runsOn)
    rows.push([
      r.type === 'text' ? 'Send on' : r.type === 'announcement' ? 'Runs' : 'Date',
      <span key="runs" className="inline-flex items-center gap-2">
        {r.runsLabel} {r.platforms.length > 0 && <Platforms platforms={r.platforms} />}
      </span>,
    ]);
  if (r.eventLabel) rows.push(['Event', r.eventLabel]);
  if (r.page) rows.push(['Page', r.page]);
  if (r.calendar !== 'none')
    rows.push([
      'Calendar',
      r.calendar === 'published' ? (
        <StatusPill status="done" label="Published" />
      ) : (
        <Tag>Requested · draft pending review</Tag>
      ),
    ]);
  if (r.requiresApproval)
    rows.push([
      'Approval',
      r.approvalStatus === 'approved'
        ? `Approved${f['Approved By'] ? ` by ${f['Approved By']}` : ''}${f['Approved At'] ? ` · ${shortDate(f['Approved At'])}` : ''}`
        : r.approvalStatus === 'rejected'
          ? `Sent back${f['Rejection Reason'] ? `: ${f['Rejection Reason']}` : ''}`
          : 'Waiting on the ministry coordinator',
    ]);
  if (r.type === 'design' && r.table === 'graphicDesign')
    rows.push([
      'Status',
      <select
        key="ds"
        value={String(f.Status || 'Pending')}
        onChange={(e) => onDesignStatus(e.target.value)}
        className="h-7 rounded border border-line-2 bg-surface px-1.5 text-sm"
      >
        {['Pending', 'In Design', 'Review', 'Completed'].map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>,
    ]);
  if (r.type === 'av') {
    if (f['Expected Attendees']) rows.push(['Attendees', String(f['Expected Attendees'])]);
    if (f['Needs Livestream']) rows.push(['Livestream', f['Needs Livestream'] === true || f['Needs Livestream'] === 'Yes' ? 'Yes' : 'No']);
  }
  if (r.table === 'graphicDesign') {
    if (f['Required Size/Dimensions']) rows.push(['Size', String(f['Required Size/Dimensions'])]);
    if (f['Target Audience']) rows.push(['Audience', String(f['Target Audience'])]);
  }
  const rel = relativeTime(r.submittedAt);
  rows.push(['Sent', rel === shortDate(r.submittedAt) ? rel : `${shortDate(r.submittedAt)} · ${rel}`]);

  const bodyLabel =
    r.type === 'website'
      ? 'Request'
      : r.type === 'text'
        ? `Text · ${r.chars} characters`
        : r.type === 'announcement'
          ? `Submitted text · ${r.words} words`
          : 'Description';

  return (
    <>
      <dl className="mb-3.5 grid grid-cols-[96px_1fr] items-center gap-x-3 gap-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-[12.5px] font-medium text-ink-3">{k}</dt>
            <dd className="flex min-w-0 flex-wrap items-center gap-1.5">{v}</dd>
          </div>
        ))}
      </dl>

      {r.body && (
        <>
          <div className="mb-1.5 mt-3.5 text-xs font-semibold text-ink-3">{bodyLabel}</div>
          <div className="whitespace-pre-wrap rounded border border-line bg-surface-2 px-3 py-2.5 leading-relaxed">{r.body}</div>
          {r.type === 'announcement' && r.words > 90 && (
            <p className="mt-1.5 text-xs text-status-approval-t">Over the 90-word bulletin limit.</p>
          )}
        </>
      )}

      {r.notes && (
        <>
          <div className="mb-1.5 mt-3.5 text-xs font-semibold text-ink-3">Note to the office</div>
          <div className="whitespace-pre-wrap rounded border border-line px-3 py-2.5 leading-relaxed">{r.notes}</div>
        </>
      )}

      {r.files.length > 0 && (
        <>
          <div className="mb-1.5 mt-3.5 text-xs font-semibold text-ink-3">Files</div>
          <ul className="flex flex-col gap-1">
            {r.files.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded border border-line px-2.5 py-1.5 text-sm hover:bg-surface-2"
                >
                  <PaperClipIcon className="h-3.5 w-3.5 flex-none text-ink-3" />
                  <span className="truncate">{decodeURIComponent(url.split('/').pop() || url)}</span>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
