// app/admin/approvals/page.tsx
// Announcements that need a ministry coordinator's sign-off. Reads the
// scoped /api/admin/approvals route (an approver only sees their own
// ministries) and shows the same list and panel as the Inbox.
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import AdminLayout, { ViewTab, ViewTools } from '../../components/admin/AdminLayout';
import RequestList from '../../components/admin/RequestList';
import RequestPanel from '../../components/admin/RequestPanel';
import { Button } from '../../components/ui/Button';
import { Notice } from '../../components/ui/Field';
import { SearchInput } from '../../components/ui/SearchInput';
import { toRequest, type PortalRequest } from '../../lib/requests';

type Filter = 'pending' | 'approved' | 'rejected';

interface ApprovalRow {
  id: string;
  name: string;
  email: string;
  ministry: string;
  eventDate?: string;
  eventTime?: string;
  promotionStart?: string;
  platforms?: string[];
  announcementBody: string;
  addToCalendar?: string;
  calendarEventName?: string;
  fileLinks?: string;
  approvalStatus: string;
  requiresApproval?: string | boolean;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

/** The approvals route returns camelCase; give it the shape the list reads. */
function rowToRequest(a: ApprovalRow): PortalRequest {
  return toRequest('announcements', {
    id: a.id,
    fields: {
      Name: a.name,
      Email: a.email,
      Ministry: a.ministry,
      'Date of Event': a.eventDate,
      'Time of Event': a.eventTime,
      'Promotion Start Date': a.promotionStart,
      Platforms: a.platforms,
      'Announcement Body': a.announcementBody,
      'Add to Events Calendar': a.addToCalendar,
      'Calendar Event Name': a.calendarEventName,
      'File Links': a.fileLinks,
      'Approval Status': a.approvalStatus,
      'Requires Approval': true,
      'Submitted At': a.submittedAt,
      'Approved By': a.approvedBy,
      'Approved At': a.approvedAt,
      'Rejection Reason': a.rejectionReason,
    },
  });
}

export default function ApprovalsPage() {
  const { status } = useSession();
  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('pending');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkReject, setBulkReject] = useState(false);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/approvals?status=${filter}&ts=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Could not load approvals');
      const data = await res.json();
      setRows(data.approvals || []);
    } catch (e: any) {
      setError(e.message || 'Could not load approvals');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (status === 'authenticated') load();
  }, [status, load]);

  useEffect(() => {
    setChecked(new Set());
    setSelected(null);
  }, [filter]);

  useEffect(() => {
    if (status === 'unauthenticated') signIn('azure-ad');
  }, [status]);

  const items = useMemo(() => {
    let v = rows.map(rowToRequest);
    if (q.trim()) {
      const s = q.toLowerCase();
      v = v.filter((r) => `${r.title} ${r.requester} ${r.ministry} ${r.body}`.toLowerCase().includes(s));
    }
    return v;
  }, [rows, q]);

  const sel = selected ? items.find((r) => r.id === selected) || null : null;

  async function bulk(action: 'approve' | 'reject') {
    if (!checked.size) return;
    setBulkBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulk: true, recordIds: Array.from(checked), action, rejectionReason: action === 'reject' ? reason.trim() : undefined }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'That did not go through');
      setChecked(new Set());
      setBulkReject(false);
      setReason('');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBulkBusy(false);
    }
  }

  if (status !== 'authenticated') return null;

  const toggle = (id: string) =>
    setChecked((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const allChecked = items.length > 0 && items.every((r) => checked.has(r.id));

  return (
    <AdminLayout
      title="Waiting on approval"
      subtitle={loading ? 'Loading…' : `${items.length} ${filter === 'pending' ? 'waiting' : filter === 'approved' ? 'approved' : 'sent back'}`}
      actions={
        <Button variant="ghost" onClick={load} icon={<ArrowPathIcon className={loading ? 'animate-spin' : ''} />}>
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      }
      views={
        <>
          <ViewTab on={filter === 'pending'} onClick={() => setFilter('pending')}>Waiting</ViewTab>
          <ViewTab on={filter === 'approved'} onClick={() => setFilter('approved')}>Approved</ViewTab>
          <ViewTab on={filter === 'rejected'} onClick={() => setFilter('rejected')}>Sent back</ViewTab>
          <ViewTools>
            <SearchInput value={q} onChange={setQ} placeholder="Search" className="hidden md:flex" />
          </ViewTools>
        </>
      }
      panel={sel ? <RequestPanel request={sel} onClose={() => setSelected(null)} onChanged={load} /> : null}
    >
      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {filter === 'pending' && items.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 text-sm text-ink-2">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={() => setChecked(allChecked ? new Set() : new Set(items.map((r) => r.id)))}
              className="h-[15px] w-[15px]"
            />
            Select all
          </label>
          {checked.size > 0 && (
            <>
              <span className="text-sm text-ink-3">{checked.size} selected</span>
              <Button size="sm" onClick={() => bulk('approve')} disabled={bulkBusy}>
                {bulkBusy ? 'Working…' : `Approve ${checked.size}`}
              </Button>
              <Button size="sm" variant="danger" onClick={() => setBulkReject((v) => !v)} disabled={bulkBusy}>
                Request changes
              </Button>
            </>
          )}
        </div>
      )}

      {bulkReject && checked.size > 0 && (
        <div className="mb-3 max-w-xl rounded-lg border border-line bg-surface p-3">
          <label className="mb-1 block text-sm font-medium">What needs to change? Goes to each submitter by email.</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="block w-full rounded border border-line-2 bg-surface px-2.5 py-2 text-sm"
          />
          <div className="mt-2 flex gap-1.5">
            <Button size="sm" variant="danger" onClick={() => bulk('reject')} disabled={!reason.trim() || bulkBusy}>
              {bulkBusy ? 'Sending…' : `Send back ${checked.size}`}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setBulkReject(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <RequestList
        items={items}
        selected={selected}
        onSelect={setSelected}
        groupBy="none"
        checked={filter === 'pending' ? checked : undefined}
        onToggle={toggle}
      />
    </AdminLayout>
  );
}
