// app/components/ui/MinistryPicker.tsx
// A type-ahead that snaps to a ministry on the parish list. Typing
// "abide: young adult" or "yash" lands on "Abide Young Adult Ministry";
// typing something that matches nothing leaves the field unset until the
// person explicitly chooses "Other" and names the group. So the value a form
// sends is always either a listed ministry or "Other: <name>".
'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Input } from './Field';

export interface MinistryOption {
  id: string;
  name: string;
  aliases?: string[];
  requiresApproval: boolean;
  approvalCoordinator?: string;
  description?: string;
  active: boolean;
}

const NONE = '__none__';

/** lower-case letters and digits only, so punctuation and spacing never matter */
const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !['the', 'of', 'and', 'ministry', 'group', 'saint', 'st', 'helen'].includes(w));

/** 0 = no match; higher is better. */
function score(m: MinistryOption, q: string): number {
  const sq = squash(q);
  if (!sq) return 0;
  const names = [m.name, ...(m.aliases || [])];
  let best = 0;
  for (const n of names) {
    const sn = squash(n);
    if (sn === sq) best = Math.max(best, 100);
    else if (sn.startsWith(sq)) best = Math.max(best, 80);
    else if (sn.includes(sq)) best = Math.max(best, 60);
    else {
      // every typed word starts some word of the name ("abide young" → Abide Young Adult Ministry)
      const qw = words(q);
      const nw = words(n);
      if (qw.length && qw.every((w) => nw.some((x) => x.startsWith(w)))) best = Math.max(best, 40 + Math.min(qw.length, 5));
    }
  }
  return best;
}

export default function MinistryPicker({
  value,
  onChange,
  onApprovalStatusChange,
  id,
  required = false,
  allowNone = false,
  noneLabel = 'No particular ministry',
}: {
  value: string;
  onChange: (value: string, ministry?: MinistryOption) => void;
  onApprovalStatusChange?: (requiresApproval: boolean, ministry?: MinistryOption) => void;
  id?: string;
  required?: boolean;
  allowNone?: boolean;
  noneLabel?: string;
}) {
  const listId = useId();
  const [all, setAll] = useState<MinistryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const [other, setOther] = useState(false);
  const [otherName, setOtherName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  // True while the person is typing something uncommitted, so a value of ''
  // from the form means "nothing chosen yet", not "wipe the box".
  const typing = useRef(false);

  useEffect(() => {
    fetch('/api/admin/ministries')
      .then((r) => (r.ok ? r.json() : { ministries: [] }))
      .then((d) => setAll((d.ministries || []).filter((m: MinistryOption) => m.active)))
      .catch(() => setAll([]))
      .finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(() => [...all].sort((a, b) => a.name.localeCompare(b.name)), [all]);

  // The option the committed value points at (exact name or alias)
  const chosen = useMemo(() => sorted.find((m) => score(m, value) === 100), [sorted, value]);

  // Keep the box in step with the committed value (form reset, prefill)
  useEffect(() => {
    if (chosen) {
      setText(chosen.name);
      setOther(false);
    } else if (value === NONE) {
      setText(noneLabel);
      setOther(false);
    } else if (/^Other:\s*/i.test(value)) {
      setOther(true);
      setOtherName(value.replace(/^Other:\s*/i, ''));
      setText('Other');
    } else if (!value && !typing.current) {
      setText('');
      setOther(false);
      setOtherName('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, chosen]);

  useEffect(() => {
    onApprovalStatusChange?.(chosen?.requiresApproval || false, chosen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen]);

  const matches = useMemo(() => {
    const q = text.trim();
    if (!q || q === noneLabel || (chosen && q === chosen.name)) return sorted;
    return sorted
      .map((m) => ({ m, s: score(m, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.m.name.localeCompare(b.m.name))
      .map((x) => x.m);
  }, [text, sorted, chosen, noneLabel]);

  const pick = (m: MinistryOption) => {
    typing.current = false;
    setOther(false);
    setText(m.name);
    setOpen(false);
    onChange(m.name, m);
    inputRef.current?.blur();
  };
  const pickNone = () => {
    typing.current = false;
    setOther(false);
    setText(noneLabel);
    setOpen(false);
    onChange(NONE);
  };
  const pickOther = () => {
    typing.current = false;
    setOther(true);
    setOpen(false);
    setText('Other');
    const seed = otherName || (text.trim() && text.trim() !== 'Other' ? text.trim() : '');
    setOtherName(seed);
    onChange(seed ? `Other: ${seed}` : '');
  };

  /** On leaving the box: snap to the best match, or clear so nothing slips through as free text. */
  const settle = () => {
    setOpen(false);
    const q = text.trim();
    if (!q || other) return;
    if (chosen && q === chosen.name) return;
    if (allowNone && q === noneLabel) return;
    const best = sorted.map((m) => ({ m, s: score(m, q) })).sort((a, b) => b.s - a.s)[0];
    if (best && best.s >= 40) {
      pick(best.m);
    } else {
      // Nothing close. Keep what they typed visible but commit nothing; they must choose Other.
      onChange('');
    }
  };

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) settle();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, chosen, other, sorted]);

  const unmatched = !other && !!text.trim() && !chosen && value !== NONE && matches.length === 0;
  const rows: Array<{ key: string; label: string; sub?: string; act: () => void; kind?: 'none' | 'other' }> = [
    ...(allowNone ? [{ key: NONE, label: noneLabel, act: pickNone, kind: 'none' as const }] : []),
    ...matches.map((m) => ({
      key: m.id,
      label: m.name,
      sub: m.requiresApproval ? 'Needs coordinator approval' : undefined,
      act: () => pick(m),
    })),
    { key: '__other', label: 'Other (not on the list)', act: pickOther, kind: 'other' as const },
  ];

  return (
    <div ref={boxRef} className="relative flex max-w-[360px] flex-col gap-2">
      <Input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        value={text}
        placeholder={loading ? 'Loading…' : 'Start typing a ministry'}
        disabled={loading}
        required={required && !other}
        onFocus={() => {
          setOpen(true);
          setHi(0);
          if (chosen || value === NONE) inputRef.current?.select();
        }}
        onChange={(e) => {
          typing.current = true;
          setText(e.target.value);
          setOpen(true);
          setHi(0);
          if (other) {
            setOther(false);
            onChange('');
          } else if (chosen || value === NONE) {
            onChange('');
          }
        }}
        onKeyDown={(e) => {
          if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            setOpen(true);
            return;
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHi((h) => Math.min(h + 1, rows.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHi((h) => Math.max(h - 1, 0));
          } else if (e.key === 'Enter') {
            if (open && rows[hi]) {
              e.preventDefault();
              rows[hi].act();
            } else {
              e.preventDefault();
              settle();
            }
          } else if (e.key === 'Tab') {
            settle();
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
      />

      {open && !loading && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 top-[42px] z-20 max-h-64 w-full overflow-y-auto rounded-md border border-line bg-surface py-1 shadow-pop"
        >
          {rows.map((r, i) => (
            <li
              key={r.key}
              role="option"
              aria-selected={i === hi}
              onMouseDown={(e) => {
                e.preventDefault();
                r.act();
              }}
              onMouseEnter={() => setHi(i)}
              className={`cursor-pointer px-3 py-1.5 text-sm ${i === hi ? 'bg-navy-soft text-ink' : 'text-ink'} ${
                r.kind === 'other' ? 'border-t border-line text-ink-2' : ''
              } ${r.kind === 'none' ? 'text-ink-2' : ''}`}
            >
              {r.label}
              {r.sub && <span className="ml-2 text-xs text-ink-3">{r.sub}</span>}
            </li>
          ))}
          {matches.length === 0 && (
            <li className="px-3 py-1.5 text-xs text-ink-3">Nothing on the list matches &ldquo;{text.trim()}&rdquo;.</li>
          )}
        </ul>
      )}

      {other && (
        <Input
          value={otherName}
          onChange={(e) => {
            setOtherName(e.target.value);
            onChange(e.target.value.trim() ? `Other: ${e.target.value.trim()}` : '');
          }}
          placeholder="Name of the group"
          aria-label="Name of the group"
          required={required}
          autoFocus
        />
      )}

      {unmatched && !open && (
        <p className="text-xs text-status-review-t">
          &ldquo;{text.trim()}&rdquo; is not on the list. Pick the closest match, or choose Other and give us the name.
        </p>
      )}
      {chosen?.requiresApproval && (
        <p className="text-xs text-ink-3">Announcements for {chosen.name} are approved by the Coordinator of Adult Discipleship before they run.</p>
      )}
    </div>
  );
}
