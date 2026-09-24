// app/lib/wordpress-events.ts
//
// Drafts announcements onto the parish calendar through the Saint Helen
// Answers plugin (sha/v1/events/intake). Shared by the admin "Add to Calendar"
// action and the announcement form, which drafts the event on submit.
//
// The intake endpoint is idempotent on the announcement id: pushing the same
// announcement twice updates the draft rather than creating a second event,
// and it refuses to touch anything a person has already published.

import { useNeonDatabase } from './db';
import {
  getAnnouncementById,
  updateWordPressEventInfo,
} from './db/services/announcements';
import { getAirtableBase, TABLE_NAMES } from './airtable';

// The Saint Helen Answers plugin, not The Events Calendar. Deliberately a new
// variable name: WP_API_URL is still set to the old tribe path in some
// environments, and silently reusing it would put us straight back on 404s.
const PLUGIN_API_URL =
  process.env.SH_PLUGIN_API_URL || 'https://sainthelen.org/wp-json/sha/v1';

// A WordPress application password belonging to a user with the
// sha_manage_events capability. Application passwords authenticate REST
// requests and need no nonce, which is what makes this work server to server.
export const WP_AUTH_USERNAME = process.env.WP_AUTH_USERNAME || '';
export const WP_AUTH_PASSWORD = process.env.WP_AUTH_PASSWORD || '';

const WP_REQUEST_TIMEOUT_MS = 10000;

export type EventResult = {
  recordId: string;
  eventId: number;
  eventUrl: string;
  editUrl: string;
  // Extra detail the admin can show but does not have to.
  dates?: string[];
  summary?: string;
  conflicts?: number;
  skipped?: boolean;
  reason?: string;
};

export type EventError = { recordId: string; error: string };

/** The shape both storage backends get normalised into. */
type Normalised = {
  id: string;
  title: string;
  description: string;
  dates: string[];
  startTime: string;
  endTime: string;
  location: string;
  contact: string;
  signUpUrl: string;
  ministry: string;
  externalEvent: boolean;
};

function str(v: unknown): string {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

/** YYYY-MM-DD out of a date, a Date, or the MM/DD/YY the old Airtable rows use. */
function toISODate(v: unknown): string {
  const s = str(v);
  if (!s) return '';

  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  if (s.includes('/')) {
    const [m, d, y] = s.split('/');
    if (m && d && y) {
      const year = Number(y) < 100 ? 2000 + Number(y) : Number(y);
      return `${year}-${String(Number(m)).padStart(2, '0')}-${String(Number(d)).padStart(2, '0')}`;
    }
  }

  // Anything else: let Date have a go, but only trust it if it parses.
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return '';
}

/** HH:MM out of "19:00", "19:00:00" or "7:00 PM". */
function toHHMM(v: unknown): string {
  const s = str(v);
  if (!s) return '';

  const ampm = s.match(/^(\d{1,2}):(\d{2})\s*([AaPp])\.?[Mm]\.?$/);
  if (ampm) {
    let h = Number(ampm[1]) % 12;
    if (ampm[3].toLowerCase() === 'p') h += 12;
    return `${String(h).padStart(2, '0')}:${ampm[2]}`;
  }

  const plain = s.match(/^(\d{1,2}):(\d{2})/);
  if (plain) {
    return `${String(Number(plain[1])).padStart(2, '0')}:${plain[2]}`;
  }
  return '';
}

function uniqueSorted(dates: string[]): string[] {
  return Array.from(new Set(dates.filter(Boolean))).sort();
}

/**
 * Read one announcement, from wherever this deployment keeps them.
 *
 * The calendar fields win when the submitter filled them in, because those are
 * the ones the form asks for specifically so that the event reads properly.
 * The general announcement fields are the fallback.
 */
export async function loadAnnouncement(recordId: string): Promise<Normalised | null> {
  if (useNeonDatabase()) {
    const a = await getAnnouncementById(recordId);
    if (!a) return null;

    const primary = toISODate(a.calendarEventDate || a.dateOfEvent);
    const extra = Array.isArray(a.eventDates)
      ? a.eventDates.map((d) => toISODate(d?.date)).filter(Boolean)
      : [];

    return {
      id: a.id,
      title: str(a.calendarEventName) || str(a.ministry) || '',
      description: str(a.calendarEventDescription) || str(a.announcementBody),
      dates: uniqueSorted([primary, ...extra]),
      startTime: toHHMM(a.calendarEventStartTime || a.timeOfEvent),
      endTime: toHHMM(a.calendarEventEndTime),
      location: str(a.calendarEventLocation),
      contact: str(a.name),
      signUpUrl: str(a.calendarEventSignUpLink) || str(a.signUpUrl),
      ministry: str(a.ministry),
      externalEvent: !!a.externalEvent,
    };
  }

  // Legacy Airtable rows, kept working so a deployment that has not flipped
  // USE_NEON_DB yet does not break.
  const base = getAirtableBase();
  const record = await base(TABLE_NAMES.ANNOUNCEMENTS).find(recordId);

  return {
    id: recordId,
    title: str(record.get('Name')) || str(record.get('Ministry')) || '',
    description: str(record.get('Announcement Body')),
    dates: uniqueSorted([toISODate(record.get('Date of Event'))]),
    startTime: toHHMM(record.get('Time of Event')),
    endTime: '',
    location: '',
    contact: str(record.get('Name')),
    signUpUrl: str(record.get('Sign-Up URL')),
    ministry: str(record.get('Ministry')),
    externalEvent: false,
  };
}

/** Record the WordPress id back on the announcement, whichever store it is in. */
export async function recordWordPressEvent(recordId: string, eventId: number, eventUrl: string) {
  if (useNeonDatabase()) {
    await updateWordPressEventInfo(recordId, eventId, eventUrl);
    return;
  }
  const base = getAirtableBase();
  await base(TABLE_NAMES.ANNOUNCEMENTS).update([
    {
      id: recordId,
      fields: {
        'WordPress Event ID': eventId,
        'WordPress Event URL': eventUrl,
      },
    },
  ]);
}

/** Authenticated call to the plugin. Throws with WordPress's own message on failure. */
async function pluginRequest(path: string, init: { method: string; body?: unknown }) {
  const auth = Buffer.from(`${WP_AUTH_USERNAME}:${WP_AUTH_PASSWORD}`).toString('base64');

  const res = await fetch(`${PLUGIN_API_URL}${path}`, {
    method: init.method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    // Don't let a slow WordPress hold a form submission hostage
    signal: AbortSignal.timeout(WP_REQUEST_TIMEOUT_MS),
  });

  const text = await res.text();
  let body: any = null;
  try {
    body = JSON.parse(text);
  } catch {
    // Fall through. The raw text is more useful than a parse error.
  }

  if (!res.ok) {
    const message =
      (body && (body.message || body.error)) || text.slice(0, 300) || `HTTP ${res.status}`;
    throw new Error(`WordPress refused it (${res.status}): ${message}`);
  }

  return body;
}

export async function pushToWordPress(a: Normalised) {
  const categories = ['From the portal'];
  if (a.ministry) categories.push(a.ministry);
  if (a.externalEvent) categories.push('External');

  return pluginRequest('/events/intake', {
    method: 'POST',
    body: {
      // The announcement id is what makes this safe to run twice.
      announcement_id: a.id,
      title: a.title,
      description: a.description,
      dates: a.dates,
      start_time: a.startTime,
      end_time: a.endTime,
      all_day: !a.startTime,
      location: a.location,
      contact: a.contact,
      signup_url: a.signUpUrl,
      cta_label: a.signUpUrl ? 'Sign up' : '',
      categories,
    },
  });
}

/**
 * Publish an event that intake left as a draft. The plugin's save endpoint
 * replaces the whole event, so read it back and send every field with only
 * the status changed.
 */
export async function publishWordPressEvent(eventId: number): Promise<{ url: string }> {
  const event = await pluginRequest(`/events/${eventId}`, { method: 'GET' });
  if (event.status !== 'publish') {
    // preview and conflicts are computed on read, not fields to save
    const { preview, conflicts, ...fields } = event;
    const saved = await pluginRequest(`/events/${eventId}`, {
      method: 'POST',
      body: { ...fields, status: 'publish' },
    });
    return { url: saved?.event?.permalink || event.permalink || '' };
  }
  return { url: event.permalink || '' };
}
