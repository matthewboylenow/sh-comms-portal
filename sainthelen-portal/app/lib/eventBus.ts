import { EventEmitter } from 'events';

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20);
  }
}

const globalForEventBus = globalThis as unknown as { eventBus: EventBus };

const eventBus = globalForEventBus.eventBus ?? new EventBus();

if (process.env.NODE_ENV !== 'production') {
  globalForEventBus.eventBus = eventBus;
}

export type SSEEvent = {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
};

export function emitEvent(type: string, data: Record<string, unknown>) {
  const event: SSEEvent = {
    type,
    data,
    timestamp: new Date().toISOString(),
  };
  eventBus.emit('sse', event);
}

export function onEvent(callback: (event: SSEEvent) => void) {
  eventBus.on('sse', callback);
}

export function offEvent(callback: (event: SSEEvent) => void) {
  eventBus.off('sse', callback);
}
