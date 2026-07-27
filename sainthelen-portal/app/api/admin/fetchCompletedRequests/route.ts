// app/api/admin/fetchCompletedRequests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAirtableBase, TABLE_NAMES } from '../../../lib/airtable';

// Neon database imports
import { useNeonDatabase } from '../../../lib/db';
import * as announcementsService from '../../../lib/db/services/announcements';
import * as websiteUpdatesService from '../../../lib/db/services/website-updates';
import * as smsRequestsService from '../../../lib/db/services/sms-requests';
import * as avRequestsService from '../../../lib/db/services/av-requests';
import * as flyerReviewsService from '../../../lib/db/services/flyer-reviews';
import * as graphicDesignService from '../../../lib/db/services/graphic-design';

// Force dynamic so Next.js doesn't attempt static generation
export const dynamic = 'force-dynamic';

/**
 * Returns only records where Completed = true
 */
export async function GET(request: NextRequest) {
  try {
    if (useNeonDatabase()) {
      return await fetchCompletedFromNeon();
    }
    return await fetchCompletedFromAirtable();
  } catch (error: any) {
    console.error('Error fetching completed requests:', error);
    return NextResponse.json(
      { error: error.message || 'Error fetching completed' },
      { status: 500 }
    );
  }
}

// ===== NEON DATABASE PATH =====
async function fetchCompletedFromNeon() {
  const [
    announcements,
    websiteUpdates,
    smsRequests,
    avRequests,
    flyerReviews,
    graphicDesign,
  ] = await Promise.all([
    announcementsService.getAnnouncements({ includeCompleted: true }),
    websiteUpdatesService.getAllWebsiteUpdates({ includeCompleted: true }),
    smsRequestsService.getAllSMSRequests({ includeCompleted: true }),
    avRequestsService.getAllAVRequests({ includeCompleted: true }),
    flyerReviewsService.getAllFlyerReviews({ includeCompleted: true }),
    graphicDesignService.getAllGraphicDesignRequests({ includeCompleted: true }),
  ]);

  const onlyCompleted = <T extends { completed: boolean | null }>(records: T[]) =>
    records.filter((r) => r.completed === true);

  const formatDate = (d: any) => {
    if (!d) return undefined;
    if (d instanceof Date) return d.toISOString();
    return String(d);
  };

  const formatDateOnly = (d: any) => {
    if (!d) return undefined;
    if (d instanceof Date) return d.toISOString().split('T')[0];
    return String(d).split('T')[0];
  };

  // Transform Neon records to the Airtable-style shape the admin cards expect.
  // Every record gets 'Submitted At' and 'Completed Date' so sorting works uniformly.
  const data = {
    announcements: onlyCompleted(announcements).map((r) => ({
      id: r.id,
      fields: {
        Name: r.name,
        Email: r.email,
        Ministry: r.ministry,
        'Date of Event': r.dateOfEvent,
        'Time of Event': r.timeOfEvent,
        'Promotion Start Date': r.promotionStartDate,
        Platforms: r.platforms,
        'Announcement Body': r.announcementBody,
        'Add to Events Calendar': r.addToEventsCalendar ? 'Yes' : 'No',
        'File Links': r.fileLinks?.join('\n') || '',
        'Sign Up URL': r.signUpUrl,
        'Publication Notes': r.publicationNotes,
        'Approval Status': r.approvalStatus,
        Completed: r.completed,
        'Completed Date': formatDate(r.completedDate),
        'Submitted At': formatDate(r.submittedAt),
      },
    })),
    websiteUpdates: onlyCompleted(websiteUpdates).map((r) => ({
      id: r.id,
      fields: {
        Name: r.name,
        Email: r.email,
        Urgent: r.urgent ? 'Yes' : 'No',
        'Page to Update': r.pageToUpdate,
        Description: r.description,
        'Sign-Up URL': r.signUpUrl,
        'File Links': r.fileLinks?.join('\n') || '',
        Completed: r.completed,
        'Completed Date': formatDate(r.completedDate),
        'Created At': formatDate(r.createdAt),
        'Submitted At': formatDate(r.createdAt),
      },
    })),
    smsRequests: onlyCompleted(smsRequests).map((r) => ({
      id: r.id,
      fields: {
        Name: r.name,
        Email: r.email,
        Ministry: r.ministry,
        'SMS Message': r.smsMessage,
        'Requested Date': formatDateOnly(r.requestedDate),
        'Additional Info': r.additionalInfo,
        'File Links': r.fileLinks?.join('\n') || '',
        Completed: r.completed,
        'Completed Date': formatDate(r.completedDate),
        'Created At': formatDate(r.createdAt),
        'Submitted At': formatDate(r.createdAt),
      },
    })),
    avRequests: onlyCompleted(avRequests).map((r) => ({
      id: r.id,
      fields: {
        Name: r.name,
        Email: r.email,
        Ministry: r.ministry,
        'Event Name': r.eventName,
        'Event Dates and Times': JSON.stringify(r.dateTimeEntries),
        Description: r.description,
        Location: r.location,
        'Needs Livestream': r.needsLivestream,
        'A/V Needs': r.avNeeds,
        'Expected Attendees': r.expectedAttendees,
        'Additional Notes': r.additionalNotes,
        'File Links': r.fileLinks?.join('\n') || '',
        Completed: r.completed,
        'Completed Date': formatDate(r.completedDate),
        'Created At': formatDate(r.createdAt),
        'Submitted At': formatDate(r.createdAt),
      },
    })),
    flyerReviews: onlyCompleted(flyerReviews).map((r) => ({
      id: r.id,
      fields: {
        Name: r.name,
        Email: r.email,
        Ministry: r.ministry,
        'Event Name': r.eventName,
        'Event Date': formatDateOnly(r.eventDate),
        'Target Audience': r.targetAudience,
        Purpose: r.purpose,
        'Feedback Needed': r.feedbackNeeded,
        Urgency: r.urgency,
        'File Links': r.fileLinks?.join('\n') || '',
        Status: r.status,
        Completed: r.completed,
        'Completed Date': formatDate(r.completedDate),
        'Created At': formatDate(r.createdAt),
        'Submitted At': formatDate(r.createdAt),
      },
    })),
    graphicDesign: onlyCompleted(graphicDesign).map((r) => ({
      id: r.id,
      fields: {
        Name: r.name,
        Email: r.email,
        Ministry: r.ministry,
        'Project Type': r.projectType,
        'Project Description': r.projectDescription,
        Deadline: formatDateOnly(r.deadline),
        Priority: r.priority,
        'Required Size/Dimensions': r.requiredDimensions,
        'File Links': r.fileLinks?.join('\n') || '',
        Status: r.status,
        Completed: r.completed,
        'Completed Date': formatDate(r.completedDate),
        'Created At': formatDate(r.createdAt),
        'Submitted At': formatDate(r.createdAt),
      },
    })),
  };

  return new NextResponse(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}

// ===== AIRTABLE DATABASE PATH (Legacy) =====
async function fetchCompletedFromAirtable() {
  const base = getAirtableBase();

  const annRecs = await base(TABLE_NAMES.ANNOUNCEMENTS)
    .select({ filterByFormula: '{Completed} = TRUE()' })
    .all();

  const webRecs = await base(TABLE_NAMES.WEBSITE_UPDATES)
    .select({ filterByFormula: '{Completed} = TRUE()' })
    .all();

  const smsRecs = await base(TABLE_NAMES.SMS_REQUESTS)
    .select({ filterByFormula: '{Completed} = TRUE()' })
    .all();

  // A/V Requests - With error handling if Completed column doesn't exist yet
  let avRecs;
  try {
    avRecs = await base(TABLE_NAMES.AV_REQUESTS)
      .select({ filterByFormula: '{Completed} = TRUE()' })
      .all();
  } catch (error) {
    console.warn('Could not filter A/V Requests by Completed - column may not exist');
    avRecs = [];
  }

  // Flyer Reviews - With error handling if Completed column doesn't exist yet
  let flyerRecs;
  try {
    flyerRecs = await base('Flyer Reviews')
      .select({ filterByFormula: '{Completed} = TRUE()' })
      .all();
  } catch (error) {
    console.warn('Could not filter Flyer Reviews by Completed - column may not exist');
    flyerRecs = [];
  }

  // Graphic Design Requests
  let graphicRecs;
  try {
    graphicRecs = await base(TABLE_NAMES.GRAPHIC_DESIGN)
      .select({ filterByFormula: '{Completed} = TRUE()' })
      .all();
  } catch (error) {
    console.warn('Could not filter Graphic Design by Completed - table may not exist yet');
    graphicRecs = [];
  }

  return NextResponse.json({
    announcements: annRecs.map((r) => ({ id: r.id, fields: r.fields })),
    websiteUpdates: webRecs.map((r) => ({ id: r.id, fields: r.fields })),
    smsRequests: smsRecs.map((r) => ({ id: r.id, fields: r.fields })),
    avRequests: avRecs.map((r) => ({ id: r.id, fields: r.fields })),
    flyerReviews: flyerRecs.map((r) => ({ id: r.id, fields: r.fields })),
    graphicDesign: graphicRecs.map((r) => ({ id: r.id, fields: r.fields })),
  });
}
