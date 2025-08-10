import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { MINISTRIES } from '../../../config/ministries';

const personalToken = process.env.AIRTABLE_PERSONAL_TOKEN || '';
const baseId = process.env.AIRTABLE_BASE_ID || '';
const ministriesTable = process.env.MINISTRIES_TABLE_NAME || 'Ministries';

function getAirtableBase() {
  if (!personalToken || !baseId) {
    throw new Error('Missing Airtable configuration: AIRTABLE_PERSONAL_TOKEN or AIRTABLE_BASE_ID');
  }
  return new Airtable({ apiKey: personalToken }).base(baseId);
}

export async function POST(request: NextRequest) {
  try {
    const base = getAirtableBase();
    // Get existing ministries to avoid duplicates
    const existingRecords = await base(ministriesTable).select().all();
    const existingNames = existingRecords.map(record => 
      (record.fields.Name as string)?.toLowerCase()
    );

    const ministryRecords = [];
    
    for (const ministry of MINISTRIES) {
      // Skip if ministry already exists
      if (existingNames.includes(ministry.name.toLowerCase())) {
        console.log(`Skipping existing ministry: ${ministry.name}`);
        continue;
      }

      ministryRecords.push({
        fields: {
          Name: ministry.name,
          'Requires Approval': ministry.requiresApproval,
          'Approval Coordinator': ministry.approvalCoordinator || 'adult-discipleship',
          Description: ministry.description || '',
          Active: true, // All config ministries are active by default
        }
      });
    }

    if (ministryRecords.length === 0) {
      return NextResponse.json({ 
        message: 'No new ministries to migrate. All ministries from config already exist.',
        migrated: 0,
        skipped: MINISTRIES.length
      });
    }

    // Create records in batches of 10 (Airtable limit)
    const batchSize = 10;
    let totalCreated = 0;
    
    for (let i = 0; i < ministryRecords.length; i += batchSize) {
      const batch = ministryRecords.slice(i, i + batchSize);
      const createdRecords = await base(ministriesTable).create(batch);
      totalCreated += createdRecords.length;
      console.log(`Created batch of ${createdRecords.length} ministries`);
    }

    return NextResponse.json({ 
      message: `Successfully migrated ${totalCreated} ministries from config to database`,
      migrated: totalCreated,
      skipped: MINISTRIES.length - totalCreated
    });

  } catch (error: any) {
    console.error('Error migrating ministries:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: error.message || 'Failed to migrate ministries',
        details: error.toString()
      }),
      { status: 500 }
    );
  }
}