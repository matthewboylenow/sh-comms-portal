// app/components/admin/CopyReviewPanel.tsx
//
// The style check on an admin card: Claude's suggested edit of the submitted
// copy, what it changed, and anything to check. For the communications office
// only; the submitter never sees any of this.
'use client';

import { useEffect, useState } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

type CopySourceType = 'announcement' | 'website_update';

type CopyReviewData = {
  sourceId: string;
  status: 'processing' | 'ready';
  cleaned: string | null;
  unchanged: boolean;
  changes: string[];
  concerns: string[];
  aiError: string | null;
  updatedAt: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A check still "processing" after this long was cut off
const STALE_MS = 5 * 60 * 1000;

/* ---------------------------------------------------------------------------
 * Batched loading: every panel on the page asks for its own review, and the
 * requests made in the same tick go out as one call per type.
 * ------------------------------------------------------------------------- */

type Entry = CopyReviewData | null; // null = no review yet
const cache = new Map<string, Entry>();
const listeners = new Map<string, Set<(e: Entry) => void>>();
const queued: Record<CopySourceType, Set<string>> = {
  announcement: new Set(),
  website_update: new Set(),
};
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const key = (type: CopySourceType, id: string) => `${type}:${id}`;

function publish(type: CopySourceType, id: string, entry: Entry) {
  cache.set(key(type, id), entry);
  listeners.get(key(type, id))?.forEach((fn) => fn(entry));
}

async function flush() {
  flushTimer = null;
  for (const type of Object.keys(queued) as CopySourceType[]) {
    const ids = Array.from(queued[type]);
    queued[type].clear();
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      try {
        const res = await fetch(`/api/admin/copy-reviews?type=${type}&ids=${chunk.join(',')}`);
        if (!res.ok) continue;
        const { reviews } = (await res.json()) as { reviews: CopyReviewData[] };
        const found = new Map(reviews.map((r) => [r.sourceId, r]));
        chunk.forEach((id) => publish(type, id, found.get(id) ?? null));
      } catch {
        // Leave these unloaded; the panel just doesn't show
      }
    }
  }
}

function request(type: CopySourceType, id: string) {
  if (!id || cache.has(key(type, id))) return;
  queued[type].add(id);
  if (!flushTimer) flushTimer = setTimeout(flush, 0);
}

function useCopyReview(type: CopySourceType, id: string): [Entry | undefined, (e: Entry) => void] {
  const [entry, setEntry] = useState<Entry | undefined>(cache.get(key(type, id)));

  useEffect(() => {
    const k = key(type, id);
    if (!listeners.has(k)) listeners.set(k, new Set());
    listeners.get(k)!.add(setEntry);
    request(type, id);
    return () => {
      listeners.get(k)?.delete(setEntry);
    };
  }, [type, id]);

  return [entry, (e: Entry) => publish(type, id, e)];
}

/* ------------------------------------------------------------------ panel */

export default function CopyReviewPanel({ type, sourceId }: { type: CopySourceType; sourceId: string }) {
  const valid = UUID_RE.test(sourceId);
  const [review, setReview] = useCopyReview(type, valid ? sourceId : '');
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!valid || review === undefined) return null;

  async function runCheck() {
    setRunning(true);
    setError('');
    try {
      const res = await fetch('/api/admin/copy-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, sourceId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Style check failed');
      setReview(body.review);
      setOpen(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const smallButton =
    'inline-flex items-center gap-1.5 text-xs font-medium text-sh-navy dark:text-sh-navy-300 hover:underline disabled:opacity-60';

  const runButton = (label: string) => (
    <button onClick={runCheck} disabled={running} className={smallButton}>
      {running ? <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" /> : <SparklesIcon className="w-3.5 h-3.5" />}
      {running ? 'Checking… this can take a minute' : label}
    </button>
  );

  const errorLine = error && <p className="text-xs text-red-600 mt-1">{error}</p>;

  // No check yet (submitted before this existed)
  if (review === null) {
    return (
      <div className="mt-3">
        {runButton('Suggest an edit')}
        {errorLine}
      </div>
    );
  }

  const stale =
    review.status === 'processing' && Date.now() - new Date(review.updatedAt).getTime() > STALE_MS;

  if (review.status === 'processing' && !stale) {
    return (
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-500">
        <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" /> Style check running…
      </p>
    );
  }

  if (stale || review.aiError) {
    return (
      <div className="mt-3 text-xs text-gray-500">
        Style check didn&apos;t finish{review.aiError ? ` (${review.aiError})` : ''}. {runButton('Try again')}
        {errorLine}
      </div>
    );
  }

  const concerns =
    review.concerns.length > 0 ? (
      <div className="rounded-md border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
          <ExclamationTriangleIcon className="w-4 h-4" /> Check
        </p>
        <ul className="list-disc pl-5 text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
          {review.concerns.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>
    ) : null;

  if (review.unchanged) {
    return (
      <div className="mt-3 space-y-2">
        <p className="inline-flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400">
          <CheckCircleIcon className="w-4 h-4" /> Style check: no edits suggested
        </p>
        {concerns}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-sh-navy/20 dark:border-slate-600 bg-sh-navy-50/60 dark:bg-slate-700/40">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-sh-navy dark:text-white">
          <SparklesIcon className="w-4 h-4" />
          Suggested edit
          <span className="font-normal text-xs text-gray-500 dark:text-gray-400">
            {review.changes.length} change{review.changes.length === 1 ? '' : 's'}
            {review.concerns.length ? ` · ${review.concerns.length} to check` : ''}
          </span>
        </span>
        {open ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3">
          <div className="rounded-md bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 p-3 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
            {review.cleaned}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button onClick={() => copy(review.cleaned || '')} className={smallButton}>
              {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <ClipboardDocumentIcon className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy suggested text'}
            </button>
            {runButton('Re-check')}
          </div>
          {errorLine}

          {review.changes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">What changed</p>
              <ul className="list-disc pl-5 text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                {review.changes.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          {concerns}
        </div>
      )}
    </div>
  );
}
