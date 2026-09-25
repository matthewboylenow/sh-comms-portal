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

const HINTS: Record<CopyKind, string> = {
  announcement:
    'Write it the way you’d tell a neighbor. Short and plain beats polished, and we’ll tidy it up.',
  website_update:
    'Say which page, what should change, and the wording you’d like. Plain and specific beats polished, and we’ll tidy it up.',
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
    <div className="mt-2 space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">{HINTS[kind]}</p>
        <button
          type="button"
          onClick={tighten}
          disabled={loading || value.trim().length < MIN_LENGTH}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-sh-primary/40 text-sh-primary dark:text-white dark:border-gray-500 hover:bg-sh-primary/5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
          {loading ? 'Working on it…' : 'Tighten this up'}
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {looksGood && current && (
        <p className="inline-flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400">
          <CheckCircleIcon className="w-4 h-4" /> Looks good as is.
        </p>
      )}

      {suggestion && current && (
        <div className="rounded-md border border-sh-primary/30 bg-sh-primary/5 dark:bg-gray-700/50 p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Suggested version</p>
          <div className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words">{suggestion}</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={useSuggestion}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-sh-primary text-white hover:bg-sh-primary-dark"
            >
              Use this
            </button>
            <button
              type="button"
              onClick={() => setSuggestion(null)}
              className="px-3 py-1.5 text-xs font-medium rounded-md text-gray-600 dark:text-gray-300 hover:underline"
            >
              Keep mine
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
