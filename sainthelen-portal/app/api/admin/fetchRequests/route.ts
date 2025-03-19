// app/api/admin/fetchRequests/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

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
    // 1) Fetch Announcements
    const announcementsRecords = await base(announcementsTable)
      .select({ view: 'Grid view' })
      .all();

    // 2) Fetch Website Updates
    const websiteUpdatesRecords = await base(websiteUpdatesTable)
      .select({ view: 'Grid view' })
      .all();

    // 3) Fetch SMS Requests
    const smsRequestsRecords = await base(smsRequestsTable)
      .select({ view: 'Grid view' })
      .all();

    // 4) Fetch A/V Requests
    const avRequestsRecords = await base(avRequestsTable)
      .select({ view: 'Grid view' })
      .all();

    // 5) Fetch Flyer Reviews
    const flyerReviewsRecords = await base(flyerReviewsTable)
      .select({ view: 'Grid view' })
      .all();
      
    // 6) Fetch Graphic Design Requests
    const graphicDesignRecords = await base(graphicDesignTable)
      .select({ view: 'Grid view' })
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