// app/api/admin/fetchCompletedRequests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

const AIRTABLE_PERSONAL_TOKEN = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';
const ANNOUNCEMENTS_TABLE = process.env.ANNOUNCEMENTS_TABLE_NAME || 'Announcements';
const WEBSITE_UPDATES_TABLE = process.env.WEBSITE_UPDATES_TABLE_NAME || 'Website Updates';
const SMS_REQUESTS_TABLE = process.env.SMS_REQUESTS_TABLE_NAME || 'SMS Requests';

const base = new Airtable({ apiKey: AIRTABLE_PERSONAL_TOKEN }).base(AIRTABLE_BASE_ID);

/**
 * Returns only records where Completed = true
 */
export async function GET(request: NextRequest) {
  try {
    // Announcements
    const annRecs = await base(ANNOUNCEMENTS_TABLE)
      .select({
        filterByFormula: '{Completed} = 1', // Only completed items
      })
      .all();

    // Website Updates
    const webRecs = await base(WEBSITE_UPDATES_TABLE)
      .select({
        filterByFormula: '{Completed} = 1',
      })
      .all();

    // SMS Requests
    const smsRecs = await base(SMS_REQUESTS_TABLE)
      .select({
        filterByFormula: '{Completed} = 1',
      })
      .all();

    return NextResponse.json({
      announcements: annRecs.map((r) => ({ id: r.id, fields: r.fields })),
      websiteUpdates: webRecs.map((r) => ({ id: r.id, fields: r.fields })),
      smsRequests: smsRecs.map((r) => ({ id: r.id, fields: r.fields })),
    });
  } catch (error: any) {
    console.error('Error fetching completed requests:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Error fetching completed' }),
      { status: 500 }
    );
  }
}
