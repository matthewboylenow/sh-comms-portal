// app/components/CopyAssist.tsx
//
// Sits under a form's main text box: a line on how to write for the parish,
// and an optional "Tighten this up" button that suggests an edit the submitter
// can take or leave. It never blocks submitting and never comments on how the
// text was written.
'use client';

import { useState } from 'react';
import { ArrowPathIcon, CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';

type CopyKind = 'announcement' | 'website_update';

// Echoes the quick reference card in the Saint Helen Writing Guide
const HINTS: Record<CopyKind, string> = {
  announcement: 'We edit for length and voice. Your facts and contact stay.',
  website_update: 'We edit for voice and house style. Your facts and links stay.',
};

const MIN_LENGTH = 30;

export default function CopyAssist({
  kind,
  value,
  onChange,
}: {
  kind: CopyKind;
  value: string;
  onChange: (text: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [suggestedFor, setSuggestedFor] = useState('');
  const [looksGood, setLooksGood] = useState(false);
  const [error, setError] = useState('');

  // A suggestion only applies to the text it was made for
  const current = suggestedFor === value;

  async function tighten() {
    setLoading(true);
    setError('');
    setSuggestion(null);
    setLooksGood(false);
    try {
      const res = await fetch('/api/copy-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, text: value }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Couldn’t come up with a suggestion.');
      setSuggestedFor(value);
      if (body.unchanged) setLooksGood(true);
      else setSuggestion(body.suggestion);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function useSuggestion() {
    if (!suggestion) return;
    onChange(suggestion);
    setSuggestion(null);
  }

  return (
    <div className="mt-1.5 space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <p className="text-xs text-ink-3">{HINTS[kind]}</p>
        <button
          type="button"
          onClick={tighten}
          disabled={loading || value.trim().length < MIN_LENGTH}
          className="inline-flex h-7 flex-shrink-0 items-center gap-1.5 rounded border border-line-2 bg-surface px-2.5 text-xs font-medium text-ink hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
          {loading ? 'Working on it…' : 'Tighten this up'}
        </button>
      </div>

      {error && <p className="text-xs text-status-approval-t">{error}</p>}

      {looksGood && current && (
        <p className="inline-flex items-center gap-1.5 text-xs text-status-approved-t">
          <CheckCircleIcon className="w-4 h-4" /> Looks good as is.
        </p>
      )}

      {suggestion && current && (
        <div className="space-y-2 rounded border border-line bg-surface-2 p-3">
          <p className="text-xs font-semibold text-ink-3">Suggested version</p>
          <div className="whitespace-pre-wrap break-words text-sm text-ink">{suggestion}</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={useSuggestion}
              className="inline-flex h-7 items-center rounded bg-navy px-2.5 text-xs font-medium text-on-navy hover:bg-navy-hover"
            >
              Use this
            </button>
            <button
              type="button"
              onClick={() => setSuggestion(null)}
              className="inline-flex h-7 items-center px-2 text-xs font-medium text-ink-2 hover:underline"
            >
              Keep mine
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
