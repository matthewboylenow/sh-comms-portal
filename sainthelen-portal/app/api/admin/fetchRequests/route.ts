// app/api/admin/fetchRequests/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

// New Neon database imports
import { useNeonDatabase } from '../../../lib/db';
import * as announcementsService from '../../../lib/db/services/announcements';
import * as websiteUpdatesService from '../../../lib/db/services/website-updates';
import * as smsRequestsService from '../../../lib/db/services/sms-requests';
import * as avRequestsService from '../../../lib/db/services/av-requests';
import * as flyerReviewsService from '../../../lib/db/services/flyer-reviews';
import * as graphicDesignService from '../../../lib/db/services/graphic-design';

export const dynamic = 'force-dynamic';
// This ensures Next never statically caches the route output.

const personalToken = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const baseId = process.env.AIRTABLE_BASE_ID || '';
const announcementsTable = process.env.ANNOUNCEMENTS_TABLE_NAME || 'Announcements';
const websiteUpdatesTable = process.env.WEBSITE_UPDATES_TABLE_NAME || 'Website Updates';
const smsRequestsTable = process.env.SMS_REQUESTS_TABLE_NAME || 'SMS Requests';
const avRequestsTable = process.env.AV_REQUESTS_TABLE_NAME || 'A/V Requests';
const flyerReviewsTable = process.env.FLYER_REVIEW_TABLE_NAME || 'Flyer Reviews';
const graphicDesignTable = process.env.GRAPHIC_DESIGN_TABLE_NAME || 'Graphic Design Requests';

const base = new Airtable({ apiKey: personalToken }).base(baseId);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // By default, hide completed items. Pass ?includeCompleted=true to show all
    const includeCompleted = searchParams.get('includeCompleted') === 'true';

    const useNeon = useNeonDatabase();

    if (useNeon) {
      // ===== NEON DATABASE PATH =====
      const [
        announcements,
        websiteUpdates,
        smsRequests,
        avRequests,
        flyerReviews,
        graphicDesign
      ] = await Promise.all([
        announcementsService.getAnnouncements({ includeCompleted }),
        websiteUpdatesService.getAllWebsiteUpdates({ includeCompleted }),
        smsRequestsService.getAllSMSRequests({ includeCompleted }),
        avRequestsService.getAllAVRequests({ includeCompleted }),
        flyerReviewsService.getAllFlyerReviews({ includeCompleted }),
        graphicDesignService.getAllGraphicDesignRequests({ includeCompleted })
      ]);

      // Helper to safely format dates (handles both Date objects and strings)
      const formatDate = (d: any) => {
        if (!d) return undefined;
        if (d instanceof Date) return d.toISOString();
        return String(d);
      };

      const formatDateOnly = (d: any) => {
        if (!d) return undefined;
        if (d instanceof Date) return d.toISOString().split('T')[0];
        // If it's already a string (date format from Neon), return as-is
        return String(d).split('T')[0];
      };

      // Transform Neon records to match Airtable format for compatibility
      const data = {
        announcements: announcements.map((r) => ({
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
            'Approval Status': r.approvalStatus,
            'Requires Approval': r.requiresApproval,
            Completed: r.completed,
            'Completed Date': formatDate(r.completedDate),
            'Submitted At': formatDate(r.submittedAt),
          },
        })),
        websiteUpdates: websiteUpdates.map((r) => ({
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
          },
        })),
        smsRequests: smsRequests.map((r) => ({
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
          },
        })),
        avRequests: avRequests.map((r) => ({
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
          },
        })),
        flyerReviews: flyerReviews.map((r) => ({
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
          },
        })),
        graphicDesign: graphicDesign.map((r) => ({
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
    // Build filter to exclude completed items unless explicitly requested
    const completedFilter = includeCompleted ? {} : { filterByFormula: 'NOT({Completed})' };

    // 1) Fetch Announcements
    const announcementsRecords = await base(announcementsTable)
      .select({ view: 'Grid view', ...completedFilter })
      .all();

    // 2) Fetch Website Updates
    const websiteUpdatesRecords = await base(websiteUpdatesTable)
      .select({ view: 'Grid view', ...completedFilter })
      .all();

    // 3) Fetch SMS Requests
    const smsRequestsRecords = await base(smsRequestsTable)
      .select({ view: 'Grid view', ...completedFilter })
      .all();

    // 4) Fetch A/V Requests
    const avRequestsRecords = await base(avRequestsTable)
      .select({ view: 'Grid view', ...completedFilter })
      .all();

    // 5) Fetch Flyer Reviews
    const flyerReviewsRecords = await base(flyerReviewsTable)
      .select({ view: 'Grid view', ...completedFilter })
      .all();

    // 6) Fetch Graphic Design Requests
    const graphicDesignRecords = await base(graphicDesignTable)
      .select({ view: 'Grid view', ...completedFilter })
      .all();

    // Build JSON
    const data = {
      announcements: announcementsRecords.map((r) => ({
        id: r.id,
        fields: r.fields,
      })),
      websiteUpdates: websiteUpdatesRecords.map((r) => ({
        id: r.id,
        fields: r.fields,
      })),
      smsRequests: smsRequestsRecords.map((r) => ({
        id: r.id,
        fields: r.fields,
      })),
      avRequests: avRequestsRecords.map((r) => ({
        id: r.id,
        fields: r.fields,
      })),
      flyerReviews: flyerReviewsRecords.map((r) => ({
        id: r.id,
        fields: r.fields,
      })),
      graphicDesign: graphicDesignRecords.map((r) => ({
        id: r.id,
        fields: r.fields,
      })),
    };

    // Return with no-store headers
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error fetching requests:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Error fetching' }),
      { status: 500 }
    );
  }
}