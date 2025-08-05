// app/api/push/send/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import Airtable from 'airtable';
import webpush from 'web-push';

export const dynamic = 'force-dynamic';

// Environment Variables
const AIRTABLE_PERSONAL_TOKEN = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';
const PUSH_SUBSCRIPTIONS_TABLE = 'PushSubscriptions'; // Table name in Airtable

// VAPID keys (replace with real keys in production)
const VAPID_PUBLIC_KEY = 'BNbKpVjn7a0DrH-EkSQ_Gl00-UwEn2Cn12U2WGIAVr5R15bXCLwXB7TXqFkyGciKoQYNXktnjVlEQWI1FKsnnSc';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'replace-this-with-your-private-key-in-env';

// Configure Airtable and Web Push inside functions to avoid build-time execution

/**
 * POST /api/push/send
 * Sends push notifications to users
 */
export async function POST(request: NextRequest) {
  try {
    // Configure Web Push (moved here to avoid build-time execution)
    if (VAPID_PRIVATE_KEY && VAPID_PRIVATE_KEY !== 'replace-this-with-your-private-key-in-env') {
      webpush.setVapidDetails(
        'mailto:admin@sainthelen.org',
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
      );
    }

    // Configure Airtable
    const base = new Airtable({ apiKey: AIRTABLE_PERSONAL_TOKEN }).base(AIRTABLE_BASE_ID);

    // Get authenticated user (only admins should be able to send notifications)
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Check if user has admin role (you'll need to implement this check)
    // const isAdmin = session.user.role === 'admin';
    // if (!isAdmin) {
    //   return new NextResponse(JSON.stringify({ error: 'Unauthorized: Admin access required' }), { status: 403 });
    // }

    // Parse request body
    const body = await request.json();
    const { title, message, url, userEmails } = body;

    if (!title || !message) {
      return new NextResponse(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Find all active subscriptions
    let formula = '';
    if (userEmails && Array.isArray(userEmails) && userEmails.length > 0) {
      // If specific user emails are provided, only notify them
      formula = `OR(${userEmails.map(email => `{userEmail} = "${email}"`).join(',')})`;
    }

    const records = await base(PUSH_SUBSCRIPTIONS_TABLE)
      .select({
        filterByFormula: formula || 'NOT({subscription} = "")',
      })
      .all();

    if (records.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No push subscriptions found',
        sentCount: 0,
      });
    }

    // For each subscription, send a push notification
    const results = await Promise.allSettled(
      records.map(async (record) => {
        try {
          const subscriptionString = record.get('subscription') as string;
          const subscription = JSON.parse(subscriptionString);

          const payload = JSON.stringify({
            title,
            message,
            url: url || '/admin',
            timestamp: Date.now(),
          });

          const result = await webpush.sendNotification(subscription, payload);
          return { status: 'fulfilled', endpoint: subscription.endpoint, result };
        } catch (error: any) {
          // If subscription has expired, remove it
          if (error.statusCode === 404 || error.statusCode === 410) {
            await base(PUSH_SUBSCRIPTIONS_TABLE).destroy(record.id);
          }
          return { 
            status: 'rejected', 
            endpoint: record.get('endpoint'), 
            error: error.message 
          };
        }
      })
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      message: `Sent ${succeeded} push notifications, ${failed} failed`,
      sentCount: succeeded,
      failedCount: failed,
      details: results,
    });

  } catch (error: any) {
    console.error('Error sending push notifications:', error);
    return new NextResponse(
      JSON.stringify({ success: false, error: error.message || 'Failed to send push notifications' }), 
      { status: 500 }
    );
  }
}