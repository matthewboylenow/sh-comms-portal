// app/api/admin/fetchRequests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

const AIRTABLE_PERSONAL_TOKEN = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';
const ANNOUNCEMENTS_TABLE = process.env.ANNOUNCEMENTS_TABLE_NAME || 'Announcements';
const WEBSITE_UPDATES_TABLE = process.env.WEBSITE_UPDATES_TABLE_NAME || 'Website Updates';
const SMS_REQUESTS_TABLE = process.env.SMS_REQUESTS_TABLE_NAME || 'SMS Requests';

const base = new Airtable({ apiKey: AIRTABLE_PERSONAL_TOKEN }).base(AIRTABLE_BASE_ID);

export async function GET(request: NextRequest) {
  try {
    // Fetch Announcements
    const announcementsRecords = await base(ANNOUNCEMENTS_TABLE)
      .select()
      .all();

    // Fetch Website Updates
    const websiteUpdatesRecords = await base(WEBSITE_UPDATES_TABLE)
      .select()
      .all();

    // Fetch SMS Requests
    const smsRequestsRecords = await base(SMS_REQUESTS_TABLE)
      .select()
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
      JSON.stringify({ error: error.message || 'Error fetching requests' }),
      { status: 500 }
    );
  }
}
