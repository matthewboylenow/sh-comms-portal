// app/lib/calendar-review.ts
//
// Calendar requests don't go straight to sainthelen.org. Each one is cleaned
// up by Claude, then emailed to the communications office with a preview and
// two links: approve (publish as shown) or edit (fix it first, then publish).

import { getAnnouncementById } from './db/services/announcements';
import {
  createCalendarReview,
  updateCalendarReview,
} from './db/services/calendar-reviews';
import type { CalendarEventFields, CalendarReview } from './db/schema';
import { cleanUpEvent } from './event-cleanup';
import { formatWhen } from './format-event';
import { getAdminNotificationEmail, sendEmailViaGraph } from './email';
import {
  loadAnnouncement,
  publishWordPressEvent,
  pushToWordPress,
  recordWordPressEvent,
} from './wordpress-events';

const PORTAL_URL = process.env.NEXTAUTH_URL || 'https://comms.sainthelen.org';

export function reviewUrl(review: Pick<CalendarReview, 'token'>, action?: 'approve'): string {
  return `${PORTAL_URL}/calendar-review/${review.token}${action ? `?action=${action}` : ''}`;
}

/**
 * Clean up a new calendar request and email it for review. Never throws: a
 * failed cleanup still sends the email, with the event as submitted.
 */
export async function startCalendarReview(announcementId: string): Promise<void> {
  const [announcement, normalised] = await Promise.all([
    getAnnouncementById(announcementId),
    loadAnnouncement(announcementId),
  ]);
  if (!announcement || !normalised) {
    throw new Error(`Announcement ${announcementId} not found`);
  }

  const original: CalendarEventFields = {
    title: normalised.title,
    description: normalised.description,
    dates: normalised.dates,
    startTime: normalised.startTime,
    endTime: normalised.endTime,
    location: normalised.location,
    signUpUrl: normalised.signUpUrl,
  };

  let review = await createCalendarReview(announcementId, original);

  try {
    const result = await cleanUpEvent({
      event: original,
      submitterName: announcement.name,
      ministry: announcement.ministry || '',
      announcementBody: announcement.announcementBody,
      eventDates: announcement.eventDates || [],
      publicationNotes: announcement.publicationNotes || '',
      fileLinks: announcement.fileLinks || [],
    });
    review = await updateCalendarReview(review.id, {
      status: 'ready',
      cleaned: result.cleaned,
      changes: result.changes,
      concerns: result.concerns,
    });
  } catch (err: any) {
    console.error('Calendar cleanup failed:', err);
    review = await updateCalendarReview(review.id, {
      status: 'ready',
      cleaned: original,
      changes: [],
      concerns: [],
      aiError: err?.message || 'Cleanup failed',
    });
  }

  await sendEmailViaGraph({
    to: getAdminNotificationEmail(),
    subject: `Calendar review: ${review.cleaned?.title || original.title || 'New event'}`,
    htmlContent: reviewEmailHtml(review, announcement.name, announcement.ministry || ''),
  });
}

/** Push the approved version to sainthelen.org and publish it. */
export async function publishCalendarReview(
  review: CalendarReview,
  fields: CalendarEventFields
): Promise<CalendarReview> {
  const base = await loadAnnouncement(review.announcementId);
  if (!base) throw new Error('The announcement behind this review is gone.');

  const wp = await pushToWordPress({ ...base, ...fields, id: review.announcementId });

  // Intake leaves an event alone once someone has published it
  const { url } = wp.skipped ? { url: wp.url || '' } : await publishWordPressEvent(wp.id);
  await recordWordPressEvent(review.announcementId, wp.id, url);

  return updateCalendarReview(review.id, {
    status: 'published',
    cleaned: fields,
    wordpressEventId: wp.id,
    wordpressEventUrl: url,
    publishedAt: new Date(),
  });
}

/* ------------------------------------------------------------------ email */

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function paragraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px;">${esc(p).replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

function list(items: string[]): string {
  return `<ul style="margin:0;padding-left:20px;">${items.map((i) => `<li style="margin-bottom:4px;">${esc(i)}</li>`).join('')}</ul>`;
}

function reviewEmailHtml(review: CalendarReview, submitter: string, ministry: string): string {
  const e = review.cleaned || review.original;
  const o = review.original;
  const button = (href: string, label: string, bg: string) =>
    `<a href="${href}" style="display:inline-block;padding:12px 22px;margin:0 8px 8px 0;background:${bg};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">${label}</a>`;

  const aiNote = review.aiError
    ? `<p style="background:#fee2e2;padding:12px;border-radius:6px;border-left:4px solid #dc2626;margin:0 0 16px;"><strong>Cleanup didn't run</strong> (${esc(review.aiError)}). This is the event exactly as submitted.</p>`
    : '';

  const concerns = review.concerns?.length
    ? `<div style="background:#fef3c7;padding:12px 16px;border-radius:6px;border-left:4px solid #f59e0b;margin:0 0 16px;"><strong>Check before publishing</strong>${list(review.concerns)}</div>`
    : '';

  const changes = review.changes?.length
    ? `<div style="margin:0 0 16px;"><strong>What was changed</strong>${list(review.changes)}</div>`
    : '';

  return `
  <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1f2937;max-width:640px;">
    <p style="margin:0 0 16px;">${esc(submitter)}${ministry ? ` (${esc(ministry)})` : ''} asked for this to go on the parish calendar.</p>
    ${aiNote}
    <div style="border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:0 0 16px;">
      <h2 style="margin:0 0 6px;font-size:20px;color:#1f346d;">${esc(e.title || '(no title)')}</h2>
      <p style="margin:0 0 4px;font-weight:600;">${esc(formatWhen(e))}</p>
      ${e.location ? `<p style="margin:0 0 4px;">${esc(e.location)}</p>` : ''}
      ${e.signUpUrl ? `<p style="margin:0 0 4px;"><a href="${esc(e.signUpUrl)}">Sign up link</a></p>` : ''}
      <div style="margin-top:14px;">${paragraphs(e.description)}</div>
    </div>
    ${concerns}
    ${changes}
    <div style="margin:0 0 24px;">
      ${button(reviewUrl(review, 'approve'), 'Approve &amp; publish', '#15803d')}
      ${button(reviewUrl(review), 'Edit', '#1f346d')}
    </div>
    <div style="color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;padding-top:12px;">
      <p style="margin:0 0 8px;"><strong>As submitted</strong></p>
      <p style="margin:0 0 4px;">${esc(o.title || '(no title)')} &middot; ${esc(formatWhen(o))}${o.location ? ` &middot; ${esc(o.location)}` : ''}</p>
      ${paragraphs(o.description)}
    </div>
  </div>`;
}
