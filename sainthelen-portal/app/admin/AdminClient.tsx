// app/admin/AdminClient.tsx
// The Inbox: every open request across the six tables, as a board (a
// "Just arrived" triage row, then columns by status), a list grouped by
// status, or the week's run-sheet. Click anything to open it in the panel.
'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowPathIcon, PaperClipIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import AdminLayout, { ViewTab, ViewTools } from '../components/admin/AdminLayout';
import RequestPanel from '../components/admin/RequestPanel';
import RequestList, { STATUS_DOT } from '../components/admin/RequestList';
import { useRequests } from '../context/RequestsContext';
import { TypeMark } from '../components/ui/TypeMark';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Tag, Platforms } from '../components/ui/Tag';
import { SearchInput } from '../components/ui/SearchInput';
import { Notice } from '../components/ui/Field';
import {
  REQUEST_TYPES,
  STATUS_LABEL,
  nextWeekendIso,
  relativeTime,
  sameWeekend,
  weekendLabel,
  type PortalRequest,
  type RequestStatus,
  type RequestType,
} from '../lib/requests';

type View = 'board' | 'list' | 'week';


export default function AdminClient() {
  return (
    <Suspense fallback={null}>
      <Inbox />
    </Suspense>
  );
}

function Inbox() {
  const { status } = useSession();
  const search = useSearchParams();
  const router = useRouter();
  const queue = search.get('queue') === 'week' ? 'week' : 'inbox';
  const typeParam = search.get('type') as RequestType | null;
  const type = typeParam && REQUEST_TYPES[typeParam] ? typeParam : null;

  const [view, setView] = useState<View>(queue === 'week' ? 'week' : 'board');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (queue === 'week') setView('week');
  }, [queue]);

  useEffect(() => {
    if (status === 'unauthenticated') signIn('azure-ad');
  }, [status]);

  const close = useCallback(() => setSelected(null), []);

  if (status === 'loading') return null;
  if (status !== 'authenticated') return null;

  return (
    <InboxBody
      view={view}
      setView={setView}
      q={q}
      setQ={setQ}
      queue={queue}
      type={type}
      selected={selected}
      setSelected={setSelected}
      close={close}
      clearFilter={() => router.push('/admin')}
    />
  );
}

function InboxBody(props: {
  view: View;
  setView: (v: View) => void;
  q: string;
  setQ: (s: string) => void;
  queue: 'inbox' | 'week';
  type: RequestType | null;
  selected: string | null;
  setSelected: (id: string | null) => void;
  close: () => void;
  clearFilter: () => void;
}) {
  const { view, setView, q, setQ, queue, type, selected, setSelected, close } = props;
  const { requests, loading, error, refresh, loadedAt } = useRequests();
  const weekend = nextWeekendIso();

  const visible = useMemo(() => {
    let v = requests;
    if (queue === 'week') v = v.filter((r) => r.status !== 'done' && inThisWeek(r, weekend));
    else v = v.filter((r) => r.status !== 'done' || isRecent(r.completedAt || r.submittedAt, 14));
    if (type) v = v.filter((r) => r.type === type);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      v = v.filter((r) => `${r.title} ${r.requester} ${r.ministry} ${r.body} ${REQUEST_TYPES[r.type].label}`.toLowerCase().includes(s));
    }
    return v;
  }, [requests, queue, type, q, weekend]);

  const open = visible.filter((r) => r.status !== 'done');
  const waiting = open.filter((r) => r.status === 'approval').length;
  const sel = selected ? requests.find((r) => r.id === selected) || null : null;

  const title = type ? REQUEST_TYPES[type].plural : queue === 'week' ? `This weekend · ${weekendLabel(weekend)}` : 'Inbox';
  const subtitle = loading && !requests.length
    ? 'Loading…'
    : `${open.length} open${waiting ? ` · ${waiting} waiting on approval` : ''}${queue === 'inbox' && !type ? ' · bulletin closes Monday at noon' : ''}`;

  return (
    <AdminLayout
      title={title}
      subtitle={subtitle}
      actions={
        <>
          <Button variant="ghost" onClick={() => refresh()} icon={<ArrowPathIcon className={loading ? 'animate-spin' : ''} />} title={loadedAt ? `Updated ${relativeTime(loadedAt.toISOString())}` : undefined}>
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Link href="/" className="inline-flex h-8 items-center gap-1.5 rounded bg-navy px-3 text-sm font-medium text-on-navy hover:bg-navy-hover">
            <PlusIcon className="h-4 w-4" />
            <span className="hidden sm:inline">New request</span>
          </Link>
        </>
      }
      views={
        <>
          <ViewTab on={view === 'board'} onClick={() => setView('board')}>Board</ViewTab>
          <ViewTab on={view === 'list'} onClick={() => setView('list')} n={visible.length}>List</ViewTab>
          <ViewTab on={view === 'week'} onClick={() => setView('week')}>Week run-sheet</ViewTab>
          <ViewTools>
            <SearchInput value={q} onChange={setQ} placeholder="Search requests" className="hidden md:flex" />
            {type && (
              <Button variant="ghost" onClick={props.clearFilter}>
                Clear filter
              </Button>
            )}
          </ViewTools>
        </>
      }
      panel={sel ? <RequestPanel request={sel} onClose={close} /> : null}
    >
      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      <div className="mb-3 md:hidden">
        <SearchInput value={q} onChange={setQ} placeholder="Search requests" hotkey={null} className="w-full" />
      </div>

      {view === 'board' && <Board items={visible} selected={selected} onSelect={setSelected} />}
      {view === 'list' && <RequestList items={visible} selected={selected} onSelect={setSelected} />}
      {view === 'week' && <Week items={requests.filter((r) => (type ? r.type === type : true))} weekend={weekend} onSelect={setSelected} />}

      {!loading && !visible.length && !error && (
        <p className="py-10 text-center text-sm text-ink-3">Nothing here{q ? ' that matches' : ''}.</p>
      )}
    </AdminLayout>
  );
}

/* ---------------- helpers ---------------- */

function isRecent(iso: string | null, days: number) {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < days * 86400000;
}

function inThisWeek(r: PortalRequest, weekend: string) {
  if (r.type === 'announcement') return sameWeekend(r.runsOn, weekend);
  if (!r.runsOn) return false;
  const end = new Date(`${weekend}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  return r.runsOn <= end.toISOString().slice(0, 10);
}

function Who({ r }: { r: PortalRequest }) {
  return (
    <span className="text-xs text-ink-3">
      {r.requester}
      {r.ministry ? ` · ${r.ministry}` : ''}
    </span>
  );
}

/* ---------------- board ---------------- */

function Board({ items, selected, onSelect }: { items: PortalRequest[]; selected: string | null; onSelect: (id: string) => void }) {
  const fresh = items.filter((r) => r.status === 'new');
  const cols: RequestStatus[] = ['review', 'approval', 'approved', 'scheduled', 'done'];
  return (
    <>
      {fresh.length > 0 && (
        <div className="mb-3.5 rounded-lg border border-dashed border-line-2 bg-surface px-3 py-2.5">
          <h3 className="mb-1 flex items-center gap-2 text-[12.5px] font-semibold text-ink-2">
            Just arrived <span className="font-medium text-ink-3">{fresh.length}</span>
          </h3>
          {fresh.map((r, i) => (
            <div
              key={r.id}
              className={`grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 py-2 sm:grid-cols-[auto_1fr_auto_auto] ${i ? 'border-t border-line' : ''}`}
            >
              <span className="col-span-2 sm:col-span-1">
                <TypeMark type={r.type} />
              </span>
              <button type="button" onClick={() => onSelect(r.id)} className="min-w-0 text-left">
                <div className="truncate text-[13.5px] font-semibold">{r.title}</div>
                <div className="text-xs text-ink-3">
                  {r.requester}
                  {r.ministry ? ` · ${r.ministry}` : ''} · {relativeTime(r.submittedAt)}
                </div>
              </button>
              <Avatar name={r.requester} />
              <div className="col-span-2 flex gap-1.5 sm:col-span-1">
                <Button size="sm" variant="secondary" onClick={() => onSelect(r.id)}>
                  Open
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))] 2xl:[grid-auto-flow:column] 2xl:[grid-auto-columns:minmax(236px,1fr)] 2xl:[grid-template-columns:none]">
        {cols.map((c) => {
          const list = items.filter((r) => r.status === c);
          return (
            <div key={c} className="min-h-[120px] rounded-lg bg-black/[.025] p-2 dark:bg-white/[.03]">
              <h3 className="mb-2 flex items-center gap-2 px-1 py-0.5 text-[12.5px] font-semibold text-ink-2">
                <i className={`h-2 w-2 rounded-full ${STATUS_DOT[c]}`} />
                {STATUS_LABEL[c]}
                <span className="font-medium text-ink-3">{list.length}</span>
              </h3>
              {list.length ? (
                list.map((r) => <Card key={r.id} r={r} selected={selected === r.id} onSelect={onSelect} />)
              ) : (
                <div className="px-1 py-1.5 text-[12.5px] text-ink-3">Nothing here</div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function Card({ r, selected, onSelect }: { r: PortalRequest; selected: boolean; onSelect: (id: string) => void }) {
  const tags: Array<{ t: string; warn?: boolean }> = [];
  if (r.calendar === 'requested') tags.push({ t: 'calendar draft' });
  if (r.status === 'approval') tags.push({ t: r.ministry || 'needs coordinator', warn: true });
  if (r.urgent) tags.push({ t: 'urgent', warn: true });
  if (r.type === 'announcement' && r.words > 90) tags.push({ t: `${r.words} words`, warn: true });
  return (
    <button
      type="button"
      onClick={() => onSelect(r.id)}
      className={`mb-2 block w-full rounded-[7px] border bg-surface px-[11px] pb-2 pt-2.5 text-left shadow-[0_1px_1px_rgba(0,0,0,.03)] ${
        selected ? 'border-navy ring-1 ring-navy' : 'border-line hover:border-line-2'
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <TypeMark type={r.type} />
        {r.runsOn && (
          <span className="tnum whitespace-nowrap text-xs text-ink-3">
            {r.type === 'announcement' ? 'runs ' : ''}
            {r.runsLabel}
          </span>
        )}
      </div>
      <p className="mb-0.5 text-[13.5px] font-semibold leading-snug">{r.title}</p>
      <p className="mb-2">
        <Who r={r} />
      </p>
      {tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {tags.map((t) => (
            <Tag key={t.t} tone={t.warn ? 'warn' : 'neutral'}>
              {t.t}
            </Tag>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 text-xs text-ink-3">
        <Avatar name={r.requester} />
        <Platforms platforms={r.platforms} />
        <span className="flex-1" />
        {r.files.length > 0 && (
          <span className="inline-flex items-center gap-0.5" title={`${r.files.length} file${r.files.length > 1 ? 's' : ''}`}>
            <PaperClipIcon className="h-3.5 w-3.5" /> {r.files.length}
          </span>
        )}
        <span className="tnum whitespace-nowrap">{relativeTime(r.submittedAt)}</span>
      </div>
    </button>
  );
}

/* ---------------- week run-sheet ---------------- */

function Week({ items, weekend, onSelect }: { items: PortalRequest[]; weekend: string; onSelect: (id: string) => void }) {
  const wk = items.filter((r) => r.type === 'announcement' && r.status !== 'done' && sameWeekend(r.runsOn, weekend));
  const has = (r: PortalRequest, k: string) => r.platforms.some((p) => p.toLowerCase().includes(k));
  const bulletin = wk.filter((r) => has(r, 'bulletin'));
  const email = wk.filter((r) => has(r, 'email'));
  const screens = wk.filter((r) => has(r, 'screen'));
  const texts = items.filter((r) => r.type === 'text' && r.status !== 'done' && inThisWeek(r, weekend));
  const words = bulletin.reduce((n, r) => n + r.words, 0);

  const sat = new Date(`${weekend}T12:00:00Z`);
  const mon = new Date(sat);
  mon.setUTCDate(sat.getUTCDate() - 5);
  const wed = new Date(sat);
  wed.setUTCDate(sat.getUTCDate() - 3);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });

  const Row = ({ r, k }: { r: PortalRequest; k: string }) => (
    <li>
      <button
        type="button"
        onClick={() => onSelect(r.id)}
        className="grid w-full grid-cols-[22px_1fr_auto] items-center gap-2.5 px-3 py-[7px] text-left text-sm hover:bg-surface-2"
      >
        <Avatar name={r.requester} />
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate">{r.title}</span>
          {r.status === 'approval' && <Tag tone="warn">needs approval</Tag>}
          {r.status === 'new' && <Tag>new</Tag>}
        </span>
        <span className="tnum text-xs text-ink-3">{k}</span>
      </button>
    </li>
  );

  const Slot = ({ title, sub, cap, n, children, foot }: { title: string; sub?: string; cap: string; n: React.ReactNode; children: React.ReactNode; foot?: React.ReactNode }) => (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <h3 className="flex items-center gap-2 border-b border-line px-3 py-2.5 text-sm font-semibold">
        {title} {sub && <small className="font-normal text-ink-3">· {sub}</small>}
        <span className="ml-auto text-xs font-medium text-ink-3">{n}</span>
      </h3>
      <p className="border-b border-line bg-surface-2 px-3 py-1.5 text-xs text-ink-3">{cap}</p>
      <ol className="py-1">{children}</ol>
      {foot && <div className="border-t border-line px-3 pb-2.5 pt-1.5 text-xs text-ink-3">{foot}</div>}
    </div>
  );
  const Empty = ({ text }: { text: string }) => <li className="px-3 py-2 text-sm text-ink-3">{text}</li>;

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <Slot
        title="Bulletin"
        sub={weekendLabel(weekend)}
        n={`${bulletin.length} item${bulletin.length === 1 ? '' : 's'}`}
        cap={`Closes ${fmt(mon)}, noon`}
        foot={
          <>
            {words} words in total · 90 per item
            {bulletin.some((r) => r.words > 90) && <span className="text-status-approval-t"> · some run long</span>}
          </>
        }
      >
        {bulletin.length ? bulletin.map((r) => <Row key={r.id} r={r} k={`${r.words} w`} />) : <Empty text="Nothing for the bulletin yet" />}
      </Slot>
      <Slot
        title="Wednesday email"
        sub={wed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })}
        n={email.length}
        cap="One lead item, the rest get a line and a link"
      >
        {email.length ? email.map((r, i) => <Row key={r.id} r={r} k={i === 0 ? 'lead' : 'line'} />) : <Empty text="Nothing for the email yet" />}
      </Slot>
      <Slot title="Church screens" n={screens.length} cap="Rolling · dated slides come down Monday">
        {screens.length ? screens.map((r) => <Row key={r.id} r={r} k="slide" />) : <Empty text="Nothing for the screens yet" />}
      </Slot>
      {texts.length > 0 && (
        <Slot title="Texts this week" n={texts.length} cap="Requested send dates through the weekend">
          {texts.map((r) => (
            <Row key={r.id} r={r} k={r.runsLabel} />
          ))}
        </Slot>
      )}
    </div>
  );
}
