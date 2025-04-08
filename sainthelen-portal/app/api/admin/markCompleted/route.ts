// app/api/admin/markCompleted/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { createNotification } from '../../notifications/route';

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

    // Get record details before updating
    const record = await base(tableName).find(recordId);
    const fields = record.fields as Record<string, any>;
    
    // Determine request type and title for the notification
    const requestType = table.charAt(0).toUpperCase() + table.slice(1, -1); // e.g. "announcements" -> "Announcement"
    const requestTitle = fields.Title || fields.Subject || fields.Name || `${requestType} Request`;
    
    // Update "Completed" in Airtable
    await base(tableName).update([
      {
        id: recordId,
        fields: {
          Completed: completed,
        },
      },
    ]);
    
    // Create notification for the requester if they have an email
    if (fields.RequesterEmail) {
      await createNotification({
        userEmail: fields.RequesterEmail,
        type: completed ? 'success' : 'info',
        message: completed 
          ? `Your ${requestType} request "${requestTitle}" has been completed` 
          : `Your ${requestType} request "${requestTitle}" is now in progress`,
        relatedRecordId: recordId,
        relatedRecordType: tableName
      });
    }

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