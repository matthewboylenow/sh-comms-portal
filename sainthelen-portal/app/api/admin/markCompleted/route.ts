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
const GRAPHIC_DESIGN_TABLE = process.env.GRAPHIC_DESIGN_TABLE_NAME || 'Graphic Design';

const base = new Airtable({ apiKey: AIRTABLE_PERSONAL_TOKEN }).base(AIRTABLE_BASE_ID);

/**
 * Request body shape:
 * {
 *   "table": "announcements" | "websiteUpdates" | "smsRequests" | "avRequests" | "flyerReviews" | "graphicDesign",
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
    console.log(`markCompleted request: table=${table}, recordId=${recordId}, completed=${completed}`);

    // Validate required parameters
    if (!table || !recordId || typeof completed !== 'boolean') {
      return new NextResponse(
        JSON.stringify({
          error: 'Missing required parameters: table, recordId, and completed are required',
        }),
        { status: 400 }
      );
    }

    // Validate recordId format (Airtable record IDs should start with 'rec' and be at least 17 characters)
    if (!recordId.startsWith('rec') || recordId.length < 17 || !/^rec[a-zA-Z0-9]+$/.test(recordId)) {
      return new NextResponse(
        JSON.stringify({
          error: 'Invalid record ID format. Record ID should be a valid Airtable ID starting with "rec".',
        }),
        { status: 400 }
      );
    }

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
    } else if (table === 'graphicDesign') {
      tableName = GRAPHIC_DESIGN_TABLE;
    } else {
      return new NextResponse(
        JSON.stringify({
          error: `Unknown table type: ${table}. Valid types are: announcements, websiteUpdates, smsRequests, avRequests, flyerReviews, graphicDesign`,
        }),
        { status: 400 }
      );
    }

    // Get record details before updating
    const record = await base(tableName).find(recordId);
    const fields = record.fields as Record<string, any>;
    
    // Determine request type and title for the notification
    const requestType = table.charAt(0).toUpperCase() + table.slice(1, -1); // e.g. "announcements" -> "Announcement"
    const requestTitle = fields.Title || fields.Subject || fields.Name || `${requestType} Request`;
    
    // Update "Completed" and "Completed Date" in Airtable
    console.log(`Updating ${tableName} record ${recordId} with Completed=${completed}`);
    
    const updateFields: Record<string, any> = {
      Completed: completed,
    };
    
    // Only set completion date for tables that have a "Completed Date" field
    // Announcements do NOT have a "Completed Date" field
    const tablesWithCompletedDate = ['websiteUpdates', 'smsRequests', 'avRequests', 'flyerReviews', 'graphicDesign'];
    
    if (tablesWithCompletedDate.includes(table)) {
      // Set completion date when marking as completed, clear it when uncompleting
      if (completed) {
        const now = new Date();
        const completedDate = now.toISOString().slice(0, 16).replace('T', ' '); // Format: 2025-09-03 16:30
        updateFields['Completed Date'] = completedDate;
      } else {
        updateFields['Completed Date'] = null; // Clear the date when uncompleting
      }
    }
    
    await base(tableName).update([
      {
        id: recordId,
        fields: updateFields,
      },
    ]);
    console.log(`Successfully updated ${tableName} record ${recordId}`);
    
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
    
    // Handle different types of Airtable errors
    if (err.error === 'NOT_FOUND') {
      return new NextResponse(
        JSON.stringify({
          error: `Record not found. The item may have been deleted or the ID is invalid.`,
        }),
        { status: 404 }
      );
    }
    
    if (err.error === 'INVALID_REQUEST') {
      return new NextResponse(
        JSON.stringify({
          error: 'Invalid request. Please check the data and try again.',
        }),
        { status: 400 }
      );
    }
    
    if (err.statusCode === 401 || err.statusCode === 403) {
      return new NextResponse(
        JSON.stringify({
          error: 'Access denied. Please check your Airtable permissions.',
        }),
        { status: 403 }
      );
    }
    
    // Generic server error for other cases
    return new NextResponse(
      JSON.stringify({
        error: err.message || 'Failed to mark completed',
      }),
      { status: 500 }
    );
  }
}