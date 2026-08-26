// app/api/cron/daily-digest/route.ts
//
// Daily email to the communications admin listing everything still sitting
// in the queue, with website updates older than 36 hours called out as
// overdue. Replaces the old Command Center task digest.

import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';
import * as announcementsService from '../../../lib/db/services/announcements';
import * as websiteUpdatesService from '../../../lib/db/services/website-updates';
import * as smsRequestsService from '../../../lib/db/services/sms-requests';
import * as avRequestsService from '../../../lib/db/services/av-requests';
import * as flyerReviewsService from '../../../lib/db/services/flyer-reviews';
import * as graphicDesignService from '../../../lib/db/services/graphic-design';
import * as photoSubmissionsService from '../../../lib/db/services/photo-submissions';
import { sendEmailViaGraph, getAdminNotificationEmail, isEmailConfigured } from '../../../lib/email';

export const dynamic = 'force-dynamic';

// Vercel cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET;

// A website update still open after this many hours is overdue
const WEBSITE_UPDATE_OVERDUE_HOURS = 36;

type DigestItem = {
  title: string;
  detail?: string;
  submitter: string;
  ageHours: number;
  urgent?: boolean;
};

function hoursSince(date: Date | string | null | undefined): number {
  if (!date) return 0;
  const then = date instanceof Date ? date : new Date(date);
  if (isNaN(then.getTime())) return 0;
  return (Date.now() - then.getTime()) / (1000 * 60 * 60);
}

function formatAge(hours: number): string {
  if (hours < 1) return 'less than an hour ago';
  if (hours < 24) return `${Math.round(hours)} hour${Math.round(hours) === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret in production
    if (CRON_SECRET) {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // All of these exclude completed records by default
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const [announcements, websiteUpdates, smsRequests, avRequests, flyerReviews, graphicDesign, recentPhotos] =
      await Promise.all([
        announcementsService.getAnnouncements({}),
        websiteUpdatesService.getAllWebsiteUpdates({}),
        smsRequestsService.getAllSMSRequests({}),
        avRequestsService.getAllAVRequests({}),
        flyerReviewsService.getAllFlyerReviews({}),
        graphicDesignService.getAllGraphicDesignRequests({}),
        // Photo submissions have no completed state; surface the last 48 hours
        photoSubmissionsService.getPhotoSubmissionsSince(twoDaysAgo).catch(() => []),
      ]);

    const websiteItems: DigestItem[] = websiteUpdates.map((r) => ({
      title: r.pageToUpdate,
      detail: r.description,
      submitter: r.name,
      ageHours: hoursSince(r.createdAt),
      urgent: r.urgent,
    }));

    const overdueWebsiteUpdates = websiteItems.filter(
      (item) => item.ageHours >= WEBSITE_UPDATE_OVERDUE_HOURS || (item.urgent && item.ageHours >= 24)
    );

    // Announcements flagged "Consider for Social Media"
    const socialItems: DigestItem[] = announcements
      .filter((r) => r.socialConsideration)
      .map((r) => ({
        title: r.name,
        detail: [r.ministry, r.socialWhatToKnow].filter(Boolean).join(' — ') || undefined,
        submitter:
          r.socialHasPhotos === 'yes'
            ? 'has photos/video'
            : r.socialHasPhotos === 'not_yet'
              ? 'photos coming after the event'
              : 'no photos',
        ageHours: hoursSince(r.submittedAt),
      }));

    // Parish-life photos shared in the last 48 hours
    const photoItems: DigestItem[] = recentPhotos.map((r) => ({
      title: r.description,
      detail: [r.ministry, `${r.fileLinks?.length || 0} file${(r.fileLinks?.length || 0) === 1 ? '' : 's'}`]
        .filter(Boolean)
        .join(' — '),
      submitter: r.submitterName || 'name not given',
      ageHours: hoursSince(r.createdAt),
      urgent: r.privacyConcern,
    }));

    const sections: { label: string; items: DigestItem[] }[] = [
      {
        label: 'Website Updates',
        items: websiteItems,
      },
      {
        // On announcements the "name" field doubles as the headline in the
        // admin UI, so show the ministry and body as the supporting detail
        label: 'Announcements',
        items: announcements.map((r) => ({
          title: r.name,
          detail: r.announcementBody,
          submitter: r.ministry || r.email,
          ageHours: hoursSince(r.submittedAt),
        })),
      },
      {
        label: 'SMS Requests',
        items: smsRequests.map((r) => ({
          title: r.smsMessage,
          detail: r.ministry || undefined,
          submitter: r.name,
          ageHours: hoursSince(r.createdAt),
        })),
      },
      {
        label: 'A/V Requests',
        items: avRequests.map((r) => ({
          title: r.eventName,
          detail: r.ministry || undefined,
          submitter: r.name,
          ageHours: hoursSince(r.createdAt),
        })),
      },
      {
        label: 'Flyer Reviews',
        items: flyerReviews.map((r) => ({
          title: r.eventName,
          detail: r.ministry || undefined,
          submitter: r.name,
          ageHours: hoursSince(r.createdAt),
          urgent: r.urgency === 'urgent',
        })),
      },
      {
        label: 'Graphic Design',
        items: graphicDesign.map((r) => ({
          title: r.projectType,
          detail: r.ministry || undefined,
          submitter: r.name,
          ageHours: hoursSince(r.createdAt),
          urgent: r.priority === 'Urgent',
        })),
      },
    ];

    const totalPending = sections.reduce((sum, s) => sum + s.items.length, 0);

    // Nothing waiting and no new photos? Don't send an empty email.
    if (totalPending === 0 && photoItems.length === 0) {
      console.log('[daily-digest] Queue is empty, skipping email');
      return NextResponse.json({ success: true, sent: false, totalPending: 0 });
    }

    if (!isEmailConfigured()) {
      console.log('[daily-digest] Email not configured, skipping send');
      return NextResponse.json({ success: true, sent: false, totalPending });
    }

    const subject =
      overdueWebsiteUpdates.length > 0
        ? `⚠️ Comms digest: ${totalPending} waiting — ${overdueWebsiteUpdates.length} website update${overdueWebsiteUpdates.length === 1 ? '' : 's'} overdue`
        : `Comms digest: ${totalPending} item${totalPending === 1 ? '' : 's'} waiting`;

    await sendEmailViaGraph({
      to: getAdminNotificationEmail(),
      subject,
      htmlContent: buildDigestEmail({
        date: format(new Date(), 'EEEE, MMMM d, yyyy'),
        totalPending,
        overdueWebsiteUpdates,
        socialItems,
        photoItems,
        sections,
      }),
      importance: overdueWebsiteUpdates.length > 0 ? 'high' : 'normal',
      flag: overdueWebsiteUpdates.length > 0,
    });

    console.log(
      `[daily-digest] Sent: ${totalPending} pending, ${overdueWebsiteUpdates.length} overdue website updates`
    );

    return NextResponse.json({
      success: true,
      sent: true,
      totalPending,
      overdueWebsiteUpdates: overdueWebsiteUpdates.length,
    });
  } catch (error: any) {
    console.error('[daily-digest] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send daily digest' },
      { status: 500 }
    );
  }
}

function truncate(text: string | undefined, max: number): string {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function buildDigestEmail({
  date,
  totalPending,
  overdueWebsiteUpdates,
  socialItems,
  photoItems,
  sections,
}: {
  date: string;
  totalPending: number;
  overdueWebsiteUpdates: DigestItem[];
  socialItems: DigestItem[];
  photoItems: DigestItem[];
  sections: { label: string; items: DigestItem[] }[];
}): string {
  const portalUrl = process.env.NEXTAUTH_URL || 'https://comms.sainthelen.org';

  const overdueSection =
    overdueWebsiteUpdates.length > 0
      ? `
        <div style="margin-bottom: 24px; padding: 16px; background-color: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444;">
          <h3 style="color: #991b1b; margin: 0 0 12px 0; font-size: 16px;">Overdue Website Updates (${overdueWebsiteUpdates.length})</h3>
          ${overdueWebsiteUpdates
            .map(
              (item) => `
            <div style="padding: 8px 0; border-bottom: 1px solid #fecaca;">
              <strong style="color: #1f2937;">${item.title}</strong>
              ${item.urgent ? '<span style="color: #b91c1c; font-size: 11px; font-weight: 700; margin-left: 6px;">URGENT</span>' : ''}
              <div style="color: #6b7280; font-size: 13px;">${truncate(item.detail, 120)}</div>
              <div style="color: #ef4444; font-size: 12px;">Submitted by ${item.submitter}, ${formatAge(item.ageHours)}</div>
            </div>
          `
            )
            .join('')}
        </div>
      `
      : '';

  const socialSection =
    socialItems.length > 0
      ? `
        <div style="margin-bottom: 24px; padding: 16px; background-color: #faf5ff; border-radius: 8px; border-left: 4px solid #9333ea;">
          <h3 style="color: #6b21a8; margin: 0 0 12px 0; font-size: 16px;">Flagged for Social Media (${socialItems.length})</h3>
          ${socialItems
            .map(
              (item) => `
            <div style="padding: 8px 0; border-bottom: 1px solid #e9d5ff;">
              <strong style="color: #1f2937;">${item.title}</strong>
              <div style="color: #6b7280; font-size: 13px;">${truncate(item.detail, 120)}</div>
              <div style="color: #9333ea; font-size: 12px;">${item.submitter} · submitted ${formatAge(item.ageHours)}</div>
            </div>
          `
            )
            .join('')}
        </div>
      `
      : '';

  const photoSection =
    photoItems.length > 0
      ? `
        <div style="margin-bottom: 24px; padding: 16px; background-color: #f0fdf4; border-radius: 8px; border-left: 4px solid #16a34a;">
          <h3 style="color: #166534; margin: 0 0 12px 0; font-size: 16px;">New Photos Shared (${photoItems.length})</h3>
          ${photoItems
            .map(
              (item) => `
            <div style="padding: 8px 0; border-bottom: 1px solid #bbf7d0;">
              <strong style="color: #1f2937;">${truncate(item.title, 90)}</strong>
              ${item.urgent ? '<span style="color: #b91c1c; font-size: 11px; font-weight: 700; margin-left: 6px;">PRIVACY FLAG</span>' : ''}
              <div style="color: #6b7280; font-size: 13px;">${truncate(item.detail, 120)}</div>
              <div style="color: #16a34a; font-size: 12px;">${item.submitter} · ${formatAge(item.ageHours)}</div>
            </div>
          `
            )
            .join('')}
        </div>
      `
      : '';

  const sectionsHtml = sections
    .filter((section) => section.items.length > 0)
    .map(
      (section) => `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #1f346d; margin: 0 0 8px 0; font-size: 15px;">${section.label} (${section.items.length})</h3>
        ${section.items
          .map(
            (item) => `
          <div style="padding: 10px 12px; background-color: #f9fafb; border-radius: 8px; margin-bottom: 6px; border-left: 3px solid ${item.urgent ? '#ef4444' : '#1f346d'};">
            <strong style="color: #1f2937; font-size: 14px;">${truncate(item.title, 90)}</strong>
            ${item.urgent ? '<span style="color: #b91c1c; font-size: 11px; font-weight: 700; margin-left: 6px;">URGENT</span>' : ''}
            <div style="color: #6b7280; font-size: 12px;">${item.detail ? `${truncate(item.detail, 90)} · ` : ''}${item.submitter} · ${formatAge(item.ageHours)}</div>
          </div>
        `
          )
          .join('')}
      </div>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1f346d, #8b3d2b); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Communications Queue Digest</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0 0; font-size: 14px;">${date}</p>
      </div>

      <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <div style="margin-bottom: 16px; padding: 12px; background-color: #f0f9ff; border-radius: 8px;">
          <span style="color: #1f346d; font-weight: 600;">${totalPending} item${totalPending === 1 ? '' : 's'} waiting in the queue</span>
        </div>

        ${overdueSection}
        ${socialSection}
        ${photoSection}
        ${sectionsHtml}

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
          <a href="${portalUrl}/admin" style="display: inline-block; padding: 12px 24px; background-color: #1f346d; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Open Admin Dashboard
          </a>
        </div>
      </div>

      <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
        Saint Helen Communications Portal
      </p>
    </body>
    </html>
  `;
}
