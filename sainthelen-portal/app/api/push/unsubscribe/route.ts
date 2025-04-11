// app/api/push/unsubscribe/route.ts

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
 * POST /api/push/unsubscribe
 * Removes a push subscription
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
    const { endpoint } = body;

    if (!endpoint) {
      return new NextResponse(JSON.stringify({ error: 'Missing endpoint' }), { status: 400 });
    }

    // Find and delete the subscription with this endpoint
    const records = await base(PUSH_SUBSCRIPTIONS_TABLE)
      .select({
        filterByFormula: `{endpoint} = "${endpoint}"`,
        maxRecords: 1
      })
      .all();

    if (records.length > 0) {
      await base(PUSH_SUBSCRIPTIONS_TABLE).destroy(records[0].id);
    } else {
      return new NextResponse(JSON.stringify({ error: 'Subscription not found' }), { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Push subscription removed successfully'
    });

  } catch (error: any) {
    console.error('Error removing push subscription:', error);
    return new NextResponse(
      JSON.stringify({ success: false, error: error.message || 'Failed to remove push subscription' }), 
      { status: 500 }
    );
  }
}