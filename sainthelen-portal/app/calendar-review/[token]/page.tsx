// app/calendar-review/[token]/page.tsx
//
// Where the calendar review email's links land. "Approve" opens a preview with
// one publish button; "Edit" opens the same event as a form. Approval is a
// button press rather than the link itself because Outlook's link scanner
// opens every link in an email, and it shouldn't be able to publish anything.
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import FrontLayout from '../../components/FrontLayout';
import { FrontCard, FrontCardContent } from '../../components/ui/FrontCard';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PaperClipIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { CalendarEventFields } from '../../lib/db/schema';
import { formatWhen } from '../../lib/format-event';

type ReviewData = {
  status: 'processing' | 'ready' | 'published' | 'dismissed';
  original: CalendarEventFields;
  cleaned: CalendarEventFields;
  changes: string[];
  concerns: string[];
  aiError: string | null;
  wordpressEventUrl: string | null;
  submitter: { name: string; email: string; ministry: string | null; fileLinks: string[] } | null;
};

const inputClass =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white';
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

function fileName(url: string) {
  return decodeURIComponent(url.split('/').pop() || url).replace(/^\d{10,}-/, '');
}

function Description({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-gray-700 dark:text-gray-300">
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}

function EventPreview({ event }: { event: CalendarEventFields }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-sh-primary dark:text-white mb-1">{event.title || '(no title)'}</h2>
      <p className="font-semibold text-gray-900 dark:text-white">{formatWhen(event)}</p>
      {event.location && <p className="text-gray-700 dark:text-gray-300">{event.location}</p>}
      {event.signUpUrl && (
        <p>
          <a href={event.signUpUrl} target="_blank" rel="noreferrer" className="text-sh-primary underline break-all">
            {event.signUpUrl}
          </a>
        </p>
      )}
      <div className="mt-4">
        <Description text={event.description} />
      </div>
    </div>
  );
}

export default function CalendarReviewPage({ params }: { params: { token: string } }) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ReviewData | null>(null);
  const [loadError, setLoadError] = useState('');
  const [fields, setFields] = useState<CalendarEventFields | null>(null);
  const [editing, setEditing] = useState(searchParams.get('action') !== 'approve');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/calendar-review/${params.token}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Could not load this review.');
        setData(body);
        setFields(body.cleaned);
      })
      .catch((err) => setLoadError(err.message));
  }, [params.token]);

  function set<K extends keyof CalendarEventFields>(key: K, value: CalendarEventFields[K]) {
    setFields((f) => (f ? { ...f, [key]: value } : f));
  }

  async function submit(action: 'publish' | 'dismiss') {
    if (!fields) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/calendar-review/${params.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, fields }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Something went wrong.');
      setData((d) => (d ? { ...d, status: body.status, wordpressEventUrl: body.wordpressEventUrl ?? null } : d));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  let content: React.ReactNode;

  if (loadError) {
    content = <p className="text-red-600">{loadError}</p>;
  } else if (!data || !fields) {
    content = <p className="text-gray-500">Loading…</p>;
  } else if (data.status === 'published') {
    content = (
      <div className="flex items-start gap-3">
        <CheckCircleIcon className="h-7 w-7 text-green-600 flex-shrink-0" />
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">Published to the parish calendar.</p>
          {data.wordpressEventUrl && (
            <a href={data.wordpressEventUrl} target="_blank" rel="noreferrer" className="text-sh-primary underline">
              View it on sainthelen.org
            </a>
          )}
          <p className="text-sm text-gray-500 mt-2">Any further changes go through WordPress.</p>
        </div>
      </div>
    );
  } else if (data.status === 'processing') {
    content = <p className="text-gray-500">Still cleaning this one up. Refresh in a minute.</p>;
  } else {
    content = (
      <div className="space-y-6">
        {data.status === 'dismissed' && (
          <p className="text-sm text-gray-500">You dismissed this one. You can still publish it below.</p>
        )}
        {data.submitter && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            From {data.submitter.name}
            {data.submitter.ministry ? ` (${data.submitter.ministry})` : ''} ·{' '}
            <a href={`mailto:${data.submitter.email}`} className="underline">
              {data.submitter.email}
            </a>
          </p>
        )}

        {data.aiError && (
          <div className="rounded-md border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 p-3 text-sm">
            Cleanup didn&apos;t run ({data.aiError}). This is the event exactly as submitted.
          </div>
        )}

        {data.concerns.length > 0 && (
          <div className="rounded-md border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 p-3">
            <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" /> Check before publishing
            </p>
            <ul className="list-disc pl-6 text-sm text-gray-800 dark:text-gray-200 space-y-1">
              {data.concerns.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Title</label>
              <input className={inputClass} value={fields.title} onChange={(e) => set('title', e.target.value)} />
            </div>

            <div>
              <label className={labelClass}>Date(s)</label>
              <div className="space-y-2">
                {fields.dates.map((d, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="date"
                      className={inputClass}
                      value={d}
                      onChange={(e) => set('dates', fields.dates.map((x, j) => (j === i ? e.target.value : x)))}
                    />
                    {fields.dates.length > 1 && (
                      <button
                        type="button"
                        aria-label="Remove date"
                        onClick={() => set('dates', fields.dates.filter((_, j) => j !== i))}
                        className="px-2 text-gray-500 hover:text-red-600"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => set('dates', [...fields.dates, fields.dates.at(-1) || ''])}
                  className="flex items-center gap-1 text-sm text-sh-primary"
                >
                  <PlusIcon className="h-4 w-4" /> Add a date
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Start time (blank for all day)</label>
                <input
                  type="time"
                  className={inputClass}
                  value={fields.startTime}
                  onChange={(e) => set('startTime', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>End time</label>
                <input
                  type="time"
                  className={inputClass}
                  value={fields.endTime}
                  onChange={(e) => set('endTime', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Location</label>
              <input className={inputClass} value={fields.location} onChange={(e) => set('location', e.target.value)} />
            </div>

            <div>
              <label className={labelClass}>Sign-up link</label>
              <input
                type="url"
                className={inputClass}
                value={fields.signUpUrl}
                onChange={(e) => set('signUpUrl', e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                rows={8}
                className={inputClass}
                value={fields.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-5">
            <EventPreview event={fields} />
          </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => submit('publish')}
            className="px-5 py-2.5 rounded-lg bg-green-700 hover:bg-green-800 text-white font-semibold disabled:opacity-50"
          >
            {busy ? 'Publishing…' : 'Publish to calendar'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setEditing((v) => !v)}
            className="px-5 py-2.5 rounded-lg border border-sh-primary text-sh-primary dark:text-white font-semibold disabled:opacity-50"
          >
            {editing ? 'Preview' : 'Edit first'}
          </button>
          {data.status !== 'dismissed' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => submit('dismiss')}
              className="px-5 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:underline disabled:opacity-50"
            >
              Don&apos;t publish
            </button>
          )}
        </div>

        {data.changes.length > 0 && (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white mb-1">What was changed</p>
            <ul className="list-disc pl-6 text-sm text-gray-700 dark:text-gray-300 space-y-1">
              {data.changes.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        <details className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 text-sm">
          <summary className="cursor-pointer font-semibold text-gray-700 dark:text-gray-300">As submitted</summary>
          <div className="mt-3 opacity-80">
            <EventPreview event={data.original} />
          </div>
        </details>

        {data.submitter && data.submitter.fileLinks.length > 0 && (
          <div className="text-sm">
            <p className="font-semibold text-gray-900 dark:text-white mb-1">Attachments</p>
            <ul className="space-y-1">
              {data.submitter.fileLinks.map((url) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sh-primary underline break-all">
                    <PaperClipIcon className="h-4 w-4 flex-shrink-0" /> {fileName(url)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <FrontLayout title="Calendar Review" showHero={false}>
      <div className="max-w-3xl mx-auto my-8 px-4 sm:px-6 lg:px-8">
        <FrontCard>
          <FrontCardContent className="p-6 sm:p-8">{content}</FrontCardContent>
        </FrontCard>
      </div>
    </FrontLayout>
  );
}
