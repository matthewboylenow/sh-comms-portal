// app/api/notifications/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import Airtable from 'airtable';

// New Neon database imports
import { useNeonDatabase } from '../../lib/db';
import * as notificationsService from '../../lib/db/services/notifications';

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
 * GET /api/notifications
 * Fetches notifications for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const userEmail = session.user.email;
    console.log(`Fetching notifications for user: ${userEmail}`);

    const useNeon = useNeonDatabase();

    if (useNeon) {
      // ===== NEON DATABASE PATH =====
      const records = await notificationsService.getNotificationsForUser(userEmail, 100);

      const notifications = records.map((record) => ({
        id: record.id,
        type: record.type || 'info',
        message: record.message || '',
        relatedRecordId: record.relatedRecordId || null,
        relatedRecordType: record.relatedRecordType || null,
        isRead: record.isRead || false,
        createdAt: record.createdAt?.toISOString() || new Date().toISOString(),
        userEmail: record.userEmail || ''
      }));

      const unreadCount = notifications.filter(n => !n.isRead).length;

      return NextResponse.json({
        success: true,
        notifications,
        unreadCount
      });
    }

    // ===== AIRTABLE DATABASE PATH (Legacy) =====
    // Check if Airtable is configured
    if (!AIRTABLE_PERSONAL_TOKEN || !AIRTABLE_BASE_ID) {
      console.error('Airtable configuration missing');
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Notifications service not configured' }),
        { status: 503 }
      );
    }

    // Query notifications table for records belonging to this user
    const records = await base(NOTIFICATIONS_TABLE)
      .select({
        filterByFormula: `{userEmail} = "${userEmail}"`,
        sort: [{ field: 'Created Time', direction: 'desc' }],
        maxRecords: 100
      })
      .all();

    // Transform records to a cleaner format
    const notifications = records.map((record) => {
      const fields = record.fields as Record<string, any>;
      return {
        id: record.id,
        type: fields.type || 'info',
        message: fields.message || '',
        relatedRecordId: fields.relatedRecordId || null,
        relatedRecordType: fields.relatedRecordType || null,
        isRead: fields.isRead || false,
        createdAt: fields['Created Time'] || new Date().toISOString(),
        userEmail: fields.userEmail || ''
      };
    });

    // Get count of unread notifications
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount
    });

  } catch (error: any) {
    console.error('Error fetching notifications:', error);

    // Handle different types of Airtable errors
    if (error.statusCode === 401 || error.statusCode === 403) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Access denied. Please check your Airtable permissions.'
        }),
        { status: 403 }
      );
    }

    if (error.statusCode === 404) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Notifications table not found. Please check your Airtable configuration.'
        }),
        { status: 503 }
      );
    }

    // Generic server error for other cases
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch notifications'
      }),
      { status: 500 }
    );
  }
}

/**
 * Helper function to create a notification
 * This can be imported and used in other API routes
 */
export async function createNotification(params: {
  userEmail: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  relatedRecordId?: string;
  relatedRecordType?: string;
}) {
  try {
    const {
      userEmail,
      type,
      message,
      relatedRecordId,
      relatedRecordType
    } = params;

    const useNeon = useNeonDatabase();

    if (useNeon) {
      // ===== NEON DATABASE PATH =====
      const notification = await notificationsService.createNotification({
        userEmail,
        type,
        message,
        relatedRecordId,
        relatedRecordType,
      });
      return notification.id;
    }

    // ===== AIRTABLE DATABASE PATH (Legacy) =====
    const record = await base(NOTIFICATIONS_TABLE).create({
      userEmail,
      type,
      message,
      relatedRecordId: relatedRecordId || '',
      relatedRecordType: relatedRecordType || '',
      isRead: false,
      'Created Time': new Date().toISOString()
    });

    return record.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}
