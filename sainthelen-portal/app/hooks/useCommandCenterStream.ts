// app/hooks/useCommandCenterStream.ts
// Lightweight polling replacement for the SSE stream that was causing
// runaway Vercel serverless invocations. Polls every 10 minutes + manual refresh.

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface UseCommandCenterPollingOptions {
  onRefresh?: () => void;
  autoRefresh?: boolean;
  /** Polling interval in milliseconds. Default: 600000 (10 minutes) */
  intervalMs?: number;
}

export default function useCommandCenterStream(options: UseCommandCenterPollingOptions = {}) {
  const { status } = useSession();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onRefreshRef = useRef(options.onRefresh);
  onRefreshRef.current = options.onRefresh;

  const refresh = useCallback(() => {
    onRefreshRef.current?.();
  }, []);

  useEffect(() => {
    if (status !== 'authenticated' || options.autoRefresh === false) {
      return;
    }

    const interval = options.intervalMs ?? 600_000; // 10 minutes
    intervalRef.current = setInterval(() => {
      onRefreshRef.current?.();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, options.autoRefresh, options.intervalMs]);

  return {
    refresh,
  };
}
