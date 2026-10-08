// app/components/admin/CopyReviewPanel.tsx
//
// The style check in the request panel: Claude's suggested edit of the submitted
// copy, what it changed, and anything to check. For the communications office
// only; the submitter never sees any of this.
'use client';

import { useEffect, useState } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  CheckIcon,
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
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!valid) return <p className="text-sm text-ink-3">The style check runs on requests stored in the new database.</p>;
  if (review === undefined) return <p className="text-sm text-ink-3">Loading…</p>;

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

  const btn = 'inline-flex h-7 items-center gap-1.5 rounded border border-line-2 bg-surface px-2.5 text-xs font-medium text-ink hover:bg-surface-2 disabled:opacity-60';
  const runButton = (label: string) => (
    <button type="button" onClick={runCheck} disabled={running} className={btn}>
      {running ? <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" /> : <SparklesIcon className="h-3.5 w-3.5" />}
      {running ? 'Checking… this can take a minute' : label}
    </button>
  );
  const errorLine = error && <p className="mt-2 text-xs text-status-approval-t">{error}</p>;

  const concerns =
    review && review.concerns.length > 0 ? (
      <ul className="mt-3 flex flex-col gap-1.5">
        {review.concerns.map((c, i) => (
          <li key={i} className="flex gap-2 rounded-r border-l-[3px] border-status-review-d bg-status-review-bg px-3 py-2 text-[13px] text-status-review-t">
            <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 flex-none" />
            <span>{c}</span>
          </li>
        ))}
      </ul>
    ) : null;

  // No check yet (submitted before this existed)
  if (review === null) {
    return (
      <div>
        <p className="mb-2 text-sm text-ink-3">No style check on file for this one.</p>
        {runButton('Suggest an edit')}
        {errorLine}
      </div>
    );
  }

  const stale = review.status === 'processing' && Date.now() - new Date(review.updatedAt).getTime() > STALE_MS;

  if (review.status === 'processing' && !stale) {
    return (
      <p className="inline-flex items-center gap-1.5 text-sm text-ink-3">
        <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" /> Style check running…
      </p>
    );
  }

  if (stale || review.aiError) {
    return (
      <div className="text-sm text-ink-3">
        <p className="mb-2">Style check didn&apos;t finish{review.aiError ? ` (${review.aiError})` : ''}.</p>
        {runButton('Try again')}
        {errorLine}
      </div>
    );
  }

  if (review.unchanged) {
    return (
      <div>
        <p className="inline-flex items-center gap-1.5 text-sm text-status-approved-t">
          <CheckCircleIcon className="h-4 w-4" /> No edits suggested. Reads fine as submitted.
        </p>
        {concerns}
        <div className="mt-3">{runButton('Re-check')}</div>
        {errorLine}
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-hidden rounded border border-line">
        <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-3 py-2 text-[12.5px] font-semibold text-ink-2">
          Suggested edit
          <span className="font-normal text-ink-3">
            {review.changes.length} change{review.changes.length === 1 ? '' : 's'}
            {review.concerns.length ? ` · ${review.concerns.length} to check` : ''}
          </span>
          <span className="flex-1" />
          <button type="button" onClick={() => copy(review.cleaned || '')} className={btn}>
            {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <ClipboardDocumentIcon className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {runButton('Re-check')}
        </div>
        <div className="whitespace-pre-wrap break-words px-3 py-2.5 leading-relaxed">{review.cleaned}</div>
        {review.changes.length > 0 && (
          <ul className="list-disc space-y-0.5 border-t border-line px-3 py-2.5 pl-7 text-[12.5px] text-ink-2">
            {review.changes.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        )}
      </div>
      {errorLine}
      {concerns}
    </div>
  );
}
