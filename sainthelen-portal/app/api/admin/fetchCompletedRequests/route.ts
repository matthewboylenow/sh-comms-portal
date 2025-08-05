// app/api/admin/fetchCompletedRequests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAirtableBase, TABLE_NAMES } from '../../../lib/airtable';

// Force dynamic so Next.js doesn't attempt static generation
export const dynamic = 'force-dynamic';

// Base will be initialized in functions to avoid build-time execution

/**
 * Returns only records where Completed = true
 */
export async function GET(request: NextRequest) {
  try {
    const base = getAirtableBase();
    
    // Announcements
    const annRecs = await base(TABLE_NAMES.ANNOUNCEMENTS)
      .select({
        filterByFormula: '{Completed} = TRUE()',
      })
      .all();

    // Website Updates
    const webRecs = await base(TABLE_NAMES.WEBSITE_UPDATES)
      .select({
        filterByFormula: '{Completed} = TRUE()',
      })
      .all();

    // SMS Requests
    const smsRecs = await base(TABLE_NAMES.SMS_REQUESTS)
      .select({
        filterByFormula: '{Completed} = TRUE()',
      })
      .all();

    // A/V Requests - With error handling if Completed column doesn't exist yet
    let avRecs;
    try {
      avRecs = await base(TABLE_NAMES.AV_REQUESTS)
        .select({
          filterByFormula: '{Completed} = TRUE()',
        })
        .all();
    } catch (error) {
      console.warn('Could not filter A/V Requests by Completed - column may not exist');
      avRecs = [];
    }

    // Flyer Reviews - With error handling if Completed column doesn't exist yet
    let flyerRecs;
    try {
      flyerRecs = await base('Flyer Reviews')
        .select({
          filterByFormula: '{Completed} = TRUE()',
        })
        .all();
    } catch (error) {
      console.warn('Could not filter Flyer Reviews by Completed - column may not exist');
      flyerRecs = [];
    }
    
    // Graphic Design Requests
    let graphicRecs;
    try {
      graphicRecs = await base(TABLE_NAMES.GRAPHIC_DESIGN)
        .select({
          filterByFormula: '{Completed} = TRUE()',
        })
        .all();
    } catch (error) {
      console.warn('Could not filter Graphic Design by Completed - table may not exist yet');
      graphicRecs = [];
    }

    return NextResponse.json({
      announcements: annRecs.map((r) => ({ id: r.id, fields: r.fields })),
      websiteUpdates: webRecs.map((r) => ({ id: r.id, fields: r.fields })),
      smsRequests: smsRecs.map((r) => ({ id: r.id, fields: r.fields })),
      avRequests: avRecs.map((r) => ({ id: r.id, fields: r.fields })),
      flyerReviews: flyerRecs.map((r) => ({ id: r.id, fields: r.fields })),
      graphicDesign: graphicRecs.map((r) => ({ id: r.id, fields: r.fields })),
    });
  } catch (error: any) {
    console.error('Error fetching completed requests:', error);
    return NextResponse.json(
      { error: error.message || 'Error fetching completed' },
      { status: 500 }
    );
  }
}