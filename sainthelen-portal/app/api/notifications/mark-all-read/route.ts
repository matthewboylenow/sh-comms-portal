// app/api/notifications/mark-all-read/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import Airtable from 'airtable';

export const dynamic = 'force-dynamic'; // ensures no static generation

//
// Environment Variables
//
const AIRTABLE_PERSONAL_TOKEN = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';
const NOTIFICATIONS_TABLE = 'Notifications'; // Table name in Airtable

//
// Configure Airtable
//
const base = new Airtable({ apiKey: AIRTABLE_PERSONAL_TOKEN }).base(AIRTABLE_BASE_ID);

/**
 * POST /api/notifications/mark-all-read
 * Marks all of a user's notifications as read
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Get user's email for filtering
    const userEmail = session.user.email;

    // Find all unread notifications for this user
    const records = await base(NOTIFICATIONS_TABLE)
      .select({
        filterByFormula: `AND({userEmail} = "${userEmail}", {isRead} = 0)`,
      })
      .all();

    if (records.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unread notifications found',
        updatedCount: 0
      });
    }

    // Batch update all notifications to mark as read
    // Airtable limits batch updates to 10 records, so we need to chunk them
    const chunkSize = 10;
    const recordChunks = [];
    for (let i = 0; i < records.length; i += chunkSize) {
      recordChunks.push(records.slice(i, i + chunkSize));
    }

    // Update each chunk sequentially
    for (const chunk of recordChunks) {
      await base(NOTIFICATIONS_TABLE).update(
        chunk.map(record => ({
          id: record.id,
          fields: { isRead: true }
        }))
      );
    }

    return NextResponse.json({
      success: true,
      message: `Marked ${records.length} notifications as read`,
      updatedCount: records.length
    });

  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return new NextResponse(
      JSON.stringify({ success: false, error: error.message || 'Failed to update notifications' }),
      { status: 500 }
    );
  }
}