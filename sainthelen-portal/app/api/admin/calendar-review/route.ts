// app/api/admin/calendar-review/route.ts
//
// "Review & publish" on the Calendar Requests page. Opens the announcement's
// existing calendar review, or runs the cleanup now when it doesn't have one
// (anything submitted before reviews existed, or a review that never finished).

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '../../../lib/adminAuth';
import { getLatestCalendarReview } from '../../../lib/db/services/calendar-reviews';
import { startCalendarReview } from '../../../lib/calendar-review';

export const dynamic = 'force-dynamic';
// The cleanup reads attachments and can take a minute
export const maxDuration = 120;

// A review stuck in processing this long was cut off; start a fresh one
const STALE_PROCESSING_MS = 5 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess();
  } catch {
    return NextResponse.json({ error: 'Sign in to review calendar requests.' }, { status: 401 });
  }

  const { announcementId } = await request.json().catch(() => ({}));
  if (typeof announcementId !== 'string' || !announcementId) {
    return NextResponse.json({ error: 'Missing announcement id.' }, { status: 400 });
  }

  try {
    const existing = await getLatestCalendarReview(announcementId);
    const stale =
      existing?.status === 'processing' &&
      Date.now() - new Date(existing.createdAt).getTime() > STALE_PROCESSING_MS;

    const review =
      existing && !stale
        ? existing
        : await startCalendarReview(announcementId, { sendEmail: false });

    return NextResponse.json({ token: review.token, status: review.status });
  } catch (err: any) {
    console.error('Opening calendar review failed:', err);
    return NextResponse.json({ error: err?.message || 'Could not open the review.' }, { status: 500 });
  }
}
