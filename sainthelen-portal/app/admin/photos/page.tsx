// app/admin/photos/page.tsx
// Parish-life photos shared through /share-photos: a strip of thumbnails per
// submission, with the privacy flag where someone raised one.
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { ArrowPathIcon, PlayCircleIcon } from '@heroicons/react/24/outline';
import AdminLayout, { ViewTools } from '../../components/admin/AdminLayout';
import { Button } from '../../components/ui/Button';
import { Notice } from '../../components/ui/Field';
import { SearchInput } from '../../components/ui/SearchInput';
import { Avatar } from '../../components/ui/Avatar';
import { Tag } from '../../components/ui/Tag';
import { relativeTime } from '../../lib/requests';

type PhotoSubmission = {
  id: string;
  submitterName: string | null;
  ministry: string | null;
  description: string;
  photoDate: string | null;
  fileLinks: string[] | null;
  privacyConcern: boolean;
  privacyNotes: string | null;
  createdAt: string;
};

const VIDEO = /\.(mp4|mov|webm|m4v|3gp)(\?|$)/i;

function longDate(s: string | null) {
  if (!s) return '';
  const d = new Date(s.includes('T') ? s : `${s}T12:00:00`);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function AdminPhotosPage() {
  const { status } = useSession();
  const [rows, setRows] = useState<PhotoSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/photo-submissions', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Could not load photos (${res.status})`);
      setRows((await res.json()).submissions || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === 'authenticated') load();
    if (status === 'unauthenticated') signIn('azure-ad');
  }, [status]);

  const items = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return rows;
    return rows.filter((s) => {
      const hay = [s.description, s.ministry, s.submitterName, s.photoDate].filter(Boolean).join(' ').toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }, [rows, q]);

  if (status !== 'authenticated') return null;

  const files = items.reduce((n, s) => n + (s.fileLinks?.length || 0), 0);

  return (
    <AdminLayout
      title="Shared photos"
      subtitle={loading ? 'Loading…' : `${items.length} submission${items.length === 1 ? '' : 's'} · ${files} file${files === 1 ? '' : 's'}`}
      actions={
        <Button variant="ghost" onClick={load} icon={<ArrowPathIcon className={loading ? 'animate-spin' : ''} />}>
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      }
      views={
        <ViewTools>
          <SearchInput value={q} onChange={setQ} placeholder="Search photos" />
        </ViewTools>
      }
    >
      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {!loading && !items.length && (
        <p className="py-10 text-center text-sm text-ink-3">
          {q ? 'No photos match.' : 'Photos shared through the portal will show up here with their date, ministry and context.'}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {items.map((s) => (
          <article key={s.id} className="rounded-lg border border-line bg-surface">
            <div className="flex flex-wrap items-start gap-3 px-4 pb-3 pt-3.5">
              <Avatar name={s.submitterName || 'Unknown'} size={32} />
              <div className="min-w-0 flex-1">
                <h3 className="text-[13.5px] font-semibold leading-snug">{s.description}</h3>
                <p className="mt-0.5 text-xs text-ink-3">
                  {[s.submitterName, s.ministry, longDate(s.photoDate)].filter(Boolean).join(' · ')}
                  {s.createdAt ? ` · shared ${relativeTime(s.createdAt)}` : ''}
                </p>
              </div>
              {s.privacyConcern && <Tag tone="warn">Privacy · check before using</Tag>}
            </div>
            {s.privacyConcern && s.privacyNotes && (
              <div className="px-4 pb-3">
                <Notice tone="error">{s.privacyNotes}</Notice>
              </div>
            )}
            {(s.fileLinks?.length || 0) > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-line px-4 py-3">
                {(s.fileLinks || []).map((link, i) =>
                  VIDEO.test(link) ? (
                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grid h-[92px] w-[92px] place-items-center rounded border border-line bg-surface-2 text-xs text-ink-2 hover:bg-line"
                    >
                      <span className="text-center">
                        <PlayCircleIcon className="mx-auto mb-1 h-6 w-6" />
                        Video {i + 1}
                      </span>
                    </a>
                  ) : (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={link}
                        alt={`${s.description}, photo ${i + 1}`}
                        loading="lazy"
                        className="h-[92px] w-[92px] rounded border border-line object-cover hover:opacity-90"
                      />
                    </a>
                  )
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </AdminLayout>
  );
}
