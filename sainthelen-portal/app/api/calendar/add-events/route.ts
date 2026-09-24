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
import {
  WP_AUTH_USERNAME,
  WP_AUTH_PASSWORD,
  loadAnnouncement,
  pushToWordPress,
  recordWordPressEvent,
  type EventResult,
  type EventError,
} from '../../../lib/wordpress-events';

export const dynamic = 'force-dynamic';

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
