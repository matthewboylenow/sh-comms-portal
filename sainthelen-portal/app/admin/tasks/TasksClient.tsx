// app/admin/tasks/TasksClient.tsx
// One to-do list: items from the inbox scan, from portal requests, and
// quick adds. Grouped by category; click a row to edit, snooze or finish.
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { ArrowPathIcon, ArrowTopRightOnSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import AdminLayout, { ViewTab, ViewTools } from '../../components/admin/AdminLayout';
import { Button } from '../../components/ui/Button';
import { Notice, Input, Select, Textarea } from '../../components/ui/Field';
import { Tag } from '../../components/ui/Tag';
import { relativeTime } from '../../lib/requests';

type Category = 'reply' | 'website' | 'bulletin' | 'calendar' | 'av' | 'admin' | 'other';
type Task = {
  id: string;
  title: string;
  notes: string | null;
  source: 'email' | 'portal' | 'manual';
  source_ref: string | null;
  source_link: string | null;
  requester_name: string | null;
  requester_email: string | null;
  category: Category;
  due_at: string | null;
  importance: 'normal' | 'high';
  status: 'open' | 'done' | 'snoozed';
  snoozed_until: string | null;
  created_at: string;
  completed_at: string | null;
};

const ORDER: Category[] = ['reply', 'website', 'bulletin', 'calendar', 'av', 'admin', 'other'];
const LABEL: Record<Category, string> = {
  reply: 'Replies',
  website: 'Website',
  bulletin: 'Bulletin',
  calendar: 'Calendar',
  av: 'A/V',
  admin: 'Admin',
  other: 'Other',
};
const SOURCE: Record<Task['source'], string> = { email: 'Email', portal: 'Portal', manual: 'Added' };

const NY = 'America/New_York';
function fmtDue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date().toLocaleDateString('en-US', { timeZone: NY });
  const day = d.toLocaleDateString('en-US', { timeZone: NY });
  const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString('en-US', { timeZone: NY });
  const time = d.toLocaleTimeString('en-US', { timeZone: NY, hour: 'numeric', minute: '2-digit' });
  // 5:00 PM is the stand-in for "no time given"; noon is what portal requests use
  const hasTime = time !== '5:00 PM' && time !== '12:00 PM';
  if (day === today) return `Today${hasTime ? ` ${time}` : ''}`;
  if (day === tomorrow) return `Tomorrow${hasTime ? ` ${time}` : ''}`;
  return d.toLocaleDateString('en-US', { timeZone: NY, weekday: 'short', month: 'short', day: 'numeric' }) + (hasTime ? ` ${time}` : '');
}
const isPast = (iso: string | null) => !!iso && new Date(iso).getTime() < Date.now();
/** A date-only input value in New York, as an ISO at 5 pm local */
function dateToIso(dateStr: string): string | null {
  if (!dateStr) return null;
  return new Date(`${dateStr}T17:00:00${tzSuffix(dateStr)}`).toISOString();
}
const isoToDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-CA', { timeZone: NY }) : '');

export default function TasksClient() {
  const { status } = useSession();
  const [view, setView] = useState<'open' | 'done'>('open');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quick, setQuick] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks?status=${view}&ts=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Could not load tasks (${res.status})`);
      setTasks((await res.json()).tasks || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    if (status === 'authenticated') load();
    if (status === 'unauthenticated') signIn('azure-ad');
  }, [status, load]);

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusy(id);
    setError(null);
    const before = tasks;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...(body as Partial<Task>) } : t)));
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Could not save');
      const { task } = await res.json();
      if (task && task.id) setTasks((ts) => ts.map((t) => (t.id === id ? task : t)));
      if (body.status || body.snoozed_until) await load();
    } catch (e: any) {
      setTasks(before);
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this task?')) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not delete');
      setTasks((ts) => ts.filter((t) => t.id !== id));
      if (openId === id) setOpenId(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const add = async () => {
    const title = quick.trim();
    if (!title) return;
    setQuick('');
    try {
      const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, source: 'manual', category: 'other' }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Could not add');
      const { task } = await res.json();
      if (view === 'open') setTasks((ts) => [task, ...ts]);
      setOpenId(task.id);
    } catch (e: any) {
      setError(e.message);
      setQuick(title);
    }
  };

  const groups = useMemo(() => ORDER.map((c) => ({ c, items: tasks.filter((t) => t.category === c) })).filter((g) => g.items.length), [tasks]);
  const high = tasks.filter((t) => t.importance === 'high').length;

  if (status !== 'authenticated') return null;

  return (
    <AdminLayout
      title="Tasks"
      subtitle={loading && !tasks.length ? 'Loading…' : view === 'open' ? `${tasks.length} open${high ? ` · ${high} high` : ''}` : `${tasks.length} done`}
      actions={
        <Button variant="ghost" onClick={load} icon={<ArrowPathIcon className={loading ? 'animate-spin' : ''} />}>
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      }
      views={
        <>
          <ViewTab on={view === 'open'} onClick={() => setView('open')}>Open</ViewTab>
          <ViewTab on={view === 'done'} onClick={() => setView('done')}>Done</ViewTab>
          <ViewTools>
            <span className="hidden text-xs text-ink-3 sm:inline">Snoozed items come back on their day</span>
          </ViewTools>
        </>
      }
    >
      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {view === 'open' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
          className="mb-4 max-w-[720px]"
        >
          <Input value={quick} onChange={(e) => setQuick(e.target.value)} placeholder="Add a task and press Enter" aria-label="Add a task" />
        </form>
      )}

      {!loading && !tasks.length && (
        <p className="py-10 text-center text-sm text-ink-3">{view === 'open' ? 'Nothing open. Add one above, or wait for the morning scan.' : 'Nothing finished yet.'}</p>
      )}

      <div className="flex max-w-[720px] flex-col gap-4">
        {groups.map((g) => (
          <section key={g.c} className="overflow-hidden rounded-lg border border-line bg-surface">
            <h2 className="flex items-center gap-2 border-b border-line bg-surface-2 px-3 py-2 text-[12.5px] font-semibold text-ink-2">
              {LABEL[g.c]} <span className="font-medium text-ink-3">{g.items.length}</span>
            </h2>
            <ul>
              {g.items.map((t) => (
                <Row key={t.id} t={t} open={openId === t.id} busy={busy === t.id} view={view} onToggle={() => setOpenId(openId === t.id ? null : t.id)} onPatch={(b) => patch(t.id, b)} onDelete={() => remove(t.id)} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </AdminLayout>
  );
}

function Row({
  t,
  open,
  busy,
  view,
  onToggle,
  onPatch,
  onDelete,
}: {
  t: Task;
  open: boolean;
  busy: boolean;
  view: 'open' | 'done';
  onToggle: () => void;
  onPatch: (body: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(t.title);
  const [notes, setNotes] = useState(t.notes || '');
  useEffect(() => {
    setTitle(t.title);
    setNotes(t.notes || '');
  }, [t.title, t.notes]);

  const snooze = (days: number | string) => {
    const d = typeof days === 'number' ? new Date(Date.now() + days * 86400000) : new Date(`${days}T08:00:00`);
    const date = d.toLocaleDateString('en-CA', { timeZone: NY });
    onPatch({ snoozed_until: new Date(`${date}T08:00:00${tzSuffix(date)}`).toISOString() });
  };

  return (
    <li className={`border-b border-line last:border-b-0 ${t.importance === 'high' ? 'border-l-[3px] border-l-navy' : 'border-l-[3px] border-l-transparent'}`}>
      <div className="flex items-center gap-3 px-3 py-2">
        <input
          type="checkbox"
          checked={t.status === 'done'}
          disabled={busy}
          onChange={(e) => onPatch({ status: e.target.checked ? 'done' : 'open' })}
          aria-label={t.status === 'done' ? `Reopen ${t.title}` : `Mark ${t.title} done`}
          className="h-[15px] w-[15px] flex-none"
        />
        <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left">
          <span className={`block truncate text-[13.5px] font-semibold ${t.status === 'done' ? 'text-ink-3 line-through' : ''}`}>{t.title}</span>
          <span className="block truncate text-xs text-ink-3">
            {t.requester_name || (t.source === 'manual' ? 'You' : '')}
            {view === 'done' && t.completed_at ? ` · done ${relativeTime(t.completed_at)}` : ''}
            {view === 'open' && t.due_at ? (
              <span className={isPast(t.due_at) ? 'text-status-approval-t' : ''}>{t.requester_name ? ' · ' : ''}due {fmtDue(t.due_at)}</span>
            ) : (
              ''
            )}
          </span>
        </button>
        <Tag>{SOURCE[t.source]}</Tag>
        {t.source_link && (
          <a
            href={t.source_link}
            target="_blank"
            rel="noopener noreferrer"
            title={t.source === 'email' ? 'Open the email' : 'Open the request'}
            className="grid h-7 w-7 flex-none place-items-center rounded text-ink-3 hover:bg-surface-2 hover:text-ink"
            onClick={(e) => e.stopPropagation()}
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </a>
        )}
      </div>

      {open && (
        <div className="border-t border-line bg-surface-2 px-3 py-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-ink-3">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => title.trim() && title !== t.title && onPatch({ title })} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-ink-3">Notes</label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== (t.notes || '') && onPatch({ notes })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-3">Category</label>
              <Select value={t.category} onChange={(e) => onPatch({ category: e.target.value })}>
                {ORDER.map((c) => (
                  <option key={c} value={c}>
                    {LABEL[c]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-3">Due</label>
              <Input type="date" value={isoToDate(t.due_at)} onChange={(e) => onPatch({ due_at: dateToIso(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-3">Importance</label>
              <Select value={t.importance} onChange={(e) => onPatch({ importance: e.target.value })}>
                <option value="normal">Normal</option>
                <option value="high">High · goes in the digest</option>
              </Select>
            </div>
            {view === 'open' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-3">Snooze</label>
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => snooze(1)} disabled={busy}>
                    Tomorrow
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => snooze(7)} disabled={busy}>
                    Next week
                  </Button>
                  <input
                    type="date"
                    aria-label="Snooze until"
                    className="h-7 rounded border border-line-2 bg-surface px-2 text-xs"
                    onChange={(e) => e.target.value && snooze(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-ink-3">
            {t.requester_email && (
              <a href={`mailto:${t.requester_email}`} className="text-navy hover:underline">
                {t.requester_email}
              </a>
            )}
            <span>· added {relativeTime(t.created_at)}</span>
            <span className="flex-1" />
            <Button size="sm" variant="ghost" onClick={onDelete} disabled={busy} icon={<TrashIcon />}>
              Delete
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

/** "-04:00" or "-05:00" for a New York date, so a local wall-clock time becomes the right instant. */
function tzSuffix(date: string): string {
  const probe = new Date(`${date}T12:00:00Z`);
  const ny = new Date(probe.toLocaleString('en-US', { timeZone: NY }));
  const utc = new Date(probe.toLocaleString('en-US', { timeZone: 'UTC' }));
  const offsetMin = (ny.getTime() - utc.getTime()) / 60000;
  const sign = offsetMin < 0 ? '-' : '+';
  const abs = Math.abs(offsetMin);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}
