// app/api/admin/updateDesignStatus/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

// Force dynamic so Next.js doesn't attempt static generation
export const dynamic = 'force-dynamic';

const AIRTABLE_PERSONAL_TOKEN = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';
const GRAPHIC_DESIGN_TABLE = process.env.GRAPHIC_DESIGN_TABLE_NAME || 'Graphic Design Requests';

const base = new Airtable({ apiKey: AIRTABLE_PERSONAL_TOKEN }).base(AIRTABLE_BASE_ID);

export async function POST(request: NextRequest) {
  try {
    const { recordId, status } = await request.json();

    if (!recordId || !status) {
      return NextResponse.json(
        { success: false, error: 'Record ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['Pending', 'In Design', 'Review', 'Completed', 'Canceled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Update Status in Airtable
    await base(GRAPHIC_DESIGN_TABLE).update([
      {
        id: recordId,
        fields: {
          Status: status,
          // Also automatically update Completed checkbox if status is Completed
          ...(status === 'Completed' ? { Completed: true } : {})
        },
      },
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in updateDesignStatus route:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update status' },
      { status: 500 }
    );
  }
}