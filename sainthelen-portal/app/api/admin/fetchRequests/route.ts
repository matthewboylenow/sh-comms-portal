// app/api/admin/fetchRequests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

const personalToken = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const baseId = process.env.AIRTABLE_BASE_ID || '';
const announcementsTable = process.env.ANNOUNCEMENTS_TABLE_NAME || 'Announcements';
const websiteUpdatesTable = process.env.WEBSITE_UPDATES_TABLE_NAME || 'Website Updates';
const smsRequestsTable = process.env.SMS_REQUESTS_TABLE_NAME || 'SMS Requests';

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

    return NextResponse.json({
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
    });
  } catch (error: any) {
    console.error('Error fetching requests:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Error fetching' }),
      { status: 500 }
    );
  }
}
