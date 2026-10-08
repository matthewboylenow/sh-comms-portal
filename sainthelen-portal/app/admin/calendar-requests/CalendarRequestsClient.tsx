// app/admin/calendar-requests/CalendarRequestsClient.tsx
// Announcements that asked for the parish calendar: drafts still to review
// and events already published on sainthelen.org. "Review & publish" opens
// the same page the review email links to.
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import AdminLayout, { ViewTab, ViewTools } from '../../components/admin/AdminLayout';
import RequestList from '../../components/admin/RequestList';
import RequestPanel from '../../components/admin/RequestPanel';
import { Button } from '../../components/ui/Button';
import { Notice } from '../../components/ui/Field';
import { SearchInput } from '../../components/ui/SearchInput';
import { useRequests } from '../../context/RequestsContext';

type Tab = 'review' | 'published';

export default function CalendarRequestsClient() {
  const { status } = useSession();
  const { requests, loading, error, refresh } = useRequests();
  const [tab, setTab] = useState<Tab>('review');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') signIn('azure-ad');
  }, [status]);

  const items = useMemo(() => {
    let v = requests.filter((r) => r.type === 'announcement' && r.calendar !== 'none');
    v = v.filter((r) => (tab === 'review' ? r.calendar === 'requested' : r.calendar === 'published'));
    if (q.trim()) {
      const s = q.toLowerCase();
      v = v.filter((r) => `${r.title} ${r.requester} ${r.ministry} ${r.body}`.toLowerCase().includes(s));
    }
    return v;
  }, [requests, tab, q]);

  const counts = {
    review: requests.filter((r) => r.calendar === 'requested').length,
    published: requests.filter((r) => r.calendar === 'published').length,
  };
  const sel = selected ? requests.find((r) => r.id === selected) || null : null;

  if (status !== 'authenticated') return null;

  return (
    <AdminLayout
      title="Calendar drafts"
      subtitle={loading && !requests.length ? 'Loading…' : tab === 'review' ? `${items.length} to review and publish` : `${items.length} on the calendar`}
      actions={
        <Button variant="ghost" onClick={() => refresh()} icon={<ArrowPathIcon className={loading ? 'animate-spin' : ''} />}>
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      }
      views={
        <>
          <ViewTab on={tab === 'review'} onClick={() => setTab('review')} n={counts.review}>Needs review</ViewTab>
          <ViewTab on={tab === 'published'} onClick={() => setTab('published')} n={counts.published}>Published</ViewTab>
          <ViewTools>
            <SearchInput value={q} onChange={setQ} placeholder="Search" className="hidden md:flex" />
          </ViewTools>
        </>
      }
      panel={sel ? <RequestPanel request={sel} onClose={() => setSelected(null)} /> : null}
    >
      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      {tab === 'review' && (
        <p className="mb-3 text-sm text-ink-3">
          Open a request and choose <span className="font-medium text-ink-2">Review calendar draft</span>. The cleaned-up event comes up for a
          one-click publish or an edit.
        </p>
      )}
      <RequestList items={items} selected={selected} onSelect={setSelected} groupBy="none" dateLabel="Event" dateOf={(r) => (r.eventLabel || r.runsLabel).split(' · ')[0]} />
    </AdminLayout>
  );
}
