// app/context/RequestsContext.tsx
// One fetch of the admin request tables, shared by the sidebar counts, the
// Inbox and the detail panel. Pages mutate locally through patch() and call
// refresh() after a write.
'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toRequests, type ApiRecord, type ApiTable, type PortalRequest } from '../lib/requests';

type RequestsContextType = {
  requests: PortalRequest[];
  loading: boolean;
  error: string | null;
  loadedAt: Date | null;
  refresh: () => Promise<void>;
  /** Optimistic local update of one record's fields. */
  patch: (id: string, fields: Record<string, unknown>) => void;
  /** Move a request between board stages; writes to the server and rolls back on failure. */
  move: (req: PortalRequest, to: MoveTarget) => Promise<void>;
};

export type MoveTarget = 'review' | 'approved' | 'done';

const Ctx = createContext<RequestsContextType | undefined>(undefined);

export function RequestsProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [payload, setPayload] = useState<Partial<Record<ApiTable, ApiRecord[]>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const inflight = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async () => {
    if (inflight.current) return inflight.current;
    const run = (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/fetchRequests?includeCompleted=true&ts=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (!res.ok) throw new Error(`Could not load requests (${res.status})`);
        const data = await res.json();
        setPayload({
          announcements: data.announcements || [],
          websiteUpdates: data.websiteUpdates || [],
          smsRequests: data.smsRequests || [],
          avRequests: data.avRequests || [],
          flyerReviews: data.flyerReviews || [],
          graphicDesign: data.graphicDesign || [],
        });
        setLoadedAt(new Date());
      } catch (e: any) {
        setError(e?.message || 'Could not load requests');
      } finally {
        setLoading(false);
        inflight.current = null;
      }
    })();
    inflight.current = run;
    return run;
  }, []);

  useEffect(() => {
    if (status === 'authenticated') refresh();
  }, [status, refresh]);

  const patch = useCallback((id: string, fields: Record<string, unknown>) => {
    setPayload((prev) => {
      const next: typeof prev = {};
      (Object.keys(prev) as ApiTable[]).forEach((t) => {
        next[t] = (prev[t] || []).map((r) => (r.id === id ? { ...r, fields: { ...r.fields, ...fields } } : r));
      });
      return next;
    });
  }, []);

  const requests = useMemo(() => toRequests(payload), [payload]);

  const move = useCallback(
    async (req: PortalRequest, to: MoveTarget) => {
      if (req.status === to) return;
      const post = (url: string, body: unknown) =>
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(async (res) => {
          if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Could not move that (${res.status})`);
        });
      try {
        if (to === 'done') {
          patch(req.id, { Completed: true, 'Completed Date': new Date().toISOString() });
          await post('/api/admin/markCompleted', { table: req.table, recordId: req.id, completed: true });
          return;
        }
        // Coming back from published: reopen first, then place it
        if (req.status === 'done') {
          patch(req.id, { Completed: false });
          await post('/api/admin/markCompleted', { table: req.table, recordId: req.id, completed: false });
        }
        // A pending ministry approval is a real approval when dragged to Approved
        if (to === 'approved' && req.status === 'approval') {
          patch(req.id, { 'Approval Status': 'approved', Stage: 'approved' });
          await post('/api/admin/approvals', { recordId: req.id, action: 'approve' });
        } else {
          patch(req.id, { Stage: to, 'Submitted At': req.submittedAt });
        }
        await post('/api/admin/stage', { table: req.table, recordId: req.id, stage: to });
      } catch (e) {
        await refresh();
        throw e;
      }
    },
    [patch, refresh]
  );

  return <Ctx.Provider value={{ requests, loading, error, loadedAt, refresh, patch, move }}>{children}</Ctx.Provider>;
}

export function useRequests() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useRequests must be used inside RequestsProvider');
  return c;
}
