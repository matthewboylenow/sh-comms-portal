// app/api/admin/fetchCompletedRequests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

// Force dynamic so Next.js doesn't attempt static generation
export const dynamic = 'force-dynamic';

const AIRTABLE_PERSONAL_TOKEN = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';
const ANNOUNCEMENTS_TABLE = process.env.ANNOUNCEMENTS_TABLE_NAME || 'Announcements';
const WEBSITE_UPDATES_TABLE = process.env.WEBSITE_UPDATES_TABLE_NAME || 'Website Updates';
const SMS_REQUESTS_TABLE = process.env.SMS_REQUESTS_TABLE_NAME || 'SMS Requests';
const AV_REQUESTS_TABLE = process.env.AV_REQUESTS_TABLE_NAME || 'A/V Requests';
const FLYER_REVIEWS_TABLE = process.env.FLYER_REVIEW_TABLE_NAME || 'Flyer Reviews';
const GRAPHIC_DESIGN_TABLE = process.env.GRAPHIC_DESIGN_TABLE_NAME || 'Graphic Design Requests';

const base = new Airtable({ apiKey: AIRTABLE_PERSONAL_TOKEN }).base(AIRTABLE_BASE_ID);

/**
 * Returns only records where Completed = true
 */
export async function GET(request: NextRequest) {
  try {
    // Announcements
    const annRecs = await base(ANNOUNCEMENTS_TABLE)
      .select({
        filterByFormula: '{Completed} = TRUE()',
      })
      .all();

    // Website Updates
    const webRecs = await base(WEBSITE_UPDATES_TABLE)
      .select({
        filterByFormula: '{Completed} = TRUE()',
      })
      .all();

    // SMS Requests
    const smsRecs = await base(SMS_REQUESTS_TABLE)
      .select({
        filterByFormula: '{Completed} = TRUE()',
      })
      .all();

    // A/V Requests - With error handling if Completed column doesn't exist yet
    let avRecs;
    try {
      avRecs = await base(AV_REQUESTS_TABLE)
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
      flyerRecs = await base(FLYER_REVIEWS_TABLE)
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
      graphicRecs = await base(GRAPHIC_DESIGN_TABLE)
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