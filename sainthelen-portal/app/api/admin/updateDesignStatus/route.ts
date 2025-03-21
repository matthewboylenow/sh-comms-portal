// app/api/admin/updateDesignStatus/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

const personalToken = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const baseId = process.env.AIRTABLE_BASE_ID || '';
const graphicDesignTable = process.env.GRAPHIC_DESIGN_TABLE_NAME || 'Graphic Design Requests';

const base = new Airtable({ apiKey: personalToken }).base(baseId);

export async function POST(request: NextRequest) {
  try {
    const { recordId, status } = await request.json();
    console.log(`Updating design status for record ${recordId} to ${status}`);

    // Update the status in Airtable
    const response = await base(graphicDesignTable).update([
      {
        id: recordId,
        fields: {
          "Status": status
        },
      },
    ]);

    console.log('Airtable update response:', response);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating design status:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}