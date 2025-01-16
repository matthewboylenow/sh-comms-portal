// app/api/admin/markCompleted/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

const AIRTABLE_PERSONAL_TOKEN = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';
const ANNOUNCEMENTS_TABLE = process.env.ANNOUNCEMENTS_TABLE_NAME || 'Announcements';
const WEBSITE_UPDATES_TABLE = process.env.WEBSITE_UPDATES_TABLE_NAME || 'Website Updates';
const SMS_REQUESTS_TABLE = process.env.SMS_REQUESTS_TABLE_NAME || 'SMS Requests';

const base = new Airtable({ apiKey: AIRTABLE_PERSONAL_TOKEN }).base(AIRTABLE_BASE_ID);

/**
 * The request body should have:
 * {
 *   "table": "announcements" | "websiteUpdates" | "smsRequests",
 *   "recordId": string,
 *   "completed": boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { table, recordId, completed } = await request.json();

    let tableName = ANNOUNCEMENTS_TABLE; // default
    if (table === 'announcements') {
      tableName = ANNOUNCEMENTS_TABLE;
    } else if (table === 'websiteUpdates') {
      tableName = WEBSITE_UPDATES_TABLE;
    } else if (table === 'smsRequests') {
      tableName = SMS_REQUESTS_TABLE;
    } else {
      throw new Error(`Unknown table type: ${table}`);
    }

    await base(tableName).update([
      {
        id: recordId,
        fields: {
          Completed: completed,
        },
      },
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in markCompleted route:', error);
    return new NextResponse(
      JSON.stringify({
        error: error.message || 'Failed to mark completed',
      }),
      { status: 500 }
    );
  }
}
