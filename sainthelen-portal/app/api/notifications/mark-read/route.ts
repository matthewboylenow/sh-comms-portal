// app/api/notifications/mark-read/route.ts

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
 * POST /api/notifications/mark-read
 * Marks a notification as read or unread
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Parse request body
    const data = await request.json();
    if (!data.notificationId) {
      return new NextResponse(JSON.stringify({ error: 'Notification ID is required' }), { status: 400 });
    }

    // Verify the notification belongs to the user
    const notificationId = data.notificationId;
    const userEmail = session.user.email;
    
    // Get the notification
    const notification = await base(NOTIFICATIONS_TABLE).find(notificationId)
      .catch(() => null);
    
    if (!notification) {
      return new NextResponse(JSON.stringify({ error: 'Notification not found' }), { status: 404 });
    }

    // Check ownership
    const fields = notification.fields as Record<string, any>;
    if (fields.userEmail !== userEmail) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    }

    // Update the notification
    const isRead = data.isRead !== undefined ? Boolean(data.isRead) : true;
    await base(NOTIFICATIONS_TABLE).update(notificationId, {
      isRead
    });

    return NextResponse.json({
      success: true,
      message: `Notification marked as ${isRead ? 'read' : 'unread'}`
    });

  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return new NextResponse(
      JSON.stringify({ success: false, error: error.message || 'Failed to update notification' }),
      { status: 500 }
    );
  }
}