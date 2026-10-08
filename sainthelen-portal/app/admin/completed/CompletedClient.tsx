// app/admin/completed/CompletedClient.tsx
// Everything marked published or done, grouped by request type. Open one to
// read it or reopen it.
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
import { shortDate } from '../../lib/requests';

type Range = '30' | '90' | 'all';

export default function CompletedClient() {
  const { status } = useSession();
  const { requests, loading, error, refresh } = useRequests();
  const [range, setRange] = useState<Range>('30');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') signIn('azure-ad');
  }, [status]);

  const items = useMemo(() => {
    let v = requests.filter((r) => r.status === 'done');
    if (range !== 'all') {
      const cutoff = Date.now() - Number(range) * 86400000;
      v = v.filter((r) => new Date(r.completedAt || r.submittedAt || 0).getTime() >= cutoff);
    }
    if (q.trim()) {
      const s = q.toLowerCase();
      v = v.filter((r) => `${r.title} ${r.requester} ${r.ministry} ${r.body}`.toLowerCase().includes(s));
    }
    return v.sort((a, b) => (b.completedAt || b.submittedAt || '').localeCompare(a.completedAt || a.submittedAt || ''));
  }, [requests, range, q]);

  const sel = selected ? requests.find((r) => r.id === selected) || null : null;

  if (status !== 'authenticated') return null;

  return (
    <AdminLayout
      title="Done"
      subtitle={loading && !requests.length ? 'Loading…' : `${items.length} finished`}
      actions={
        <Button variant="ghost" onClick={() => refresh()} icon={<ArrowPathIcon className={loading ? 'animate-spin' : ''} />}>
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      }
      views={
        <>
          <ViewTab on={range === '30'} onClick={() => setRange('30')}>Last 30 days</ViewTab>
          <ViewTab on={range === '90'} onClick={() => setRange('90')}>Last 90 days</ViewTab>
          <ViewTab on={range === 'all'} onClick={() => setRange('all')}>All</ViewTab>
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
      <div className="mb-3 md:hidden">
        <SearchInput value={q} onChange={setQ} placeholder="Search" hotkey={null} className="w-full" />
      </div>
      <RequestList items={items} selected={selected} onSelect={setSelected} groupBy="type" dateLabel="Done" dateOf={(r) => shortDate(r.completedAt || r.submittedAt)} />
    </AdminLayout>
  );
}
