// app/api/calendar/add-events/route.ts
//
// Push approved announcements onto the parish calendar.
//
// What changed and why:
//
// 1. This route read announcements out of Airtable while the rest of the app
//    had already moved to Neon. A Neon-era record id never resolved, so the
//    lookup failed before it got anywhere near WordPress.
//
// 2. It POSTed to https://sainthelen.org/wp-json/tribe/events/v1/events, which
//    is The Events Calendar plugin. sainthelen.org does not run that plugin and
//    that path returns 404. Every click went nowhere.
//
// 3. It ignored the calendar fields the form actually collects. It rebuilt a
//    title and a description out of the raw announcement body instead of using
//    calendarEventName, calendarEventLocation, the end time and the sign-up
//    link, none of which existed when it was first written.
//
// It now posts to the Saint Helen Answers plugin at sha/v1/events/intake, which
// is idempotent on the announcement id: pushing the same announcement twice
// updates the draft rather than creating a second event, and it refuses to
// touch anything a person has already published.
//
// Everything lands as a draft on the WordPress side. A form submission is a
// request, not a decision, and the calendar is public.

import { NextRequest, NextResponse } from 'next/server';
import { useNeonDatabase } from '../../../lib/db';
import {
  getAnnouncementById,
  updateWordPressEventInfo,
} from '../../../lib/db/services/announcements';
import { getAirtableBase, TABLE_NAMES } from '../../../lib/airtable';

export const dynamic = 'force-dynamic';

// The Saint Helen Answers plugin, not The Events Calendar. Deliberately a new
// variable name: WP_API_URL is still set to the old tribe path in some
// environments, and silently reusing it would put us straight back on 404s.
const PLUGIN_API_URL =
  process.env.SH_PLUGIN_API_URL || 'https://sainthelen.org/wp-json/sha/v1';

// A WordPress application password belonging to a user with the
// sha_manage_events capability. Application passwords authenticate REST
// requests and need no nonce, which is what makes this work server to server.
const WP_AUTH_USERNAME = process.env.WP_AUTH_USERNAME || '';
const WP_AUTH_PASSWORD = process.env.WP_AUTH_PASSWORD || '';

type EventResult = {
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

type EventError = { recordId: string; error: string };

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
async function loadAnnouncement(recordId: string): Promise<Normalised | null> {
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
async function recordWordPressEvent(recordId: string, eventId: number, eventUrl: string) {
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

async function pushToWordPress(a: Normalised) {
  const auth = Buffer.from(`${WP_AUTH_USERNAME}:${WP_AUTH_PASSWORD}`).toString('base64');

  const categories = ['From the portal'];
  if (a.ministry) categories.push(a.ministry);
  if (a.externalEvent) categories.push('External');

  const res = await fetch(`${PLUGIN_API_URL}/events/intake`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
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
    }),
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

export async function POST(request: NextRequest) {
  try {
    if (!WP_AUTH_USERNAME || !WP_AUTH_PASSWORD) {
      return NextResponse.json(
        {
          success: false,
          error:
            'WP_AUTH_USERNAME and WP_AUTH_PASSWORD are not set. Create a WordPress application password for a user who can manage events, and add both to the environment.',
        },
        { status: 500 }
      );
    }

    const { recordIds } = await request.json();

    if (!Array.isArray(recordIds) || recordIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No record IDs provided' },
        { status: 400 }
      );
    }

    const results: EventResult[] = [];
    const errors: EventError[] = [];

    for (const recordId of recordIds) {
      try {
        const a = await loadAnnouncement(recordId);

        if (!a) {
          errors.push({ recordId, error: 'That announcement is not in the database.' });
          continue;
        }
        if (!a.title) {
          errors.push({
            recordId,
            error: 'No event name. Fill in the calendar event name on the announcement.',
          });
          continue;
        }
        if (!a.dates.length) {
          errors.push({
            recordId,
            error:
              'No usable date. Fill in the event date on the announcement before adding it to the calendar.',
          });
          continue;
        }

        const wp = await pushToWordPress(a);

        results.push({
          recordId,
          eventId: wp.id,
          eventUrl: wp.url,
          editUrl: wp.edit_url,
          dates: wp.dates,
          summary: wp.summary,
          conflicts: Array.isArray(wp.conflicts) ? wp.conflicts.length : 0,
          skipped: !!wp.skipped,
          reason: wp.reason,
        });

        // Nothing to write back when the event was left alone. It already
        // carries the id from the run that created it.
        if (!wp.skipped) {
          await recordWordPressEvent(recordId, wp.id, wp.url);
        }
      } catch (error: any) {
        console.error(`Error processing announcement ${recordId}:`, error);
        errors.push({
          recordId,
          error: error?.message || 'Unknown error creating event',
        });
      }
    }

    const created = results.filter((r) => !r.skipped).length;
    const clashes = results.reduce((n, r) => n + (r.conflicts || 0), 0);

    return NextResponse.json({
      success: true,
      results,
      errors,
      message:
        `${created} event${created === 1 ? '' : 's'} drafted on the calendar` +
        (clashes ? `, ${clashes} room conflict${clashes === 1 ? '' : 's'} to look at` : '') +
        (errors.length ? `, ${errors.length} failed` : '') +
        '. Nothing is public until you publish it in WordPress.',
    });
  } catch (error: any) {
    console.error('Error in add-events route:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create events' },
      { status: 500 }
    );
  }
}
