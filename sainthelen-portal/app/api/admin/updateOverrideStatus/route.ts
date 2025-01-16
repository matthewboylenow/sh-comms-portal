// app/api/admin/updateOverrideStatus/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

const personalToken = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const baseId = process.env.AIRTABLE_BASE_ID || '';
const announcementsTable = process.env.ANNOUNCEMENTS_TABLE_NAME || 'Announcements';

const base = new Airtable({ apiKey: personalToken }).base(baseId);

export async function POST(request: NextRequest) {
  try {
    const { recordId, overrideStatus } = await request.json();

    // Update the record in Airtable
    await base(announcementsTable).update([
      {
        id: recordId,
        fields: {
          overrideStatus: overrideStatus,
        },
      },
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating overrideStatus:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
