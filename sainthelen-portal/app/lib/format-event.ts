// app/lib/format-event.ts
// Human-readable event dates and times, shared by the review email and page.

import type { CalendarEventFields } from './db/schema';

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatWhen(e: CalendarEventFields): string {
  const days = e.dates.map((d) =>
    new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    })
  );
  const dayText = days.length > 2 ? `${days.slice(0, -1).join(', ')}, and ${days.at(-1)}` : days.join(' and ');
  if (!e.startTime) return `${dayText || 'No date'} (all day)`;
  return `${dayText}, ${formatTime(e.startTime)}${e.endTime ? ` to ${formatTime(e.endTime)}` : ''}`;
}
