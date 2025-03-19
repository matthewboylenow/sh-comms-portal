// app/api/admin/markCompleted/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

// Force dynamic so Next.js doesn't attempt static generation
export const dynamic = 'force-dynamic';

/**
 * ENV variables for all tables:
 */
const AIRTABLE_PERSONAL_TOKEN = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';
const ANNOUNCEMENTS_TABLE = process.env.ANNOUNCEMENTS_TABLE_NAME || 'Announcements';
const WEBSITE_UPDATES_TABLE = process.env.WEBSITE_UPDATES_TABLE_NAME || 'Website Updates';
const SMS_REQUESTS_TABLE = process.env.SMS_REQUESTS_TABLE_NAME || 'SMS Requests';
const AV_REQUESTS_TABLE = process.env.AV_REQUESTS_TABLE_NAME || 'A/V Requests';
const FLYER_REVIEWS_TABLE = process.env.FLYER_REVIEW_TABLE_NAME || 'Flyer Reviews';

const base = new Airtable({ apiKey: AIRTABLE_PERSONAL_TOKEN }).base(AIRTABLE_BASE_ID);

/**
 * Request body shape:
 * {
 *   "table": "announcements" | "websiteUpdates" | "smsRequests" | "avRequests" | "flyerReviews",
 *   "recordId": string,
 *   "completed": boolean
 * }
 */

// OPTIONAL: If you want to handle GET or other methods gracefully, you can do so:
export async function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed' },
    { status: 405 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const { table, recordId, completed } = await request.json();

    let tableName: string;
    if (table === 'announcements') {
      tableName = ANNOUNCEMENTS_TABLE;
    } else if (table === 'websiteUpdates') {
      tableName = WEBSITE_UPDATES_TABLE;
    } else if (table === 'smsRequests') {
      tableName = SMS_REQUESTS_TABLE;
    } else if (table === 'avRequests') {
      tableName = AV_REQUESTS_TABLE;
    } else if (table === 'flyerReviews') {
      tableName = FLYER_REVIEWS_TABLE;
    } else {
      throw new Error(`Unknown table type: ${table}`);
    }

    // Update "Completed" in Airtable
    await base(tableName).update([
      {
        id: recordId,
        fields: {
          Completed: completed,
        },
      },
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in markCompleted route:', err);
    return new NextResponse(
      JSON.stringify({
        error: err.message || 'Failed to mark completed',
      }),
      { status: 500 }
    );
  }
}