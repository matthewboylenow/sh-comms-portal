// app/api/calendar-review/[token]/route.ts
//
// Backs the review page linked from the calendar review email. The token in
// the URL is the credential: it's 48 random hex characters, sent only to the
// communications office, and stops working for publishing once used.

import { NextRequest, NextResponse } from 'next/server';
import {
  getCalendarReviewByToken,
  updateCalendarReview,
} from '../../../lib/db/services/calendar-reviews';
import { getAnnouncementById } from '../../../lib/db/services/announcements';
import { publishCalendarReview } from '../../../lib/calendar-review';
import type { CalendarEventFields } from '../../../lib/db/schema';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Params = { params: { token: string } };

export async function GET(_request: NextRequest, { params }: Params) {
  const review = await getCalendarReviewByToken(params.token);
  if (!review) {
    return NextResponse.json({ error: 'This review link is not valid.' }, { status: 404 });
  }
  const announcement = await getAnnouncementById(review.announcementId);

  return NextResponse.json({
    status: review.status,
    original: review.original,
    cleaned: review.cleaned || review.original,
    changes: review.changes || [],
    concerns: review.concerns || [],
    aiError: review.aiError,
    wordpressEventUrl: review.wordpressEventUrl,
    submitter: announcement
      ? {
          name: announcement.name,
          email: announcement.email,
          ministry: announcement.ministry,
          fileLinks: announcement.fileLinks || [],
        }
      : null,
  });
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Returns the cleaned-up fields, or an error message for the reviewer. */
function parseFields(raw: any): CalendarEventFields | string {
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const fields: CalendarEventFields = {
    title: str(raw?.title),
    description: str(raw?.description),
    dates: Array.isArray(raw?.dates)
      ? Array.from(new Set<string>(raw.dates.map(str).filter(Boolean))).sort()
      : [],
    startTime: str(raw?.startTime),
    endTime: str(raw?.endTime),
    location: str(raw?.location),
    signUpUrl: str(raw?.signUpUrl),
  };

  if (!fields.title) return 'The event needs a title.';
  if (!fields.dates.length) return 'The event needs at least one date.';
  if (fields.dates.some((d) => !DATE_RE.test(d))) return 'One of the dates is not valid.';
  if (fields.startTime && !TIME_RE.test(fields.startTime)) return 'The start time is not valid.';
  if (fields.endTime && !TIME_RE.test(fields.endTime)) return 'The end time is not valid.';
  if (fields.endTime && !fields.startTime) return 'An end time needs a start time.';
  if (fields.startTime && fields.endTime && fields.endTime < fields.startTime) {
    return 'The end time is earlier than the start time.';
  }
  if (fields.signUpUrl && !/^https?:\/\//i.test(fields.signUpUrl)) {
    return 'The sign-up link must start with http:// or https://';
  }
  return fields;
}

export async function POST(request: NextRequest, { params }: Params) {
  const review = await getCalendarReviewByToken(params.token);
  if (!review) {
    return NextResponse.json({ error: 'This review link is not valid.' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));

  if (review.status === 'published') {
    return NextResponse.json(
      { error: 'Already published. Make further changes in WordPress.', wordpressEventUrl: review.wordpressEventUrl },
      { status: 409 }
    );
  }
  if (review.status === 'processing') {
    return NextResponse.json({ error: 'The cleanup is still running. Try again in a minute.' }, { status: 409 });
  }

  if (body.action === 'dismiss') {
    await updateCalendarReview(review.id, { status: 'dismissed' });
    return NextResponse.json({ status: 'dismissed' });
  }

  if (body.action !== 'publish') {
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  }

  const fields = parseFields(body.fields);
  if (typeof fields === 'string') {
    return NextResponse.json({ error: fields }, { status: 400 });
  }

  try {
    const updated = await publishCalendarReview(review, fields);
    return NextResponse.json({ status: updated.status, wordpressEventUrl: updated.wordpressEventUrl });
  } catch (err: any) {
    console.error('Publishing calendar review failed:', err);
    return NextResponse.json({ error: err?.message || 'Publishing failed.' }, { status: 502 });
  }
}
