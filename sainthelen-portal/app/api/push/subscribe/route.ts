// app/api/push/subscribe/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import Airtable from 'airtable';

export const dynamic = 'force-dynamic';

// Environment Variables
const AIRTABLE_PERSONAL_TOKEN = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';
const PUSH_SUBSCRIPTIONS_TABLE = 'PushSubscriptions'; // Table name in Airtable

// Configure Airtable
const base = new Airtable({ apiKey: AIRTABLE_PERSONAL_TOKEN }).base(AIRTABLE_BASE_ID);

/**
 * POST /api/push/subscribe
 * Stores a push subscription for a user
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { subscription, userEmail } = body;

    if (!subscription || !userEmail) {
      return new NextResponse(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Check if a subscription with this endpoint already exists
    const existingRecords = await base(PUSH_SUBSCRIPTIONS_TABLE)
      .select({
        filterByFormula: `{endpoint} = "${subscription.endpoint}"`,
        maxRecords: 1
      })
      .all();

    // If subscription exists, update it
    if (existingRecords.length > 0) {
      await base(PUSH_SUBSCRIPTIONS_TABLE).update(existingRecords[0].id, {
        subscription: JSON.stringify(subscription),
        userEmail,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Otherwise create a new subscription
      await base(PUSH_SUBSCRIPTIONS_TABLE).create({
        endpoint: subscription.endpoint,
        subscription: JSON.stringify(subscription),
        userEmail,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Push subscription saved successfully'
    });

  } catch (error: any) {
    console.error('Error saving push subscription:', error);
    return new NextResponse(
      JSON.stringify({ success: false, error: error.message || 'Failed to save push subscription' }), 
      { status: 500 }
    );
  }
}