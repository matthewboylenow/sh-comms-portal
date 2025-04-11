// app/api/push/update-subscription/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

export const dynamic = 'force-dynamic';

// Environment Variables
const AIRTABLE_PERSONAL_TOKEN = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';
const PUSH_SUBSCRIPTIONS_TABLE = 'PushSubscriptions'; // Table name in Airtable

// Configure Airtable
const base = new Airtable({ apiKey: AIRTABLE_PERSONAL_TOKEN }).base(AIRTABLE_BASE_ID);

/**
 * POST /api/push/update-subscription
 * Updates a push subscription when it changes
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { oldSubscription, newSubscription } = body;

    if (!newSubscription) {
      return new NextResponse(JSON.stringify({ error: 'Missing new subscription' }), { status: 400 });
    }

    let parsedNewSubscription;
    try {
      parsedNewSubscription = typeof newSubscription === 'string' 
        ? JSON.parse(newSubscription) 
        : newSubscription;
    } catch (err) {
      return new NextResponse(JSON.stringify({ error: 'Invalid subscription format' }), { status: 400 });
    }

    // If we have an old subscription, find and update it
    if (oldSubscription) {
      let parsedOldSubscription;
      try {
        parsedOldSubscription = typeof oldSubscription === 'string' 
          ? JSON.parse(oldSubscription) 
          : oldSubscription;
      } catch (err) {
        return new NextResponse(JSON.stringify({ error: 'Invalid old subscription format' }), { status: 400 });
      }

      const records = await base(PUSH_SUBSCRIPTIONS_TABLE)
        .select({
          filterByFormula: `{endpoint} = "${parsedOldSubscription.endpoint}"`,
          maxRecords: 1
        })
        .all();

      if (records.length > 0) {
        const record = records[0];
        const userEmail = record.get('userEmail') as string;

        // Delete the old record
        await base(PUSH_SUBSCRIPTIONS_TABLE).destroy(record.id);

        // Create a new record with the new subscription
        await base(PUSH_SUBSCRIPTIONS_TABLE).create({
          endpoint: parsedNewSubscription.endpoint,
          subscription: JSON.stringify(parsedNewSubscription),
          userEmail,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Push subscription updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating push subscription:', error);
    return new NextResponse(
      JSON.stringify({ success: false, error: error.message || 'Failed to update push subscription' }), 
      { status: 500 }
    );
  }
}