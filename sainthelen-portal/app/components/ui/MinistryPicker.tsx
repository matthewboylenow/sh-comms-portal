// app/components/ui/MinistryPicker.tsx
// A required choice from the parish's ministry list, with "Other" for the
// rare group that is not on it. A picked ministry is reported back with its
// record, so the form can say up front when a coordinator's approval is
// needed and the server can link the request to the right ministry.
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Select, Input } from './Field';

export interface MinistryOption {
  id: string;
  name: string;
  aliases?: string[];
  requiresApproval: boolean;
  approvalCoordinator?: string;
  description?: string;
  active: boolean;
}

const OTHER = '__other__';

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
  /** Offer a "no particular ministry" choice (photos, A/V) */
  allowNone?: boolean;
  noneLabel?: string;
}) {
  const [all, setAll] = useState<MinistryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'other'>('list');
  const [other, setOther] = useState('');

  useEffect(() => {
    fetch('/api/admin/ministries')
      .then((r) => (r.ok ? r.json() : { ministries: [] }))
      .then((d) => setAll((d.ministries || []).filter((m: MinistryOption) => m.active)))
      .catch(() => setAll([]))
      .finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(() => [...all].sort((a, b) => a.name.localeCompare(b.name)), [all]);

  // Work out which option the current value corresponds to
  const match = useMemo(
    () =>
      sorted.find(
        (m) =>
          m.name.toLowerCase() === value.toLowerCase() ||
          (m.aliases || []).some((a) => a.toLowerCase() === value.toLowerCase())
      ),
    [sorted, value]
  );

  useEffect(() => {
    if (loading) return;
    if (value && !match && mode !== 'other') {
      setMode('other');
      setOther(value.replace(/^Other: /, ''));
    }
    onApprovalStatusChange?.(match?.requiresApproval || false, match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, match, loading]);

  const selectValue = mode === 'other' ? OTHER : match ? match.name : value === '' ? '' : OTHER;

  return (
    <div className="flex max-w-[360px] flex-col gap-2">
      <Select
        id={id}
        value={selectValue}
        required={required}
        disabled={loading}
        onChange={(e) => {
          const v = e.target.value;
          if (v === OTHER) {
            setMode('other');
            onChange(other ? `Other: ${other}` : '');
            return;
          }
          setMode('list');
          const m = sorted.find((x) => x.name === v);
          onChange(v, m);
        }}
      >
        <option value="">{loading ? 'Loading…' : 'Choose a ministry…'}</option>
        {allowNone && <option value="__none__">{noneLabel}</option>}
        {sorted.map((m) => (
          <option key={m.id} value={m.name}>
            {m.name}
          </option>
        ))}
        <option value={OTHER}>Other (not on the list)</option>
      </Select>
      {mode === 'other' && (
        <Input
          value={other}
          onChange={(e) => {
            setOther(e.target.value);
            onChange(e.target.value ? `Other: ${e.target.value}` : '');
          }}
          placeholder="Name of the group"
          aria-label="Name of the group"
          required={required}
        />
      )}
      {match?.requiresApproval && (
        <p className="text-xs text-ink-3">
          Announcements for {match.name} are approved by the Coordinator of Adult Discipleship before they run.
        </p>
      )}
    </div>
  );
}
