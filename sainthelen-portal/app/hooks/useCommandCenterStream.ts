// app/hooks/useCommandCenterStream.ts

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

export type StreamEventType =
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'task_deleted'
  | 'note_created'
  | 'note_updated'
  | 'note_deleted'
  | 'submission_created'
  | 'deadline_approaching'
  | 'connected'
  | 'heartbeat';

export interface StreamEvent {
  type: StreamEventType;
  data: any;
  timestamp: string;
}

interface UseCommandCenterStreamOptions {
  onEvent?: (event: StreamEvent) => void;
  onTaskEvent?: (event: StreamEvent) => void;
  onNoteEvent?: (event: StreamEvent) => void;
  onSubmissionEvent?: (event: StreamEvent) => void;
  autoConnect?: boolean;
}

export default function useCommandCenterStream(options: UseCommandCenterStreamOptions = {}) {
  const { data: session, status } = useSession();
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<StreamEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (status !== 'authenticated' || !session?.user?.email) {
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource('/api/command-center/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as StreamEvent;
          setLastEvent(data);

          // Call general event handler
          options.onEvent?.(data);

          // Call specific handlers based on event type
          if (data.type.startsWith('task_')) {
            options.onTaskEvent?.(data);
          } else if (data.type.startsWith('note_')) {
            options.onNoteEvent?.(data);
          } else if (data.type === 'submission_created') {
            options.onSubmissionEvent?.(data);
          }
        } catch (err) {
          console.error('Error parsing SSE event:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE connection error:', err);
        setConnected(false);
        eventSource.close();

        // Attempt reconnection with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setError('Connection lost. Please refresh the page.');
        }
      };
    } catch (err: any) {
      console.error('Error creating EventSource:', err);
      setError(err.message || 'Failed to connect to stream');
    }
  }, [session, status, options]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setConnected(false);
    reconnectAttempts.current = 0;
  }, []);

  // Auto-connect when authenticated
  useEffect(() => {
    if (status === 'authenticated' && options.autoConnect !== false) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [status, connect, disconnect, options.autoConnect]);

  return {
    connected,
    lastEvent,
    error,
    connect,
    disconnect,
  };
}
